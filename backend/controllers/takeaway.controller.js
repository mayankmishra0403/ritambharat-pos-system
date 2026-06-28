import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import { getTaxInfo, calculateTax, calculateGstBreakdown } from '../utils/taxHelper.js';
import logger from '../utils/logger.js';
import { sendWhatsAppToStaff, sendWhatsAppToUser } from '../services/whatsapp.service.js';
import { findLeastLoadedWaiter } from '../services/waiterAssignment.service.js';
import { buildOrderItem } from '../utils/buildOrderItem.js';

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

            const built = buildOrderItem(menuItem, item);
            const itemTotal = built.price * item.quantity;
            subtotal += itemTotal;
            orderItems.push(built);
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

        const frontendUrl = process.env.FRONTEND_URL || 'https://pos.ritambharat.software';

        const assignedWaiter = await findLeastLoadedWaiter(restaurantId);
        if (assignedWaiter) {
            order.assignedWaiter = assignedWaiter._id;
            await order.save();
            sendWhatsAppToUser(assignedWaiter._id, `🆕 New Takeaway Order – #${order.orderNumber}`, `${frontendUrl}/accept/${order._id}`);
        } else {
            sendWhatsAppToStaff(restaurantId, `🆕 New Order – #${order.orderNumber}`, ['OWNER', 'WAITER'], `${frontendUrl}/accept/${order._id}`);
        }

        logger.info(`Takeaway order created: #${order.orderNumber} | assigned to: ${assignedWaiter?.name || 'all staff'}`);

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

            const built = buildOrderItem(menuItem, item);
            const itemTotal = built.price * item.quantity;
            additionalSubtotal += itemTotal;
            order.items.push(built);
        }

        order.subtotal += additionalSubtotal;
        const restaurantDoc = await Restaurant.findById(order.restaurant);
        const taxInfo = await getTaxInfo(order.restaurant, restaurantDoc);
        const additionalTax = calculateTax(additionalSubtotal, taxInfo.slabRate);
        order.tax += additionalTax;
        order.total = order.subtotal + order.tax + (order.tipAmount || 0) - (order.discountAmount || 0);

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

        sendWhatsAppToStaff(order.restaurant, `🛵 Ready for Pickup – #${order.orderNumber}`, ['WAITER', 'OWNER']);

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
        order.paymentStatus = 'PAID';
        await order.save();

        // Deduct stock for each item
        for (const item of order.items) {
            try {
                await MenuItem.findByIdAndUpdate(item.menuItem, {
                    $inc: { stockQuantity: -item.quantity }
                });
            } catch (stockError) {
                logger.error(`Failed to deduct stock for ${item.menuItem}: ${stockError.message}`);
            }
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`restaurant:${order.restaurant}`).emit('order:status-changed', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: 'SERVED'
            });
        }

        sendWhatsAppToStaff(order.restaurant, `✅ Picked Up – #${order.orderNumber}`, ['WAITER', 'OWNER']);

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};
