import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import logger from '../utils/logger.js';

const LOYALTY_POINTS_PER_RUPEE = 1;
const LOYALTY_REDEMPTION_RATE = 100; // 100 points = ₹1

export const findOrCreateCustomer = async (req, res, next) => {
    try {
        const { restaurantId, phone, name } = req.body;

        if (!restaurantId || !phone) {
            return res.status(400).json({ success: false, message: 'Restaurant ID and phone are required' });
        }

        let customer = await Customer.findOne({ restaurant: restaurantId, phone });

        if (!customer) {
            customer = await Customer.create({
                restaurant: restaurantId,
                phone,
                name: name || '',
                firstVisit: new Date(),
                lastVisit: new Date()
            });
        } else if (name && !customer.name) {
            customer.name = name;
            await customer.save();
        }

        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

export const listCustomers = async (req, res, next) => {
    try {
        const { restaurantId, search, page = 1, limit = 20 } = req.query;

        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
        }

        const query = { restaurant: restaurantId };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        const [customers, total] = await Promise.all([
            Customer.find(query)
                .sort({ lastVisit: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit)),
            Customer.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: {
                customers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getCustomerDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { restaurantId } = req.query;

        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
        }

        const customer = await Customer.findOne({ _id: id, restaurant: restaurantId });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const orders = await Order.find({
            restaurant: restaurantId,
            customerPhone: customer.phone
        }).populate('table', 'name').sort({ createdAt: -1 }).limit(50);

        res.status(200).json({
            success: true,
            data: { customer, orders }
        });
    } catch (error) {
        next(error);
    }
};

export const updateCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, birthday, anniversary, notes, tags } = req.body;

        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        if (name !== undefined) customer.name = name;
        if (email !== undefined) customer.email = email;
        if (birthday !== undefined) customer.birthday = birthday ? new Date(birthday) : undefined;
        if (anniversary !== undefined) customer.anniversary = anniversary ? new Date(anniversary) : undefined;
        if (notes !== undefined) customer.notes = notes;
        if (tags !== undefined) customer.tags = tags;

        await customer.save();

        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

export const getCustomerOrders = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { restaurantId } = req.query;

        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
        }

        const customer = await Customer.findOne({ _id: id, restaurant: restaurantId });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const orders = await Order.find({
            restaurant: restaurantId,
            customerPhone: customer.phone
        }).populate('table', 'name').sort({ createdAt: -1 }).limit(50);

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
};

export const getLoyaltySettings = async (req, res, next) => {
    res.status(200).json({
        success: true,
        data: {
            pointsPerRupee: LOYALTY_POINTS_PER_RUPEE,
            redemptionRate: LOYALTY_REDEMPTION_RATE
        }
    });
};

export const addLoyaltyPoints = async (restaurantId, customerPhone, orderTotal, orderId) => {
    try {
        const customer = await Customer.findOne({ restaurant: restaurantId, phone: customerPhone });
        if (!customer) return null;

        const pointsToAdd = Math.floor(orderTotal * LOYALTY_POINTS_PER_RUPEE);

        customer.loyaltyPoints += pointsToAdd;
        customer.totalVisits += 1;
        customer.totalSpent += orderTotal;
        customer.lastVisit = new Date();
        if (!customer.firstVisit) customer.firstVisit = new Date();
        if (orderId) customer.lastOrderId = orderId;

        await customer.save();

        logger.info(`Loyalty: ${pointsToAdd} points added to ${customerPhone} (total: ${customer.loyaltyPoints})`);

        return { pointsAdded: pointsToAdd, totalPoints: customer.loyaltyPoints };
    } catch (error) {
        logger.error(`Loyalty points error: ${error.message}`);
        return null;
    }
};

export const redeemLoyaltyPoints = async (req, res, next) => {
    try {
        const { customerId, pointsToRedeem, restaurantId } = req.body;

        if (!customerId || !pointsToRedeem || !restaurantId) {
            return res.status(400).json({ success: false, message: 'customerId, pointsToRedeem, and restaurantId required' });
        }

        const customer = await Customer.findOne({ _id: customerId, restaurant: restaurantId });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        if (customer.loyaltyPoints < pointsToRedeem) {
            return res.status(400).json({ success: false, message: 'Insufficient points' });
        }

        const discountValue = Math.floor(pointsToRedeem / LOYALTY_REDEMPTION_RATE);
        customer.loyaltyPoints -= pointsToRedeem;
        await customer.save();

        logger.info(`Loyalty: ${pointsToRedeem} points redeemed by ${customer.phone} for ₹${discountValue}`);

        res.status(200).json({
            success: true,
            data: {
                pointsRedeemed: pointsToRedeem,
                discountValue,
                remainingPoints: customer.loyaltyPoints
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getBirthdayCustomers = async (req, res, next) => {
    try {
        const { restaurantId } = req.query;

        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
        }

        const today = new Date();
        const todayMonth = today.getMonth() + 1;
        const todayDay = today.getDate();

        const customers = await Customer.find({
            restaurant: restaurantId,
            birthday: { $exists: true, $ne: null },
            $expr: {
                $and: [
                    { $eq: [{ $month: '$birthday' }, todayMonth] },
                    { $eq: [{ $dayOfMonth: '$birthday' }, todayDay] }
                ]
            }
        });

        res.status(200).json({ success: true, data: customers });
    } catch (error) {
        next(error);
    }
};
