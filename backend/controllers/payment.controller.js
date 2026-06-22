import paymentGatewayService from '../services/paymentGateway.service.js';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import logger from '../utils/logger.js';

export const createManualBill = async (req, res, next) => {
    try {
        const { restaurantId, items, subtotal, tax, total, paymentMethod = 'CASH', paymentStatus = 'PAID' } = req.body;

        if (!restaurantId || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Restaurant and items are required' });
        }

        const order = await Order.create({
            restaurant: restaurantId,
            items: items.map(i => ({
                menuItem: i.menuItem,
                name: i.name,
                price: i.price,
                quantity: i.quantity
            })),
            subtotal: subtotal || items.reduce((s, i) => s + i.price * i.quantity, 0),
            tax,
            total: total || items.reduce((s, i) => s + i.price * i.quantity, 0),
            paymentMethod,
            paymentStatus,
            status: 'SERVED',
            orderSource: 'MANUAL'
        });

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

export const getPaymentMethods = async (req, res, next) => {
    try {
        const { currency = 'INR' } = req.query;
        const methods = paymentGatewayService.getAvailablePaymentMethods(currency);
        res.status(200).json({ success: true, data: methods });
    } catch (error) {
        next(error);
    }
};
