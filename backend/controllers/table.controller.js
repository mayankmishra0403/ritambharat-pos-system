import Table from '../models/Table.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import QRCode from 'qrcode';
import { sendWhatsAppToStaff, sendWhatsAppForTable } from '../services/whatsapp.service.js';
import { releaseWaiter } from '../services/waiterAssignment.service.js';

// Derive frontend URL from request (works on any domain, localhost, or deploy)
function getFrontendUrl(req) {
    if (req.headers.origin) return req.headers.origin;
    if (req.headers.host) {
        const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
        return `${protocol}://${req.headers.host}`;
    }
    return process.env.CLIENT_URL || 'https://ritambharat.com';
}

// @desc    Create table
// @route   POST /api/tables
// @access  Private (Owner)
// @desc    Create table
// @route   POST /api/tables
// @access  Private (Owner)
export const createTable = async (req, res, next) => {
    try {
        const { restaurant, name, capacity, location } = req.body;

        // Security check: Ensure owner is creating table for their own restaurant
        if (req.user.role !== 'ADMIN' && req.user.restaurant?.toString() !== restaurant) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to add tables to this restaurant'
            });
        }

        const table = await Table.create({
            restaurant,
            name,
            capacity,
            location
        });

        // Generate QR code image with domain from request
        const createFrontendUrl = getFrontendUrl(req);
        const fullQrUrl = `${createFrontendUrl}${table.qrCode}`;
        const qrCodeDataUrl = await QRCode.toDataURL(fullQrUrl);

        res.status(201).json({
            success: true,
            message: 'Table created successfully',
            data: {
                ...table.toObject(),
                qrCodeImage: qrCodeDataUrl
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all tables for a restaurant
// @route   GET /api/tables?restaurant=:restaurantId
// @access  Public
export const getTables = async (req, res, next) => {
    try {
        const { restaurant } = req.query;

        if (!restaurant) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        const tables = await Table.find({ restaurant, isActive: true });

        // Generate QR code images with domain from request
        const listFrontendUrl = getFrontendUrl(req);
        const tablesWithQR = await Promise.all(tables.map(async (table) => {
            const fullQrUrl = `${listFrontendUrl}${table.qrCode}`;
            const qrCodeImage = await QRCode.toDataURL(fullQrUrl);
            const tableData = table.toObject();
            if (tableData.currentSession) {
                delete tableData.currentSession.securityToken;
            }
            return {
                ...tableData,
                qrCodeImage
            };
        }));

        res.status(200).json({
            success: true,
            count: tables.length,
            data: tablesWithQR
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single table
// @route   GET /api/tables/:id
// @access  Public
export const getTable = async (req, res, next) => {
    try {
        const table = await Table.findById(req.params.id).populate('restaurant');

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Generate QR code image with domain from request
        const singleFrontendUrl = getFrontendUrl(req);
        const fullQrUrl = `${singleFrontendUrl}${table.qrCode}`;
        const qrCodeDataUrl = await QRCode.toDataURL(fullQrUrl);

        // Return table data WITHOUT exposing security tokens
        const tableData = table.toObject();
        if (tableData.currentSession) {
            delete tableData.currentSession.securityToken;
        }

        res.status(200).json({
            success: true,
            data: {
                ...tableData,
                qrCodeImage: qrCodeDataUrl
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update table
// @route   PATCH /api/tables/:id
// @access  Private (Owner)
export const updateTable = async (req, res, next) => {
    try {
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Security check
        if (req.user.role !== 'ADMIN' && req.user.restaurant?.toString() !== table.restaurant.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this table'
            });
        }

        if (req.body.status === 'OCCUPIED' && table.status !== 'OCCUPIED') {
            if (!table.currentSession) table.currentSession = {};
            table.currentSession.occupiedAt = new Date();
        }

        const allowedFields = ['name', 'capacity', 'room', 'shape', 'posX', 'posY', 'location', 'status', 'isActive'];
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                table[field] = req.body[field];
            }
        }
        await table.save();

        res.status(200).json({
            success: true,
            message: 'Table updated successfully',
            data: table
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Private (Owner)
export const deleteTable = async (req, res, next) => {
    try {
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Security check
        if (req.user.role !== 'ADMIN' && req.user.restaurant?.toString() !== table.restaurant.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this table'
            });
        }

        table.isActive = false;
        await table.save();

        res.status(200).json({
            success: true,
            message: 'Table deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Download QR code
// @route   GET /api/tables/:id/qr
// @access  Private (Owner)
export const downloadQRCode = async (req, res, next) => {
    try {
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Security check
        if (req.user.role !== 'ADMIN' && req.user.restaurant?.toString() !== table.restaurant.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to download this QR code'
            });
        }

        // Generate QR code as buffer with domain from request
        const downloadFrontendUrl = getFrontendUrl(req);
        const fullQrUrl = `${downloadFrontendUrl}${table.qrCode}`;
        const qrCodeBuffer = await QRCode.toBuffer(fullQrUrl, {
            width: 500,
            margin: 2
        });

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="table-${table.name}-qr.png"`);
        res.send(qrCodeBuffer);
    } catch (error) {
        next(error);
    }
};

// @desc    Reset table (Mark as FREE)
// @route   PATCH /api/tables/:id/reset
// @access  Private (Owner/Waiter)
export const resetTable = async (req, res, next) => {
    try {
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Security check (Allow waiters too)
        if (req.user.role !== 'ADMIN' &&
            req.user.restaurant?.toString() !== table.restaurant.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to reset this table'
            });
        }

        const sessionId = table.currentSession?.sessionId;

        // 1. Mark orders for this session as PAID if they aren't already
        if (sessionId) {
            const orders = await Order.find({ sessionId, paymentStatus: 'UNPAID' });

            for (const order of orders) {
                order.paymentStatus = 'PAID';
                if (!order.paymentMethod) order.paymentMethod = 'CASH'; // Default to CASH for manual reset
                await order.save();

                // 2. Create a Payment record if none exists for this order
                const existingPayment = await Payment.findOne({ order: order._id });
                if (!existingPayment) {
                    await Payment.create({
                        restaurant: table.restaurant,
                        order: order._id,
                        amount: order.total,
                        paymentMethod: order.paymentMethod,
                        status: 'COMPLETED',
                        transactionId: `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
                    });
                } else if (existingPayment.status !== 'COMPLETED') {
                    existingPayment.status = 'COMPLETED';
                    await existingPayment.save();
                }
            }

            // Emit update for orders if any were changed
            if (orders.length > 0) {
                const io = req.app.get('io');
                if (io) {
                    io.to(`restaurant:${table.restaurant}`).emit('order:payment-updated', {
                        restaurantId: table.restaurant,
                        message: `Orders for ${table.name} marked as PAID via table reset.`
                    });
                }
            }
        }

        await releaseWaiter({ restaurantId: table.restaurant, tableId: table._id, changedBy: req.user?._id, reason: 'Table reset' });

        table.status = 'FREE';
        table.currentSession = {
            sessionId: null,
            securityToken: null,
            startTime: null,
            occupiedAt: null,
            orderId: null,
            waiterId: null
        }; // Clear session data completely
        await table.save();

        // Emit table update event
        const io = req.app.get('io');
        if (io) {
            io.to(`restaurant:${table.restaurant}`).emit('table:updated', table);
        }

        await sendWhatsAppForTable(table._id, `🔄 Reset & Paid – Table ${table.name}`, '', { ownerPrefix: 'Reset' });

        res.status(200).json({
            success: true,
            message: 'Table reset successfully',
            data: table
        });
    } catch (error) {
        next(error);
    }
};
