import Table from '../models/Table.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import { getTaxInfo, calculateTax, calculateGstBreakdown } from '../utils/taxHelper.js';
import logger from '../utils/logger.js';

export const getWaiterData = async (req, res, next) => {
    try {
        const { restaurantId } = req.query;

        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        const [tables, menuItems, activeOrders] = await Promise.all([
            Table.find({ restaurant: restaurantId, isActive: true }).sort({ name: 1 }),
            MenuItem.find({ restaurant: restaurantId, isAvailable: true, isDeleted: false })
                .sort({ category: 1, sortOrder: 1 }),
            Order.find({
                restaurant: restaurantId,
                status: { $in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] }
            }).populate('table', 'name').sort({ createdAt: -1 })
        ]);

        const categories = [...new Set(menuItems.map(item => item.category))];

        res.status(200).json({
            success: true,
            data: {
                tables,
                menuItems,
                categories,
                activeOrders
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getWaiterTables = async (req, res, next) => {
    try {
        const { restaurantId } = req.query;

        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        const tables = await Table.find({ restaurant: restaurantId, isActive: true })
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: tables
        });
    } catch (error) {
        next(error);
    }
};

export const getWaiterOrders = async (req, res, next) => {
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
            status: { $ne: 'CANCELLED' }
        })
            .populate('table', 'name')
            .populate('items.menuItem', 'name image')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

export const createWaiterOrder = async (req, res, next) => {
    try {
        const { restaurant, table, items, customerName, customerPhone, specialInstructions, orderSource = 'MANUAL' } = req.body;

        if (!restaurant || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant and items are required'
            });
        }

        const restaurantDoc = await Restaurant.findById(restaurant);
        if (!restaurantDoc) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

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

            if (!menuItem.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `${menuItem.name} is currently unavailable`
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

        const taxInfo = await getTaxInfo(restaurant, restaurantDoc);
        const tax = calculateTax(subtotal, taxInfo.slabRate);
        const gstBreakdown = calculateGstBreakdown(subtotal, taxInfo.cgstRate, taxInfo.sgstRate, taxInfo.igstRate);
        const total = subtotal + tax;

        const sessionId = `SESS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const order = await Order.create({
            restaurant,
            table: table || undefined,
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
            customerName,
            customerPhone,
            specialInstructions,
            orderSource,
            status: 'PENDING'
        });

        await order.populate('table', 'name');

        if (table) {
            try {
                const tableDoc = await Table.findById(table);
                if (tableDoc) {
                    tableDoc.status = 'OCCUPIED';
                    tableDoc.currentSession = {
                        sessionId,
                        occupiedAt: new Date(),
                        startTime: new Date(),
                        orderId: order._id
                    };
                    await tableDoc.save();

                    const io = req.app.get('io');
                    if (io) {
                        io.to(`restaurant:${restaurant}`).emit('table:updated', tableDoc);
                    }
                }
            } catch (tableError) {
                logger.error(`Failed to update table: ${tableError.message}`);
            }
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`restaurant:${restaurant}`).emit('order:created', {
                order,
                message: `New order #${order.orderNumber} from table`
            });
            io.to(`restaurant:${restaurant}`).emit('kds:new-order', {
                orderId: order._id,
                orderNumber: order.orderNumber
            });
        }

        logger.info(`Waiter order created: #${order.orderNumber}`);

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

export const updateWaiterOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        const order = await Order.findById(id).populate('table', 'name');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const validTransitions = {
            PENDING: ['CANCELLED'],
            ACCEPTED: ['CANCELLED'],
            PREPARING: ['CANCELLED'],
            READY: ['SERVED', 'CANCELLED'],
            SERVED: [],
            CANCELLED: []
        };

        const transitions = validTransitions[order.status] || [];
        if (!transitions.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot transition from ${order.status} to ${status}`
            });
        }

        order.status = status;
        order.statusHistory.push({
            status,
            timestamp: new Date(),
            updatedBy: req.user?._id
        });

        await order.save();

        const io = req.app.get('io');
        if (io) {
            io.to(`restaurant:${order.restaurant}`).emit('order:status-changed', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status,
                tableName: order.table?.name
            });
            io.to(`restaurant:${order.restaurant}`).emit('kds:status-update', {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status
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

export const requestWaiterBill = async (req, res, next) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id).populate('table', 'name');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`restaurant:${order.restaurant}`).emit('service:new', {
                type: 'REQUEST_BILL',
                table: order.table,
                orderId: order._id,
                orderNumber: order.orderNumber,
                message: `Bill requested for order #${order.orderNumber}`
            });
        }

        logger.info(`Bill requested for order #${order.orderNumber}`);

        res.status(200).json({
            success: true,
            message: 'Bill request sent'
        });
    } catch (error) {
        next(error);
    }
};
