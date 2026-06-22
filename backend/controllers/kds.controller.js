import Order from '../models/Order.js';
import KitchenNotification from '../models/KitchenNotification.js';
import Table from '../models/Table.js';
import logger from '../utils/logger.js';
import { sendPushToRestaurantStaff } from '../services/push.service.js';
import { sendWhatsAppToStaff } from '../services/whatsapp.service.js';

export const getActiveOrders = async (req, res, next) => {
    try {
        const { restaurantId } = req.query;

        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        const orders = await Order.find({
            restaurant: restaurantId,
            status: { $in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] }
        })
            .populate('table', 'name')
            .populate('items.menuItem', 'name image preparationTime')
            .sort({ createdAt: -1 });

        const grouped = {
            PENDING: [],
            ACCEPTED: [],
            PREPARING: [],
            READY: []
        };

        orders.forEach(order => {
            if (grouped[order.status]) {
                grouped[order.status].push(order);
            }
        });

        res.status(200).json({
            success: true,
            data: grouped
        });
    } catch (error) {
        next(error);
    }
};

export const updateOrderStatus = async (req, res, next) => {
    try {
        const { status, cancellationReason } = req.body;
        const { id } = req.params;

        const order = await Order.findById(id).populate('table', 'name');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const validTransitions = {
            PENDING: ['ACCEPTED', 'PREPARING', 'CANCELLED'],
            ACCEPTED: ['PREPARING', 'CANCELLED'],
            PREPARING: ['READY', 'CANCELLED'],
            READY: ['SERVED'],
            SERVED: [],
            CANCELLED: []
        };

        const transitions = validTransitions[order.status] || validTransitions.PENDING;

        if (!transitions.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot transition from ${order.status} to ${status}`
            });
        }

        order.status = status;

        if (status === 'CANCELLED' && cancellationReason) {
            order.cancellationReason = cancellationReason;
        }

        await order.save();

        const io = req.app.get('io');
        if (io) {
            io.to(`restaurant:${order.restaurant}`).emit('kds:status-update', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
                tableName: order.table?.name
            });

            io.to(`restaurant:${order.restaurant}`).emit('order:status-changed', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
                tableName: order.table?.name
            });

            if (status === 'READY') {
                io.to(`restaurant:${order.restaurant}`).emit('waiter:order-ready', {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    tableName: order.table?.name
                });

                sendPushToRestaurantStaff(order.restaurant, {
                    title: 'Order Ready',
                    body: `Order #${order.orderNumber} is ready to serve!`,
                    icon: '/icons/icon-192.png',
                    badge: '/icons/badge-72.png',
                    vibrate: [200, 100, 200],
                    sound: '/sounds/notification.mp3',
                    data: { url: '/waiter-app/orders', type: 'order-ready' }
                }, ['WAITER', 'OWNER']);

                sendWhatsAppToStaff(order.restaurant, `✅ ${order.table?.name || '#'+order.orderNumber} - Ready to serve`, ['WAITER', 'OWNER']);
            } else if (status === 'ACCEPTED') {
                sendPushToRestaurantStaff(order.restaurant, { title: 'Order Accepted', body: `Order #${order.orderNumber} has been accepted by kitchen`, icon: '/icons/icon-192.png', badge: '/icons/badge-72.png', vibrate: [200, 100, 200], data: { url: '/waiter-app/orders', type: 'order-accepted' } }, ['WAITER', 'OWNER']);
                sendWhatsAppToStaff(order.restaurant, `✅ ${order.table?.name || '#'+order.orderNumber} - Kitchen accepted`, ['WAITER', 'OWNER']);
            } else if (status === 'PREPARING') {
                sendPushToRestaurantStaff(order.restaurant, { title: 'Preparing Order', body: `Order #${order.orderNumber} is being prepared in the kitchen`, icon: '/icons/icon-192.png', badge: '/icons/badge-72.png', vibrate: [200, 100, 200], data: { url: '/waiter-app/orders', type: 'order-preparing' } }, ['WAITER', 'OWNER']);
                sendWhatsAppToStaff(order.restaurant, `👨‍🍳 ${order.table?.name || '#'+order.orderNumber} - Preparing`, ['WAITER', 'OWNER']);
            } else if (status === 'CANCELLED') {
                sendPushToRestaurantStaff(order.restaurant, { title: 'Order Cancelled', body: `Order #${order.orderNumber} cancelled by kitchen`, icon: '/icons/icon-192.png', badge: '/icons/badge-72.png', vibrate: [200, 100, 200], data: { url: '/waiter-app/orders', type: 'order-cancelled' } }, ['OWNER', 'WAITER']);
                sendWhatsAppToStaff(order.restaurant, `❌ ${order.table?.name || '#'+order.orderNumber} - Cancelled by kitchen`, ['OWNER', 'WAITER']);
            }
        }

        await KitchenNotification.create({
            restaurant: order.restaurant,
            order: order._id,
            type: 'STATUS_UPDATE',
            message: `Order #${order.orderNumber} is now ${status}`
        });

        logger.info(`KDS: Order ${order.orderNumber} status updated to ${status}`);

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

export const getNotifications = async (req, res, next) => {
    try {
        const { restaurantId } = req.query;

        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        const notifications = await KitchenNotification.find({ restaurant: restaurantId })
            .populate('order', 'orderNumber table')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (error) {
        next(error);
    }
};

export const markNotificationRead = async (req, res, next) => {
    try {
        const { id } = req.params;

        const notification = await KitchenNotification.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        next(error);
    }
};
