import PosSession from '../models/PosSession.js';
import Table from '../models/Table.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import { getTaxInfo, calculateTax, calculateGstBreakdown } from '../utils/taxHelper.js';
import logger from '../utils/logger.js';

export const openSession = async (req, res, next) => {
    try {
        const { restaurantId, openingBalance, notes } = req.body;

        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
        }

        const existingOpen = await PosSession.findOne({ restaurant: restaurantId, status: 'OPEN' });
        if (existingOpen) {
            return res.status(400).json({ success: false, message: 'An open session already exists' });
        }

        const session = await PosSession.create({
            restaurant: restaurantId,
            user: req.user._id,
            openingBalance: openingBalance || 0,
            notes
        });

        res.status(201).json({ success: true, data: session });
    } catch (error) {
        next(error);
    }
};

export const getCurrentSession = async (req, res, next) => {
    try {
        const { restaurantId } = req.query;

        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
        }

        const session = await PosSession.findOne({ restaurant: restaurantId, status: 'OPEN' })
            .populate('user', 'name email');

        res.status(200).json({ success: true, data: session });
    } catch (error) {
        next(error);
    }
};

export const closeSession = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { closingBalance, notes } = req.body;

        if (closingBalance === undefined || closingBalance === null) {
            return res.status(400).json({ success: false, message: 'Closing balance is required' });
        }

        const session = await PosSession.findById(id);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }
        if (session.status === 'CLOSED') {
            return res.status(400).json({ success: false, message: 'Session already closed' });
        }

        const difference = closingBalance - session.openingBalance;
        const expectedBalance = session.openingBalance + session.totalSales;

        session.closingBalance = closingBalance;
        session.expectedBalance = expectedBalance;
        session.status = 'CLOSED';
        session.closedAt = new Date();
        if (notes) session.notes = notes;
        await session.save();

        res.status(200).json({
            success: true,
            data: {
                ...session.toObject(),
                difference,
                variance: closingBalance - expectedBalance
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getPosData = async (req, res, next) => {
    try {
        const { restaurantId } = req.query;

        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
        }

        const [tables, menuItems, activeOrders, restaurant] = await Promise.all([
            Table.find({ restaurant: restaurantId, isActive: true }).sort({ name: 1 }),
            MenuItem.find({ restaurant: restaurantId, isAvailable: true, isDeleted: false })
                .sort({ category: 1 }),
            Order.find({
                restaurant: restaurantId,
                status: { $in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'] },
                paymentStatus: 'UNPAID'
            }).populate('table', 'name').sort({ createdAt: -1 }),
            Restaurant.findById(restaurantId)
        ]);

        const categories = [...new Set(menuItems.map(item => item.category))];
        const taxInfo = await getTaxInfo(restaurantId, restaurant);

        res.status(200).json({
            success: true,
            data: {
                tables,
                menuItems,
                categories,
                activeOrders,
                taxRate: taxInfo.slabRate,
                taxSlabId: taxInfo.taxSlabId,
                isGstEnabled: taxInfo.isGstEnabled,
                currency: restaurant?.currency || 'INR'
            }
        });
    } catch (error) {
        next(error);
    }
};

export const createPosOrder = async (req, res, next) => {
    try {
        const { restaurantId, table, items, customerName, customerPhone, specialInstructions } = req.body;

        if (!restaurantId || !items || items.length === 0) {
            return res.status(400).json({
                success: false, message: 'Restaurant and items are required'
            });
        }

        const restaurantDoc = await Restaurant.findById(restaurantId);
        if (!restaurantDoc) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        if (table) {
            const tableDoc = await Table.findById(table);
            if (!tableDoc) {
                return res.status(404).json({ success: false, message: 'Table not found' });
            }
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

        const sessionId = `POS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const order = await Order.create({
            restaurant: restaurantId,
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
            orderType: table ? 'DINE_IN' : 'TAKEAWAY',
            customerName,
            customerPhone,
            specialInstructions,
            orderSource: 'MANUAL',
            status: table ? 'ACCEPTED' : 'PENDING'
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
                        io.to(`restaurant:${restaurantId}`).emit('table:updated', tableDoc);
                    }
                }
            } catch (tableError) {
                logger.error(`Failed to update table: ${tableError.message}`);
            }
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`restaurant:${restaurantId}`).emit('order:created', { order });
            io.to(`restaurant:${restaurantId}`).emit('kds:new-order', {
                orderId: order._id, orderNumber: order.orderNumber
            });
        }

        res.status(201).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

export const processPayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { paymentMethod, amountPaid, restaurantId } = req.body;

        if (!paymentMethod || !['CASH', 'CARD', 'UPI'].includes(paymentMethod)) {
            return res.status(400).json({
                success: false, message: 'Valid payment method required (CASH/CARD/UPI)'
            });
        }

        const order = await Order.findById(id).populate('table', 'name');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.paymentStatus === 'PAID') {
            return res.status(400).json({ success: false, message: 'Order already paid' });
        }

        order.paymentStatus = 'PAID';
        order.paymentMethod = paymentMethod;
        order.status = 'SERVED';

        await order.save();

        if (order.table) {
            try {
                const tableDoc = await Table.findById(order.table);
                if (tableDoc) {
                    tableDoc.status = 'FREE';
                    tableDoc.currentSession = null;
                    await tableDoc.save();

                    const io = req.app.get('io');
                    if (io) {
                        io.to(`restaurant:${order.restaurant}`).emit('table:updated', tableDoc);
                    }
                }
            } catch (tableError) {
                logger.error(`Failed to free table on payment: ${tableError.message}`);
            }
        }

        if (restaurantId) {
            try {
                const session = await PosSession.findOne({
                    restaurant: restaurantId, status: 'OPEN'
                });
                if (session) {
                    session.totalSales += order.total;
                    session.orderCount += 1;
                    if (paymentMethod === 'CASH') session.totalCash += order.total;
                    else if (paymentMethod === 'CARD') session.totalCard += order.total;
                    else if (paymentMethod === 'UPI') session.totalUpi += order.total;
                    await session.save();
                }
            } catch (sessionError) {
                logger.error(`Failed to update session: ${sessionError.message}`);
            }
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`restaurant:${order.restaurant}`).emit('order:paid', {
                orderId: order._id, orderNumber: order.orderNumber, paymentMethod
            });
        }

        const changeDue = amountPaid ? Math.max(0, amountPaid - order.total) : 0;

        res.status(200).json({
            success: true,
            data: {
                order,
                changeDue: paymentMethod === 'CASH' ? changeDue : 0
            }
        });
    } catch (error) {
        next(error);
    }
};

export const addPosOrderItems = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { items, restaurantId, customerName, customerPhone } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Items are required' });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.paymentStatus === 'PAID') {
            return res.status(400).json({ success: false, message: 'Cannot modify paid order' });
        }
        if (order.status === 'CANCELLED') {
            return res.status(400).json({ success: false, message: 'Cannot modify cancelled order' });
        }

        if (customerName !== undefined) order.customerName = customerName || undefined;
        if (customerPhone !== undefined) order.customerPhone = customerPhone || undefined;

        let additionalSubtotal = 0;

        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menuItem);
            if (!menuItem) {
                return res.status(404).json({ success: false, message: `Menu item not found: ${item.menuItem}` });
            }
            if (!menuItem.isAvailable) {
                return res.status(400).json({ success: false, message: `${menuItem.name} is unavailable` });
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
        order.total = order.subtotal + order.tax - (order.discountAmount || 0);

        await order.save();

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

export const updateOrderTotals = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { discountAmount, serviceCharge } = req.body;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.paymentStatus === 'PAID') {
            return res.status(400).json({ success: false, message: 'Cannot modify paid order' });
        }

        if (discountAmount !== undefined) {
            order.discountAmount = Math.max(0, discountAmount);
        }

        let newTotal = order.subtotal + order.tax - order.discountAmount;
        if (serviceCharge !== undefined) {
            const scAmount = (order.subtotal * serviceCharge) / 100;
            newTotal += scAmount;
            order.set('serviceCharge', serviceCharge);
            order.set('serviceChargeAmount', scAmount);
        }

        order.total = Math.max(0, newTotal);
        await order.save();

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

export const mergeTables = async (req, res, next) => {
    try {
        const { mainId, childId } = req.params;
        const { restaurantId } = req.query;

        const [mainTable, childTable] = await Promise.all([
            Table.findById(mainId),
            Table.findById(childId)
        ]);

        if (!mainTable || !childTable) {
            return res.status(404).json({ success: false, message: 'Table not found' });
        }
        if (mainTable.restaurant.toString() !== childTable.restaurant.toString()) {
            return res.status(400).json({ success: false, message: 'Tables must belong to same restaurant' });
        }

        if (!mainTable.currentSession?.sessionId) {
            return res.status(400).json({ success: false, message: 'Main table has no active session' });
        }

        const mainSessionId = mainTable.currentSession.sessionId;

        await Order.updateMany(
            { table: childId, paymentStatus: 'UNPAID' },
            { $set: { table: mainId, sessionId: mainSessionId } }
        );

        childTable.status = 'OCCUPIED';
        if (!childTable.currentSession) {
            childTable.currentSession = {};
        }
        childTable.currentSession.mergedInto = mainId;
        childTable.currentSession.sessionId = mainSessionId;

        await childTable.save();

        const io = req.app.get('io');
        if (io && restaurantId) {
            io.to(`restaurant:${restaurantId}`).emit('table:updated', mainTable);
            io.to(`restaurant:${restaurantId}`).emit('table:updated', childTable);
        }

        res.status(200).json({ success: true, data: { mainTable, childTable } });
    } catch (error) {
        next(error);
    }
};

export const unmergeTable = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { restaurantId } = req.query;

        const table = await Table.findById(id);
        if (!table) {
            return res.status(404).json({ success: false, message: 'Table not found' });
        }

        if (!table.currentSession?.mergedInto) {
            return res.status(400).json({ success: false, message: 'Table is not merged' });
        }

        const mergedInto = table.currentSession.mergedInto;
        const ordersUnderChild = await Order.countDocuments({
            table: id, paymentStatus: 'UNPAID'
        });

        if (ordersUnderChild > 0) {
            await Order.updateMany(
                { table: id },
                { $set: { table: mergedInto } }
            );
        }

        table.currentSession = null;
        table.status = 'FREE';
        await table.save();

        const io = req.app.get('io');
        if (io && restaurantId) {
            io.to(`restaurant:${restaurantId}`).emit('table:updated', table);
        }

        res.status(200).json({ success: true, data: table });
    } catch (error) {
        next(error);
    }
};
