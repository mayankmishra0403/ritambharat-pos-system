import paymentGatewayService from '../services/paymentGateway.service.js';
import safepayService from '../services/safepay.service.js';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import logger from '../utils/logger.js';
import { sendPushToRestaurantStaff } from '../services/push.service.js';

export const createPaymentIntent = async (req, res, next) => {
    try {
        const { orderId, amount, currency = 'INR' } = req.body;

        const order = await Order.findById(orderId).populate('restaurant');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.paymentStatus === 'PAID') {
            return res.status(400).json({ success: false, message: 'Order is already paid' });
        }

        const paymentResult = await paymentGatewayService.createPayment({
            amount,
            currency,
            orderId: order._id,
            restaurantId: order.restaurant._id,
            metadata: { customerInfo: '' }
        });

        const payment = await Payment.create({
            order: order._id,
            restaurant: order.restaurant._id,
            amount,
            currency,
            paymentMethod: 'SAFEPAY',
            paymentType: 'ORDER',
            status: 'PENDING',
            safepayTracker: paymentResult.tracker,
            safepayCheckoutUrl: paymentResult.checkoutUrl
        });

        res.status(200).json({
            success: true,
            data: {
                paymentId: payment._id,
                gateway: 'SAFEPAY',
                checkoutUrl: paymentResult.checkoutUrl,
                tracker: paymentResult.tracker
            }
        });
    } catch (error) {
        next(error);
    }
};

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

export const handleSafepayWebhook = async (req, res, next) => {
    try {
        const signature = req.headers['x-sfpy-signature'];

        if (!signature) {
            logger.warn('Safepay webhook missing signature header');
            return res.status(401).json({ success: false, message: 'Missing signature' });
        }

        const rawBody = req.rawBody || req.body;
        const isValid = safepayService.verifyWebhookSignature(signature, rawBody);
        if (!isValid) {
            logger.warn('Safepay webhook invalid signature');
            return res.status(401).json({ success: false, message: 'Invalid signature' });
        }

        const event = await safepayService.processWebhook(req.body);
        const { tracker, status, amount, currency } = event;

        const payment = await Payment.findOne({ safepayTracker: tracker });
        if (!payment) {
            logger.warn(`Safepay webhook: no payment found for tracker ${tracker}`);
            return res.status(200).json({ success: true, message: 'Event received' });
        }

        payment.status = status;
        if (status === 'COMPLETED') {
            payment.transactionId = tracker;
        }
        await payment.save();

        if (payment.order) {
            const order = await Order.findById(payment.order);
            if (order && status === 'COMPLETED') {
                order.paymentStatus = 'PAID';
                await order.save();

                const io = req.app.get('io');
                if (io) {
                    io.to(`restaurant:${payment.restaurant}`).emit('order:payment-updated', {
                        orderId: order._id,
                        paymentStatus: 'PAID',
                        paymentId: payment._id
                    });

                    io.to(`restaurant:${payment.restaurant}`).emit('order:paid', {
                        orderId: order._id,
                        orderNumber: order.orderNumber
                    });
                }

                sendPushToRestaurantStaff(payment.restaurant, {
                    title: 'Payment Received',
                    body: `Payment received for order #${order.orderNumber}`,
                    icon: '/icons/icon-192.png',
                    badge: '/icons/badge-72.png',
                    vibrate: [200, 100, 200],
                    sound: '/sounds/notification.mp3',
                    data: { url: '/waiter-app/orders', type: 'payment' }
                }, ['OWNER', 'WAITER']);
            }
        }

        logger.info(`Safepay webhook processed: tracker=${tracker} status=${status}`);
        res.status(200).json({ success: true, message: 'Webhook processed' });
    } catch (error) {
        logger.error(`Safepay webhook error: ${error.message}`);
        res.status(200).json({ success: true, message: 'Event received' });
    }
};
