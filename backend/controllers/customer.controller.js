import mongoose from 'mongoose';
import Order from '../models/Order.js';
import logger from '../utils/logger.js';

export const listCustomers = async (req, res, next) => {
    try {
        const { restaurantId } = req.query;
        const { search, page = 1, limit = 20 } = req.query;

        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
        }

        const match = { restaurant: new mongoose.Types.ObjectId(restaurantId) };
        if (search) {
            match.$or = [
                { customerName: { $regex: search, $options: 'i' } },
                { customerPhone: { $regex: search, $options: 'i' } }
            ];
        }

        const pipeline = [
            { $match: match },
            { $group: {
                _id: { phone: '$customerPhone', name: '$customerName' },
                name: { $first: '$customerName' },
                phone: { $first: '$customerPhone' },
                orderCount: { $sum: 1 },
                totalSpent: { $sum: '$total' },
                lastVisit: { $max: '$createdAt' },
                firstVisit: { $min: '$createdAt' },
                orders: { $push: { id: '$_id', orderNumber: '$orderNumber', total: '$total', createdAt: '$createdAt', status: '$status' } }
            }},
            { $match: {
                _id: { $ne: { phone: null, name: null } },
                $or: [
                    { 'phone': { $ne: null } },
                    { 'name': { $ne: null } }
                ]
            }},
            { $sort: { lastVisit: -1 } },
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) }
        ];

        const [customers, totalResult] = await Promise.all([
            Order.aggregate(pipeline),
            Order.aggregate([
                { $match: match },
                { $group: { _id: { phone: '$customerPhone', name: '$customerName' } } },
                { $match: {
                    _id: { $ne: { phone: null, name: null } },
                    $or: [{ 'phone': { $ne: null } }, { 'name': { $ne: null } }]
                }},
                { $count: 'total' }
            ])
        ]);

        const total = totalResult[0]?.total || 0;
        const totalPages = Math.ceil(total / parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                customers,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages
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

        const orders = await Order.find({
            restaurant: restaurantId,
            $or: [
                { _id: id },
                { customerPhone: id }
            ]
        }).populate('table', 'name').sort({ createdAt: -1 });

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
        const orderCount = orders.length;
        const lastVisit = orders[0]?.createdAt;

        res.status(200).json({
            success: true,
            data: {
                customer: {
                    name: orders[0]?.customerName,
                    phone: orders[0]?.customerPhone,
                    totalSpent,
                    orderCount,
                    lastVisit,
                    firstVisit: orders[orders.length - 1]?.createdAt
                },
                orders
            }
        });
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

        const orders = await Order.find({
            restaurant: restaurantId,
            $or: [
                { _id: id },
                { customerPhone: id }
            ]
        }).populate('table', 'name').sort({ createdAt: -1 }).limit(50);

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
};
