import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';
import { getTaxInfo, calculateTax, calculateGstBreakdown } from '../utils/taxHelper.js';
import logger from '../utils/logger.js';
import { sendWhatsAppToStaff, sendWhatsAppForTable } from '../services/whatsapp.service.js';
import { sendCustomerWhatsApp } from '../services/msg91.service.js';
import { assignWaiter, releaseWaiter } from '../services/waiterAssignment.service.js';
import { buildOrderItem } from '../utils/buildOrderItem.js';

// @desc    Create order
// @route   POST /api/orders
// @access  Public
export const createOrder = async (req, res, next) => {
    try {
        const { restaurant, table, items, customerName, customerPhone, specialInstructions, orderNote, paymentMethod, tipAmount = 0, promoCode, securityToken } = req.body;

        // Basic validations
        if (!restaurant || !table || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant, table, and items are required'
            });
        }

        // Fetch Table for security validation and restaurant boundary check
        const tableDoc = await Table.findById(table);
        if (!tableDoc) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Security Validation using QR secret (embedded in QR code URL)
        // Only applies when securityToken is provided (customer scan-to-order flow)
        if (securityToken) {
            if (tableDoc.qrSecret && tableDoc.qrSecret !== securityToken) {
                logger.warn(`QR token mismatch for table ${table}. Possible unauthorized order attempt.`);
                return res.status(403).json({
                    success: false,
                    message: 'Security validation failed. Please re-scan table QR code to order.'
                });
            }

            // Fallback: validate against session securityToken for legacy QR codes
            if (!tableDoc.qrSecret && tableDoc.currentSession?.securityToken && tableDoc.currentSession.securityToken !== securityToken) {
                logger.warn(`Session security token mismatch for table ${table}. Possible unauthorized order attempt.`);
                return res.status(403).json({
                    success: false,
                    message: 'Security validation failed. Please re-scan table QR code to order.'
                });
            }
        }

        // Cross-restaurant boundary check
        if (tableDoc.restaurant?.toString() !== restaurant) {
            logger.warn(`Cross-restaurant order attempt: table ${table} does not belong to restaurant ${restaurant}`);
            return res.status(403).json({
                success: false,
                message: 'Table does not belong to this restaurant.'
            });
        }

        // Fetch Restaurant for tax rate and existence check
        const restaurantDoc = await Restaurant.findById(restaurant);
        if (!restaurantDoc) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Initialize Socket.IO
        const io = req.app.get('io');

        // Validate and process items
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menuItem);
            if (!menuItem) {
                return res.status(404).json({
                    success: false,
                    message: `Menu item not found: ${item.menuItem}`
                });
            }

            if (!menuItem.isAvailable || menuItem.stockQuantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `${menuItem.name} is currently unavailable or out of stock`
                });
            }

            const built = buildOrderItem(menuItem, item);
            const itemTotal = built.price * item.quantity;
            subtotal += itemTotal;
            orderItems.push(built);
        }

        // Calculate tax and total
        const taxInfo = await getTaxInfo(restaurant, restaurantDoc);
        const tax = calculateTax(subtotal, taxInfo.slabRate);
        const gstBreakdown = calculateGstBreakdown(subtotal, taxInfo.cgstRate, taxInfo.sgstRate, taxInfo.igstRate);

        // Handle Promo Code (Simple Logic for now)
        let discountAmount = 0;
        if (promoCode === 'LOYALTY5') {
            discountAmount = 5;
        } else if (promoCode === 'WELCOME10') {
            discountAmount = subtotal * 0.10;
        }

        const total = Math.max(0, subtotal + tax + Number(tipAmount) - discountAmount);

        // Session logic: Reuse existing sessionId if table is occupied, else generate new one
        let sessionId = tableDoc.currentSession?.sessionId;
        if (!sessionId || tableDoc.status === 'FREE') {
            sessionId = `SESS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        const order = await Order.create({
            restaurant,
            table,
            sessionId,
            items: orderItems,
            subtotal,
            tax,
            tipAmount: Number(tipAmount),
            discountAmount,
            promoCode,
            total,
            gstBreakdown: {
                cgst: gstBreakdown.cgst,
                sgst: gstBreakdown.sgst,
                igst: gstBreakdown.igst,
                taxSlab: taxInfo.taxSlabId
            },
            customerName,
            customerPhone,
            specialInstructions: orderNote || specialInstructions,
            orderSource: 'QR'
        });

        // Populate order details for response
        await order.populate('table');

        // Update Table Status & Session
        try {
            tableDoc.status = 'OCCUPIED';
            tableDoc.currentSession = {
                ...tableDoc.currentSession,
                sessionId,
                occupiedAt: tableDoc.currentSession?.occupiedAt || new Date(),
                startTime: tableDoc.currentSession?.startTime || new Date(),
                orderId: order._id
            };
            await tableDoc.save();

            // Emit table update event
            if (io) {
                io.to(`restaurant:${restaurant}`).emit('table:updated', tableDoc);
            }
        } catch (tableError) {
            logger.error(`Failed to update table status: ${tableError.message}`);
        }

        // Auto-assign waiter if this is a dine-in table order
        if (table) {
            await assignWaiter({
                restaurantId: restaurant,
                tableId: table,
                orderId: order._id,
                changedBy: null
            });
        }

        // Emit real-time events via Socket.IO
        if (io) {
            io.to(`restaurant:${restaurant}`).emit('order:created', {
                order,
                message: `New order #${order.orderNumber} from ${order.table?.name || 'Table'}`
            });
        }


        const frontendUrl = process.env.FRONTEND_URL || 'https://pos.ritambharat.software';
        if (table) {
            await sendWhatsAppForTable(table, `🆕 New Order – Table ${order.table?.name || ''}`, `${frontendUrl}/accept/${order._id}`, { ownerPrefix: 'New Order' });
        } else {
            sendWhatsAppToStaff(restaurant, `🆕 New Order`, ['OWNER', 'WAITER'], `${frontendUrl}/accept/${order._id}`);
        }

        logger.info(`Order created: #${order.orderNumber} for Table ${order.table?.name}`);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        logger.error(`Create Order Error: ${error.message}`);
        next(error);
    }
};

// @desc    Get orders
// @route   GET /api/orders?restaurant=:id&status=:status&table=:tableId
// @access  Private (Owner/Chef)
export const getOrders = async (req, res, next) => {
    try {
        let { restaurant, status, table, startDate, endDate } = req.query;

        // Support for /restaurant/:restaurantId param style
        if (req.params.restaurantId) {
            restaurant = req.params.restaurantId;
        }

        const query = {};

        if (restaurant) {
            query.restaurant = restaurant;
        }

        if (status) {
            query.status = status;
        }

        if (table) {
            query.table = table;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const orders = await Order.find(query)
            .populate('restaurant', 'name')
            .populate('table', 'name')
            .populate('items.menuItem', 'name image')
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Public
export const getOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('restaurant', 'name logo')
            .populate('table', 'name')
            .populate('items.menuItem', 'name image');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Owner/Chef)
export const updateOrderStatus = async (req, res, next) => {
    try {
        const { status, cancellationReason } = req.body;

        const order = await Order.findById(req.params.id).populate('table');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Validate status transition
        const validTransitions = {
            PENDING: ['ACCEPTED', 'PREPARING', 'SERVED', 'CANCELLED'],
            ACCEPTED: ['PREPARING', 'SERVED', 'CANCELLED'],
            PREPARING: ['READY', 'SERVED', 'CANCELLED'],
            READY: ['SERVED'],
            SERVED: [],
            CANCELLED: []
        };

        if (!validTransitions[order.status]?.includes(status)) {
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

        // Stock Deduction Logic - Only when order is SERVED
        const io = req.app.get('io');

        if (status === 'SERVED') {
            for (const item of order.items) {
                const menuItem = await MenuItem.findById(item.menuItem);
                if (menuItem) {
                    // Deduct stock
                    menuItem.stockQuantity -= item.quantity;

                    // Low stock check
                    if (menuItem.stockQuantity <= menuItem.lowStockThreshold) {
                        menuItem.isLowStock = true;
                        // Emit low stock alert
                        if (io) io.to(`restaurant:${order.restaurant}`).emit('inventory:low-stock', {
                            itemId: menuItem._id,
                            name: menuItem.name,
                            remaining: menuItem.stockQuantity
                        });
                    }

                    // Auto-disable if out of stock
                    if (menuItem.stockQuantity <= 0) {
                        menuItem.stockQuantity = 0;
                        menuItem.isAvailable = false;
                        // Emit out-of-stock alert
                        if (io) io.to(`restaurant:${order.restaurant}`).emit('inventory:out-of-stock', {
                            itemId: menuItem._id,
                            name: menuItem.name
                        });
                    }

                    await menuItem.save();
                }
            }
        }

        // Stock Restoration Logic - When order is CANCELLED after being SERVED
        if (status === 'CANCELLED') {
            // Check if order was previously served
            const wasServed = order.statusHistory.some(history => history.status === 'SERVED');

            if (wasServed) {
                for (const item of order.items) {
                    const menuItem = await MenuItem.findById(item.menuItem);
                    if (menuItem) {
                        // Restore stock
                        menuItem.stockQuantity += item.quantity;

                        // Re-enable if it was disabled
                        if (!menuItem.isAvailable && menuItem.stockQuantity > 0) {
                            menuItem.isAvailable = true;
                            if (io) io.to(`restaurant:${order.restaurant}`).emit('inventory:back-in-stock', {
                                itemId: menuItem._id,
                                name: menuItem.name,
                                quantity: menuItem.stockQuantity
                            });
                        }

                        // Update low stock flag
                        menuItem.isLowStock = menuItem.stockQuantity <= menuItem.lowStockThreshold;

                        await menuItem.save();
                    }
                }
            }
        }

        // Emit real-time event
        if (io) io.to(`restaurant:${order.restaurant}`).emit('order:status-changed', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            tableName: order.table?.name
        });

        if (io) io.to(`order:${order._id}`).emit('order:updated', order);

        const tableId = order.table?._id || order.table;
        if (status === 'ACCEPTED') {
            if (tableId) {
                await sendWhatsAppForTable(tableId, `✅ Accepted – Table ${order.table?.name || ''}`, '', { ownerPrefix: 'Accepted' });
            } else {
                sendWhatsAppToStaff(order.restaurant, `✅ Accepted`, ['WAITER', 'OWNER']);
            }
        } else if (status === 'PREPARING') {
            if (tableId) {
                await sendWhatsAppForTable(tableId, `👨‍🍳 Preparing – Table ${order.table?.name || ''}`, '', { ownerPrefix: 'Preparing' });
            } else {
                sendWhatsAppToStaff(order.restaurant, `👨‍🍳 Preparing`, ['WAITER', 'OWNER']);
            }
        } else if (status === 'SERVED') {
            if (tableId) {
                await sendWhatsAppForTable(tableId, `🍽️ Served – Table ${order.table?.name || ''}`, '', { ownerPrefix: 'Served' });
            } else {
                sendWhatsAppToStaff(order.restaurant, `🍽️ Served`, ['WAITER', 'OWNER']);
            }
        } else if (status === 'CANCELLED') {
            if (tableId) {
                await sendWhatsAppForTable(tableId, `❌ Cancelled – Table ${order.table?.name || ''}`, '', { ownerPrefix: 'Cancelled' });
            } else {
                sendWhatsAppToStaff(order.restaurant, `❌ Cancelled`, ['OWNER', 'WAITER']);
            }
        }

        logger.info(`Order status updated: #${order.orderNumber} -> ${status}`);

        res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            data: order
        });
    } catch (error) {
        logger.error(`Update Order Status Error: ${error.message}`);
        next(error);
    }
};

// @desc    Cancel order
// @route   DELETE /api/orders/:id
// @access  Private (Owner/Chef) or Public (within 5 minutes)
export const cancelOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id).populate('table', 'name');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order can be cancelled
        if (['SERVED', 'CANCELLED'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled'
            });
        }

        // If not authenticated, check if within 5 minutes
        if (!req.user) {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (order.createdAt < fiveMinutesAgo) {
                return res.status(403).json({
                    success: false,
                    message: 'Order can only be cancelled within 5 minutes of creation'
                });
            }
        }

        order.status = 'CANCELLED';
        order.cancellationReason = req.body.reason || 'Cancelled by customer';
        await order.save();

        // Emit real-time event
        const io = req.app.get('io');
        if (io) io.to(`restaurant:${order.restaurant}`).emit('order:cancelled', {
            orderId: order._id,
            orderNumber: order.orderNumber
        });


        if (order.table) {
            const tableId = order.table._id || order.table;
            await releaseWaiter({ restaurantId: order.restaurant, tableId, changedBy: req.user?._id, reason: 'Order cancelled' });
            await sendWhatsAppForTable(tableId, `❌ Cancelled – Table ${order.table?.name || ''}`, '', { ownerPrefix: 'Cancelled' });
        } else {
            sendWhatsAppToStaff(order.restaurant, `❌ Cancelled`, ['OWNER', 'WAITER']);
        }

        logger.info(`Order cancelled: #${order.orderNumber}`);

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats/:restaurantId
// @access  Private (Owner)
export const getOrderStats = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { startDate, endDate } = req.query;

        const matchQuery = { restaurant: restaurantId };

        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
        }

        const stats = await Order.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$total' }
                }
            }
        ]);

        const totalOrders = await Order.countDocuments(matchQuery);
        const totalRevenue = await Order.aggregate([
            { $match: { ...matchQuery, paymentStatus: 'PAID' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                statusBreakdown: stats
            }
        });
    } catch (error) {
        next(error);
    }
};
// @desc    Update order payment status
// @route   PATCH /api/orders/:id/payment
// @access  Private (Owner/Cashier)
export const updateOrderPayment = async (req, res, next) => {
    try {
        const { paymentStatus, paymentMethod } = req.body;

        const order = await Order.findById(req.params.id).populate('table', 'name').populate('restaurant', 'name');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.paymentStatus = paymentStatus || 'PAID';
        if (paymentMethod) order.paymentMethod = paymentMethod;

        await order.save();

        // If paid and served, free the table
        if (order.paymentStatus === 'PAID' && order.table) {
            try {
                const tableDoc = await Table.findById(order.table._id || order.table);

                // Only free if this order occupies it
                if (tableDoc && tableDoc.status === 'OCCUPIED' && tableDoc.currentSession?.orderId?.toString() === order._id.toString()) {
                    await releaseWaiter({ restaurantId: order.restaurant, tableId: tableDoc._id, changedBy: req.user?._id, reason: 'Payment completed' });

                    tableDoc.status = 'FREE';
                    tableDoc.currentSession = {}; // Clear session
                    await tableDoc.save();

                    // Emit table update event
                    const io = req.app.get('io');
                    if (io) io.to(`restaurant:${order.restaurant}`).emit('table:updated', tableDoc);
                }
            } catch (tableError) {
                logger.error(`Failed to free table: ${tableError.message}`);
            }
        }

        // Emit real-time event
        const io = req.app.get('io');
        if (io) io.to(`restaurant:${order.restaurant}`).emit('order:payment-updated', {
            orderId: order._id,
            paymentStatus: order.paymentStatus
        });

        if (order.paymentStatus === 'PAID') {
            const frontendUrl = process.env.FRONTEND_URL || 'https://pos.ritambharat.software';
            sendWhatsAppToStaff(order.restaurant, `💰 Payment Received${order.table?.name ? ` – Table ${order.table.name}` : ''}${paymentMethod ? ` (${paymentMethod})` : ''}`, ['OWNER', 'WAITER'], `${frontendUrl}/bill/${order._id}`);

            if (order.customerPhone) {
                const billLink = `${frontendUrl}/bill/${order._id}`;
                const restaurantName = order.restaurant?.name || 'our restaurant';
                const message = `Thank you for dining at ${restaurantName}!\n\nOrder: #${order.orderNumber}\nAmount: ₹${order.total}\n\nView your bill: ${billLink}\n\nWe hope to serve you again!`;
                sendCustomerWhatsApp(order.customerPhone, {
                    customer_name: order.customerName || 'Guest',
                    restaurant_name: restaurantName,
                    amount: `₹${order.total}`,
                    bill_url: billLink,
                    message
                });
            }
        }

        logger.info(`Order payment updated: #${order.orderNumber} -> ${order.paymentStatus}`);

        res.status(200).json({
            success: true,
            message: 'Payment status updated',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get active session orders (Bill)
// @route   GET /api/orders/session/active/:tableId
// @access  Public
export const getActiveBill = async (req, res, next) => {
    try {
        const tableDoc = await Table.findById(req.params.tableId);

        if (!tableDoc) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        const sessionId = tableDoc.currentSession?.sessionId;

        if (!sessionId) {
            return res.status(200).json({
                success: true,
                message: 'No active session',
                data: null
            });
        }

        // Fetch all orders for this session that are not cancelled
        const orders = await Order.find({
            sessionId,
            status: { $ne: 'CANCELLED' }
        })
            .populate('restaurant', 'name logo')
            .populate('table', 'name')
            .populate('items.menuItem', 'name image')
            .sort({ createdAt: 1 });

        if (orders.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Session started but no orders yet',
                data: null
            });
        }

        // Aggregate session data
        const restaurant = orders[0].restaurant;
        const table = orders[0].table;
        const allItems = orders.flatMap(o => o.items);
        const subtotal = orders.reduce((sum, o) => sum + o.subtotal, 0);
        const tax = orders.reduce((sum, o) => sum + o.tax, 0);
        const total = orders.reduce((sum, o) => sum + o.total, 0);

        res.status(200).json({
            success: true,
            data: {
                sessionId,
                restaurant,
                table,
                orders: orders.map(o => ({
                    _id: o._id,
                    orderNumber: o.orderNumber,
                    status: o.status,
                    createdAt: o.createdAt
                })),
                items: allItems,
                subtotal,
                tax,
                total,
                createdAt: orders[0].createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update customer details on an existing order
// @route   PATCH /api/orders/:id/customer
// @access  Private
export const updateOrderCustomer = async (req, res, next) => {
    try {
        const { customerName, customerPhone } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.paymentStatus === 'PAID') {
            return res.status(400).json({ success: false, message: 'Cannot update customer on a paid order' });
        }

        if (customerName !== undefined) order.customerName = customerName || undefined;
        if (customerPhone !== undefined) order.customerPhone = customerPhone || undefined;

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Customer details updated',
            data: { customerName: order.customerName, customerPhone: order.customerPhone }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Accept order (from confirm page)
// @route   POST /api/orders/:id/accept
// @access  Public (anyone with link can accept)
export const acceptOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id).populate('table', 'name');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: `Order is already ${order.status}` });
        }

        order.status = 'ACCEPTED';
        await order.save();

        const io = req.app.get('io');
        if (io) {
            io.to(`restaurant:${order.restaurant}`).emit('order:status-changed', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: 'ACCEPTED',
                tableName: order.table?.name
            });
            io.to(`restaurant:${order.restaurant}`).emit('kds:new-order', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                tableName: order.table?.name
            });
            io.to(`order:${order._id}`).emit('order:updated', order);
        }

        const frontendUrl = process.env.FRONTEND_URL || 'https://pos.ritambharat.software';
        sendWhatsAppToStaff(order.restaurant, `✅ Accepted – Table ${order.table?.name || 'Takeout'}\n${frontendUrl}/orders`, ['WAITER', 'OWNER']);

        res.status(200).json({
            success: true,
            message: 'Order accepted',
            data: order
        });
    } catch (error) {
        next(error);
    }
};
