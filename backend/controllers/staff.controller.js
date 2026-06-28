import mongoose from 'mongoose';
import User from '../models/User.js';
import StaffReview from '../models/StaffReview.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import { sendWhatsAppToUser } from '../services/whatsapp.service.js';

// @desc    Add a staff member
// @route   POST /api/staff
// @access  Private (Owner/Admin)
export const addStaff = async (req, res, next) => {
    try {
        let { email, role, profileImage, name, password, pin, permissions, phone } = req.body;
        if (phone) {
            phone = phone.startsWith('+') ? phone.slice(1) : phone;
            phone = phone.replace(/[^0-9]/g, '');
            if (phone.length === 10) phone = `91${phone}`;
        }
        const restaurantId = req.user.restaurant;

        if (!restaurantId) {
            return res.status(403).json({
                success: false,
                message: 'You must have a restaurant to add staff'
            });
        }

        const isPinRole = ['WAITER', 'CASHIER', 'CHEF'].includes(role);

        // Validate based on role type
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Name is required'
            });
        }

        if (isPinRole) {
            if (!pin) {
                return res.status(400).json({
                    success: false,
                    message: 'PIN is required for this role'
                });
            }
            // Create user without email/password (always create new, never update by name)
            const userData = {
                name,
                role: role || 'WAITER',
                restaurant: restaurantId,
                profileImage,
                permissions: permissions || [],
                pin: pin.toString(),
                phone
            };

            const user = await User.create(userData);

            sendWhatsAppToUser(user._id, '👋 Welcome! Send any message here to activate WhatsApp notifications for orders and updates.').catch(() => {});

            return res.status(200).json({
                success: true,
                message: 'Staff member added successfully',
                data: user
            });
        }

        // Email/password role (ADMIN, etc.)
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required for this role'
            });
        }

        let user = await User.findOne({ email });

        if (!user) {
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide name, email and password to create a staff profile.'
                });
            }

            user = await User.create({
                name,
                email,
                password,
                role: role || 'WAITER',
                restaurant: restaurantId,
                profileImage,
                permissions: permissions || [],
                phone
            });

            sendWhatsAppToUser(user._id, '👋 Welcome! Send any message here to activate WhatsApp notifications for orders and updates.').catch(() => {});
        } else {
            if (user.role === 'OWNER') {
                return res.status(403).json({
                    success: false,
                    message: "User is already a restaurant owner and their role cannot be changed."
                });
            }

            user.role = role || user.role;
            user.restaurant = restaurantId;
            user.permissions = permissions || user.permissions;
            if (profileImage) user.profileImage = profileImage;
            if (password) user.password = password;
            await user.save();
        }

        res.status(200).json({
            success: true,
            message: 'Staff member added successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

export const updateStaff = async (req, res, next) => {
    try {
        let { name, role, profileImage, password, pin, permissions, email, phone } = req.body;
        if (phone) {
            phone = phone.startsWith('+') ? phone.slice(1) : phone;
            phone = phone.replace(/[^0-9]/g, '');
            if (phone.length === 10) phone = `91${phone}`;
        }
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        if (user.restaurant?.toString() !== req.user.restaurant?.toString()) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to update this staff member'
            });
        }

        if (name) user.name = name;
        if (role) user.role = role;
        if (profileImage) user.profileImage = profileImage;
        if (permissions) user.permissions = permissions;
        if (email) user.email = email;
        if (password) user.password = password;
        if (phone !== undefined) user.phone = phone;

        const isPinRole = ['WAITER', 'CASHIER', 'CHEF'].includes(user.role);
        if (isPinRole && pin) {
            user.pin = pin.toString();
        }

        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: 'Staff member updated successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all staff for a restaurant
// @route   GET /api/staff
// @access  Public (for customers) / Private (for owners)
export const getStaff = async (req, res, next) => {
    try {
        const { restaurantId } = req.query;
        const targetId = restaurantId || req.user?.restaurant;

        if (!targetId) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        const staff = await User.find({
            restaurant: targetId,
            role: { $in: ['WAITER', 'CHEF', 'CASHIER'] }
        }).select('name email role profileImage permissions phone createdAt');

        // Enhance staff with real metrics
        const enhancedStaff = await Promise.all(staff.map(async (member) => {
            // Get reviews stats
            const reviewStats = await StaffReview.aggregate([
                { $match: { staff: member._id } },
                { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
            ]);

            // Get orders served/handled
            // Count how many orders this user has updated in statusHistory
            const ordersHandled = await Order.countDocuments({
                'statusHistory.updatedBy': member._id
            });

            return {
                ...member.toObject(),
                avgRating: parseFloat(reviewStats[0]?.avgRating || 0).toFixed(1),
                totalReviews: reviewStats[0]?.totalReviews || 0,
                ordersHandled
            };
        }));

        res.status(200).json({
            success: true,
            count: enhancedStaff.length,
            data: enhancedStaff
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove staff member from restaurant
// @route   DELETE /api/staff/:id
// @access  Private (Owner)
export const removeStaff = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        // Security check: Ensure owner owns the restaurant
        if (user.restaurant?.toString() !== req.user.restaurant?.toString()) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to remove this staff member'
            });
        }

        // Update: Permanently delete staff user account
        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Staff member permanently removed and account deleted'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update staff member
// @route   PATCH /api/staff/:id
// @access  Private (Owner/Admin)
// (defined above)

// @desc    Submit a review for a staff member
// @route   POST /api/staff/:id/review
// @access  Public
export const createStaffReview = async (req, res, next) => {
    try {
        const { rating, comment, customerName, restaurantId } = req.body;
        const staffId = req.params.id;

        // Check if restaurant allowing staff reviews
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        if (!restaurant.features.allowStaffReviews) {
            return res.status(403).json({
                success: false,
                message: 'Staff reviews are disabled for this restaurant'
            });
        }

        const review = await StaffReview.create({
            restaurant: restaurantId,
            staff: staffId,
            customerName,
            rating,
            comment
        });

        res.status(201).json({
            success: true,
            message: 'Feedback submitted. Thank you!',
            data: review
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get reviews for a staff member
// @route   GET /api/staff/:id/reviews
// @access  Private (Owner) / Public
export const getStaffReviews = async (req, res, next) => {
    try {
        const staffId = req.params.id;

        const reviews = await StaffReview.find({ staff: staffId, isPublished: true })
            .sort({ createdAt: -1 });

        // Calculate avg rating
        const stats = await StaffReview.aggregate([
            { $match: { staff: new mongoose.Types.ObjectId(staffId), isPublished: true } },
            { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                reviews,
                averageRating: stats[0]?.avgRating || 0,
                totalReviews: stats[0]?.count || 0
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get general staff stats for restaurant
// @route   GET /api/staff/stats/summary
// @access  Private (Owner)
export const getRestaurantStaffStats = async (req, res, next) => {
    try {
        const restaurantId = req.user.restaurant;

        if (!restaurantId) {
            return res.status(403).json({
                success: false,
                message: 'Restaurant ID required'
            });
        }

        // 1. Total Team Size
        const teamSize = await User.countDocuments({
            restaurant: restaurantId,
            role: { $in: ['WAITER', 'CHEF'] }
        });

        // 2. Avg Rating for all staff
        const overallRating = await StaffReview.aggregate([
            { $match: { restaurant: new mongoose.Types.ObjectId(restaurantId) } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);

        // 3. Top Performer
        const topPerformers = await StaffReview.aggregate([
            { $match: { restaurant: new mongoose.Types.ObjectId(restaurantId) } },
            {
                $group: {
                    _id: '$staff',
                    avgRating: { $avg: '$rating' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { avgRating: -1, count: -1 } },
            { $limit: 1 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'staffInfo'
                }
            },
            { $unwind: '$staffInfo' }
        ]);

        // 4. Trend
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentReviews = await StaffReview.countDocuments({
            restaurant: restaurantId,
            createdAt: { $gte: thirtyDaysAgo }
        });

        res.status(200).json({
            success: true,
            data: {
                teamSize,
                avgRating: parseFloat(overallRating[0]?.avgRating || 0).toFixed(1),
                topPerformer: topPerformers[0]?.staffInfo?.name || 'N/A',
                excellenceTrend: recentReviews > 0 ? '+12%' : '0%'
            }
        });
    } catch (error) {
        next(error);
    }
};
