import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import ActivityLog from '../models/ActivityLog.js';
import logger from '../utils/logger.js';
import { logActivity } from '../utils/activityLogger.js';

export const getDashboard = async (req, res, next) => {
    try {
        const totalRestaurants = await Restaurant.countDocuments({ isDeleted: { $ne: true } });
        const activeRestaurants = await Restaurant.countDocuments({ isActive: true, isDeleted: { $ne: true } });
        const totalUsers = await User.countDocuments({ role: { $nin: ['SUPER_ADMIN', 'CUSTOMER'] } });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });

        res.status(200).json({
            success: true,
            data: {
                totalRestaurants,
                activeRestaurants,
                totalUsers,
                todayOrders
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getRestaurants = async (req, res, next) => {
    try {
        const restaurants = await Restaurant.find({ isDeleted: { $ne: true } })
            .populate('owner', 'name email phone')
            .sort({ createdAt: -1 });

        const enriched = await Promise.all(restaurants.map(async (r) => {
            const staffCount = await User.countDocuments({
                restaurant: r._id,
                role: { $in: ['WAITER', 'CHEF', 'CASHIER'] }
            });
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayRevenue = await Order.aggregate([
                { $match: { restaurant: r._id, createdAt: { $gte: today }, paymentStatus: 'PAID' } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]);
            const totalOrders = await Order.countDocuments({ restaurant: r._id });
            const totalMenuItems = await mongoose.model('MenuItem').countDocuments({ restaurant: r._id, isDeleted: { $ne: true } });
            const activeTables = await mongoose.model('Table').countDocuments({ restaurant: r._id, status: { $ne: 'FREE' } });
            return {
                ...r.toObject(),
                staffCount,
                todayRevenue: todayRevenue[0]?.total || 0,
                totalOrders,
                totalMenuItems,
                activeTables
            };
        }));

        res.status(200).json({ success: true, count: enriched.length, data: enriched });
    } catch (error) {
        next(error);
    }
};

export const getRestaurantStats = async (req, res, next) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            todayOrders,
            weekOrders,
            monthOrders,
            totalOrders,
            todayRevenue,
            weekRevenue,
            monthRevenue,
            staffCount,
            totalMenuItems,
            activeTables,
            totalTables,
            totalCustomers
        ] = await Promise.all([
            Order.countDocuments({ restaurant: id, createdAt: { $gte: todayStart } }),
            Order.countDocuments({ restaurant: id, createdAt: { $gte: weekStart } }),
            Order.countDocuments({ restaurant: id, createdAt: { $gte: monthStart } }),
            Order.countDocuments({ restaurant: id }),
            Order.aggregate([
                { $match: { restaurant: new mongoose.Types.ObjectId(id), createdAt: { $gte: todayStart }, paymentStatus: 'PAID' } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            Order.aggregate([
                { $match: { restaurant: new mongoose.Types.ObjectId(id), createdAt: { $gte: weekStart }, paymentStatus: 'PAID' } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            Order.aggregate([
                { $match: { restaurant: new mongoose.Types.ObjectId(id), createdAt: { $gte: monthStart }, paymentStatus: 'PAID' } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            User.countDocuments({ restaurant: id, role: { $in: ['WAITER', 'CHEF', 'CASHIER'] } }),
            mongoose.model('MenuItem').countDocuments({ restaurant: id, isDeleted: { $ne: true } }),
            mongoose.model('Table').countDocuments({ restaurant: id, status: { $ne: 'FREE' } }),
            mongoose.model('Table').countDocuments({ restaurant: id }),
            mongoose.model('Customer').countDocuments({ restaurant: id })
        ]);

        res.status(200).json({
            success: true,
            data: {
                restaurant: { name: restaurant.name, code: restaurant.code },
                orders: { today: todayOrders, week: weekOrders, month: monthOrders, total: totalOrders },
                revenue: {
                    today: todayRevenue[0]?.total || 0,
                    week: weekRevenue[0]?.total || 0,
                    month: monthRevenue[0]?.total || 0
                },
                staff: { count: staffCount },
                menu: { items: totalMenuItems },
                tables: { active: activeTables, total: totalTables },
                customers: totalCustomers
            }
        });
    } catch (error) {
        next(error);
    }
};

export const createRestaurant = async (req, res, next) => {
    try {
        const { name, ownerEmail, ownerName, ownerPassword, phone, address, cuisine } = req.body;

        if (!name || !ownerEmail) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant name and owner email are required'
            });
        }

        // Find or create owner user
        let owner = await User.findOne({ email: ownerEmail.toLowerCase() });

        if (!owner) {
            if (!ownerPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Owner password is required for new user registration'
                });
            }
            owner = await User.create({
                name: ownerName || ownerEmail.split('@')[0],
                email: ownerEmail.toLowerCase(),
                password: ownerPassword,
                role: 'OWNER',
                emailVerified: true
            });
        } else if (owner.role !== 'OWNER') {
            return res.status(400).json({
                success: false,
                message: 'User exists but is not an OWNER. Cannot assign restaurant.'
            });
        } else if (owner.restaurant) {
            return res.status(400).json({
                success: false,
                message: 'Owner already has a restaurant assigned'
            });
        }

        // Create restaurant
        const restaurantData = {
            name,
            owner: owner._id,
            phone: phone || '',
            address: address || {},
            cuisine: cuisine || '',
            isActive: true
        };

        const restaurant = await Restaurant.create(restaurantData);

        // Link owner to restaurant
        owner.restaurant = restaurant._id;
        await owner.save();

        // Give initial ₹10 WhatsApp credits
        try {
            const WhatsAppCredit = mongoose.model('WhatsAppCredit');
            const CreditTransaction = mongoose.model('CreditTransaction');
            await WhatsAppCredit.create({
                restaurant: restaurant._id,
                balance: 10,
                totalCredited: 10
            });
            await CreditTransaction.create({
                restaurant: restaurant._id,
                type: 'credit',
                amount: 10,
                balanceBefore: 0,
                balanceAfter: 10,
                messageType: 'initial_credit',
                description: 'Initial free credits'
            });
        } catch (err) {
            logger.error(`Failed to create initial WhatsApp credits for ${restaurant.name}: ${err.message}`);
        }

        logActivity({
            action: 'created restaurant',
            performedBy: req.user._id,
            targetType: 'restaurant',
            targetId: restaurant._id,
            targetName: restaurant.name,
            details: { code: restaurant.code, ownerEmail: owner.email }
        });

        res.status(201).json({
            success: true,
            message: `Restaurant "${name}" created with code ${restaurant.code}`,
            data: {
                restaurant: { ...restaurant.toObject(), code: restaurant.code },
                owner: { id: owner._id, name: owner.name, email: owner.email }
            }
        });
    } catch (error) {
        next(error);
    }
};

export const toggleRestaurantStatus = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }
        restaurant.isActive = !restaurant.isActive;
        await restaurant.save();

        // Also toggle all users of this restaurant (owner, staff, etc.)
        await User.updateMany(
            { restaurant: restaurant._id },
            { isActive: restaurant.isActive }
        );

        const action = restaurant.isActive ? 'activated' : 'blocked';
        logger.info(`SUPER_ADMIN ${action} restaurant: ${restaurant.name}, ${restaurant.isActive ? 'unblocked' : 'blocked'} all users`);

        logActivity({
            action: `${action} restaurant`,
            performedBy: req.user._id,
            targetType: 'restaurant',
            targetId: restaurant._id,
            targetName: restaurant.name,
            details: { isActive: restaurant.isActive }
        });

        res.status(200).json({
            success: true,
            message: `Restaurant ${action}. All staff accounts ${action === 'activated' ? 'unblocked' : 'blocked'} successfully.`,
            data: restaurant
        });
    } catch (error) {
        next(error);
    }
};

export const getUsers = async (req, res, next) => {
    try {
        const { restaurantId, role, status } = req.query;
        const filter = {};
        if (restaurantId) filter.restaurant = restaurantId;
        if (role) filter.role = role;
        if (status === 'active') filter.isActive = true;
        if (status === 'blocked') filter.isActive = false;

        const users = await User.find(filter)
            .populate('restaurant', 'name code')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        next(error);
    }
};

export const deleteRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        const name = restaurant.name;
        const code = restaurant.code;

        // Soft-delete: mark as deleted and deactivate users
        restaurant.isDeleted = true;
        restaurant.deletedAt = new Date();
        restaurant.isActive = false;
        await restaurant.save();

        // Deactivate all users instead of deleting them
        await User.updateMany(
            { restaurant: restaurant._id },
            { isActive: false }
        );

        logger.info(`SUPER_ADMIN soft-deleted restaurant: ${name} (${code})`);

        logActivity({
            action: 'deleted restaurant',
            performedBy: req.user._id,
            targetType: 'restaurant',
            targetId: restaurant._id,
            targetName: name,
            details: { code, permanent: false }
        });

        res.status(200).json({
            success: true,
            message: `Restaurant "${name}" deleted. It will be permanently removed after 24 hours.`
        });
    } catch (error) {
        next(error);
    }
};

export const getDeletedRestaurants = async (req, res, next) => {
    try {
        const restaurants = await Restaurant.find({ isDeleted: true })
            .populate('owner', 'name email phone')
            .sort({ deletedAt: -1 });

        const enriched = await Promise.all(restaurants.map(async (r) => {
            const hoursSinceDelete = r.deletedAt
                ? Math.floor((Date.now() - r.deletedAt.getTime()) / (1000 * 60 * 60))
                : null;
            const hoursRemaining = hoursSinceDelete !== null ? Math.max(0, 24 - hoursSinceDelete) : null;
            return {
                ...r.toObject(),
                hoursSinceDelete,
                hoursRemaining,
                expiresAt: r.deletedAt ? new Date(r.deletedAt.getTime() + 24 * 60 * 60 * 1000) : null
            };
        }));

        res.status(200).json({ success: true, count: enriched.length, data: enriched });
    } catch (error) {
        next(error);
    }
};

export const restoreRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant || !restaurant.isDeleted) {
            return res.status(404).json({ success: false, message: 'Deleted restaurant not found' });
        }

        restaurant.isDeleted = false;
        restaurant.deletedAt = null;
        restaurant.isActive = true;
        await restaurant.save();

        // Reactivate all users
        await User.updateMany(
            { restaurant: restaurant._id },
            { isActive: true }
        );

        logger.info(`SUPER_ADMIN restored restaurant: ${restaurant.name}`);

        logActivity({
            action: 'restored restaurant',
            performedBy: req.user._id,
            targetType: 'restaurant',
            targetId: restaurant._id,
            targetName: restaurant.name,
            details: {}
        });

        res.status(200).json({
            success: true,
            message: `Restaurant "${restaurant.name}" restored successfully.`,
            data: restaurant
        });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.role === 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Cannot delete super admin' });
        }

        // If owner, unlink restaurant
        if (user.role === 'OWNER' && user.restaurant) {
            await Restaurant.findByIdAndUpdate(user.restaurant, { $unset: { owner: '' } });
        }

        await User.findByIdAndDelete(req.params.id);

        logger.info(`SUPER_ADMIN deleted user: ${user.email} (${user.role})`);

        logActivity({
            action: 'deleted user',
            performedBy: req.user._id,
            targetType: 'user',
            targetId: user._id,
            targetName: user.email,
            details: { role: user.role, name: user.name }
        });

        res.status(200).json({
            success: true,
            message: `User ${user.email} deleted successfully`
        });
    } catch (error) {
        next(error);
    }
};

export const toggleUserStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.role === 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Cannot block super admin' });
        }
        user.isActive = !user.isActive;
        await user.save();

        logActivity({
            action: `${user.isActive ? 'unblocked' : 'blocked'} user`,
            performedBy: req.user._id,
            targetType: 'user',
            targetId: user._id,
            targetName: user.email,
            details: { role: user.role, name: user.name, isActive: user.isActive }
        });

        res.status(200).json({
            success: true,
            message: `User ${user.isActive ? 'unblocked' : 'blocked'} successfully`,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

export const bulkToggleRestaurants = async (req, res, next) => {
    try {
        const { ids, action } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Provide an array of restaurant IDs' });
        }
        if (!['block', 'unblock'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Action must be "block" or "unblock"' });
        }

        const isActive = action === 'unblock';
        const updateResult = await Restaurant.updateMany(
            { _id: { $in: ids }, isDeleted: { $ne: true } },
            { isActive }
        );

        // Also update all users of these restaurants
        for (const id of ids) {
            await User.updateMany({ restaurant: id }, { isActive });
        }

        logActivity({
            action: `bulk ${action} restaurants`,
            performedBy: req.user._id,
            targetType: 'system',
            targetName: `${ids.length} restaurants`,
            details: { ids, action, count: updateResult.modifiedCount }
        });

        logger.info(`SUPER_ADMIN bulk ${action} ${ids.length} restaurant(s)`);

        res.status(200).json({
            success: true,
            message: `${updateResult.modifiedCount} restaurant(s) ${action === 'unblock' ? 'unblocked' : 'blocked'}`
        });
    } catch (error) {
        next(error);
    }
};

export const bulkDeleteRestaurants = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Provide an array of restaurant IDs' });
        }

        const now = new Date();
        const updateResult = await Restaurant.updateMany(
            { _id: { $in: ids }, isDeleted: { $ne: true } },
            { isDeleted: true, deletedAt: now, isActive: false }
        );

        // Deactivate all users of these restaurants
        for (const id of ids) {
            await User.updateMany({ restaurant: id }, { isActive: false });
        }

        logActivity({
            action: 'bulk delete restaurants',
            performedBy: req.user._id,
            targetType: 'system',
            targetName: `${ids.length} restaurants`,
            details: { ids, count: updateResult.modifiedCount }
        });

        logger.info(`SUPER_ADMIN bulk deleted ${ids.length} restaurant(s)`);

        res.status(200).json({
            success: true,
            message: `${updateResult.modifiedCount} restaurant(s) soft-deleted. Will be permanently removed after 24 hours.`
        });
    } catch (error) {
        next(error);
    }
};

export const bulkToggleUsers = async (req, res, next) => {
    try {
        const { ids, action } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Provide an array of user IDs' });
        }
        if (!['activate', 'deactivate'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Action must be "activate" or "deactivate"' });
        }

        const isActive = action === 'activate';
        // Don't block SUPER_ADMIN
        const updateResult = await User.updateMany(
            { _id: { $in: ids }, role: { $ne: 'SUPER_ADMIN' } },
            { isActive }
        );

        logActivity({
            action: `bulk ${action} users`,
            performedBy: req.user._id,
            targetType: 'system',
            targetName: `${ids.length} users`,
            details: { ids, action, count: updateResult.modifiedCount }
        });

        logger.info(`SUPER_ADMIN bulk ${action} ${ids.length} user(s)`);

        res.status(200).json({
            success: true,
            message: `${updateResult.modifiedCount} user(s) ${action}d`
        });
    } catch (error) {
        next(error);
    }
};

export const bulkDeleteUsers = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Provide an array of user IDs' });
        }

        // Don't delete SUPER_ADMIN
        const deleteResult = await User.deleteMany({
            _id: { $in: ids },
            role: { $ne: 'SUPER_ADMIN' }
        });

        // Unlink owners from restaurants
        for (const id of ids) {
            const user = await User.findById(id).select('role restaurant');
            if (user?.role === 'OWNER' && user?.restaurant) {
                await Restaurant.findByIdAndUpdate(user.restaurant, { $unset: { owner: '' } });
            }
        }

        logActivity({
            action: 'bulk delete users',
            performedBy: req.user._id,
            targetType: 'system',
            targetName: `${ids.length} users`,
            details: { ids, count: deleteResult.deletedCount }
        });

        logger.info(`SUPER_ADMIN bulk deleted ${ids.length} user(s)`);

        res.status(200).json({
            success: true,
            message: `${deleteResult.deletedCount} user(s) deleted`
        });
    } catch (error) {
        next(error);
    }
};

export const resetUserPassword = async (req, res, next) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const user = await User.findById(req.params.id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.role === 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Cannot reset super admin password' });
        }

        user.password = newPassword;
        // Invalidate existing refresh tokens so user must login again
        user.refreshToken = null;
        await user.save();

        logActivity({
            action: 'reset user password',
            performedBy: req.user._id,
            targetType: 'user',
            targetId: user._id,
            targetName: user.email,
            details: { role: user.role }
        });

        logger.info(`SUPER_ADMIN reset password for user: ${user.email}`);

        res.status(200).json({
            success: true,
            message: `Password reset for ${user.email}. User must login with new password.`
        });
    } catch (error) {
        next(error);
    }
};

export const getActivities = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const [activities, total] = await Promise.all([
            ActivityLog.find()
                .populate('performedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ActivityLog.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            data: activities,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getSystemHealth = async (req, res, next) => {
    try {
        const dbState = mongoose.connection.readyState;
        const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

        res.status(200).json({
            success: true,
            data: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                nodeVersion: process.version,
                dbStatus: dbStatus[dbState],
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
};
