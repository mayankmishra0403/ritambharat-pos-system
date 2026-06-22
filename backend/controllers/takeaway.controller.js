import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import { getTaxInfo, calculateTax, calculateGstBreakdown } from '../utils/taxHelper.js';
import logger from '../utils/logger.js';
import { sendPushToRestaurantStaff } from '../services/push.service.js';
import { sendWhatsAppToStaff } from '../services/whatsapp.service.js';

export const getTakeawayDashboard = async (req, res, next) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
        }

        const orders = await Order.find({
            restaurant: restaurantId,
            orderType: { $in: ['TAKEAWAY', 'DELIVERY'] },
            status: { $ne: 'CANCELLED' }
        })
            .select('orderNumber items subtotal tax total status orderType customerName customerPhone paymentStatus createdAt')
            .sort({ createdAt: -1 })
            .limit(50);

        const stats = {
            pending: orders.filter(o => o.status === 'PENDING').length,
            preparing: orders.filter(o => o.status === 'PREPARING').length,
            ready: orders.filter(o => o.status === 'READY').length,
            completed: orders.filter(o => o.status === 'SERVED').length,
            total: orders.length
        };

        res.status(200).json({
            success: true,
            data: { orders, stats }
        });
    } catch (error) {
        next(error);
    }
};

export const createTakeawayOrder = async (req, res, next) => {
    try {
        const { restaurantId, items, customerName, customerPhone, specialInstructions, orderType = 'TAKEAWAY' } = req.body;

        if (!restaurantId || !items || items.length === 0) {
            return res.status(400).json({
                success: false, message: 'Restaurant and items are required'
            });
        }

        if (!customerName || !customerPhone) {
            return res.status(400).json({
                success: false, message: 'Customer name and phone are required for takeaway orders'
            });
        }

        const restaurantDoc = await Restaurant.findById(restaurantId);
        if (!restaurantDoc) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menuItem);
            if (!menuItem) {
                return res.status(404).json({
                    success: false, message: `Menu item not found: ${item.menuItem}`
                });
            }
            if (!menuItem.isAvailable) {
                return res.status(400).json({
                    success: false, message: `${menuItem.name} is currently unavailable`
                });
            }

            const itemTotal = menuItem.price * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                menuItem: menuItem._id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions || ''
            });
        }

        const taxInfo = await getTaxInfo(restaurantId, restaurantDoc);
        const tax = calculateTax(subtotal, taxInfo.slabRate);
        const gstBreakdown = calculateGstBreakdown(subtotal, taxInfo.cgstRate, taxInfo.sgstRate, taxInfo.igstRate);
        const total = subtotal + tax;

        const sessionId = `TA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const order = await Order.create({
            restaurant: restaurantId,
            sessionId,
            items: orderItems,
            subtotal,
            tax,
            total,
            gstBreakdown: {
                cgst: gstBreakdown.cgst,
                sgst: gstBreakdown.sgst,
                igst: gstBreakdown.igst,
                taxSlab: taxInfo.taxSlabId
            },
            orderType,
            customerName,
            customerPhone,
            specialInstructions,
            orderSource: 'MANUAL',
            status: 'PENDING'
        });

        const io = req.app.get('io');
        if (io) {
            io.to(`restaurant:${restaurantId}`).emit('order:created', {
                order,
                message: `New ${orderType} order #${order.orderNumber}`
            });
            io.to(`restaurant:${restaurantId}`).emit('kds:new-order', {
                orderId: order._id,
                orderNumber: order.orderNumber
            });
        }

        sendPushToRestaurantStaff(restaurantId, {
            title: 'New Order',
            body: `${orderType.charAt(0).toUpperCase() + orderType.slice(1)} order #${order.orderNumber} placed`,
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
            vibrate: [200, 100, 200],
            sound: '/sounds/notification.mp3',
            data: { url: '/waiter-app/orders', type: 'new-order' }
        }, ['OWNER', 'WAITER']);

        sendWhatsAppToStaff(restaurantId, `🆕 #${order.orderNumber} - ${orderType.charAt(0).toUpperCase() + orderType.slice(1)} order`, ['OWNER', 'WAITER']);

        logger.info(`Takeaway order created: #${order.orderNumber}`);

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

export const addTakeawayItems = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false, message: 'Items are required'
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status !== 'PENDING') {
            return res.status(400).json({
                success: false, message: 'Can only add items to pending orders'
            });
        }

        let additionalSubtotal = 0;

        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menuItem);
            if (!menuItem) {
                return res.status(404).json({
                    success: false, message: `Menu item not found: ${item.menuItem}`
                });
            }

            const itemTotal = menuItem.price * item.quantity;
            additionalSubtotal += itemTotal;

            order.items.push({
                menuItem: menuItem._id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions || ''
            });
        }

        order.subtotal += additionalSubtotal;
        const taxInfo = await getTaxInfo(order.restaurant);
        const additionalTax = calculateTax(additionalSubtotal, taxInfo.slabRate);
        order.tax += additionalTax;
        order.total = order.subtotal + order.tax;

        await order.save();

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

export const markTakeawayReady = async (req, res, next) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (!['PENDING', 'PREPARING'].includes(order.status)) {
            return res.status(400).json({
                success: false, message: `Cannot mark order as ready from ${order.status}`
            });
        }

        order.status = 'READY';
        await order.save();

        const io = req.app.get('io');
        if (io) {
            io.to(`restaurant:${order.restaurant}`).emit('order:status-changed', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: 'READY'
            });
        }

        sendPushToRestaurantStaff(order.restaurant, { title: 'Takeaway Ready', body: `Takeaway #${order.orderNumber} is ready for pickup!`, icon: '/icons/icon-192.png', badge: '/icons/badge-72.png', vibrate: [200, 100, 200], data: { url: '/takeaway', type: 'takeaway-ready' } }, ['WAITER', 'OWNER']);
        sendWhatsAppToStaff(order.restaurant, `🛵 #${order.orderNumber} - Ready for pickup`, ['WAITER', 'OWNER']);

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

export const markTakeawayComplete = async (req, res, next) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status !== 'READY') {
            return res.status(400).json({
                success: false, message: 'Only ready orders can be marked as picked up'
            });
        }

        order.status = 'SERVED';
        await order.save();

        const io = req.app.get('io');
        if (io) {
            io.to(`restaurant:${order.restaurant}`).emit('order:status-changed', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: 'SERVED'
            });
        }

        sendPushToRestaurantStaff(order.restaurant, { title: 'Takeaway Picked Up', body: `Takeaway #${order.orderNumber} has been picked up`, icon: '/icons/icon-192.png', badge: '/icons/badge-72.png', vibrate: [200, 100, 200], data: { url: '/takeaway', type: 'takeaway-complete' } }, ['WAITER', 'OWNER']);
        sendWhatsAppToStaff(order.restaurant, `✅ #${order.orderNumber} - Picked up`, ['WAITER', 'OWNER']);

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};
