import ServiceRequest from '../models/ServiceRequest.js';
import Table from '../models/Table.js';
import { sendPushToRestaurantStaff } from '../services/push.service.js';

// @desc    Create service request
// @route   POST /api/service/request
// @access  Public
export const createServiceRequest = async (req, res, next) => {
    try {
        const { restaurant, table, type, comment } = req.body;

        // Prevent duplicate pending requests of the same type for same table
        const existing = await ServiceRequest.findOne({
            restaurant,
            table,
            type,
            status: 'PENDING'
        });

        if (existing) {
            return res.status(200).json({
                success: true,
                message: 'Request already exists',
                data: existing
            });
        }

        const request = await ServiceRequest.create({
            restaurant,
            table,
            type,
            comment
        });

        const tableDoc = await Table.findById(table);

        // Emit socket event
        const io = req.app.get('io');
        io.to(`restaurant:${restaurant}`).emit('service:new', {
            request,
            tableName: tableDoc ? tableDoc.name : 'Unknown Table',
            message: `New ${type.replace('_', ' ')} from ${tableDoc ? tableDoc.name : 'table'}`
        });

        sendPushToRestaurantStaff(restaurant, {
            title: 'Customer Request',
            body: `New ${type.replace('_', ' ').toLowerCase()} from ${tableDoc ? tableDoc.name : 'a table'}`,
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
            vibrate: [200, 100, 200],
            sound: '/sounds/notification.mp3',
            data: { url: '/waiter-app', type: 'waiter-call' }
        }, ['WAITER', 'OWNER']);

        res.status(201).json({
            success: true,
            data: request
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get service requests
// @route   GET /api/service
// @access  Private (Staff)
export const getServiceRequests = async (req, res, next) => {
    try {
        const { status } = req.query;
        const query = { restaurant: req.restaurantId }; // verifyRestaurantOwnership sets this

        if (status) query.status = status;
        else query.status = { $ne: 'COMPLETED' }; // Default only active

        const requests = await ServiceRequest.find(query)
            .populate('table', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update request status
// @route   PATCH /api/service/:id
// @access  Private (Staff)
export const updateServiceRequest = async (req, res, next) => {
    try {
        const { status } = req.body;

        const request = await ServiceRequest.findByIdAndUpdate(
            req.params.id,
            {
                status,
                handledBy: req.user._id,
                notifiedAt: ['COMPLETED', 'CANCELLED'].includes(status) ? new Date() : undefined
            },
            { new: true }
        ).populate('table', 'name');

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Emit update to restaurant staff
        const io = req.app.get('io');
        io.to(`restaurant:${request.restaurant}`).emit('service:updated', request);

        // Notify customer if request was completed or cancelled
        if (status === 'COMPLETED') {
            io.to(`table:${request.table?._id}`).emit('service:completed', {
                type: request.type,
                message: `Your ${request.type.replace('_', ' ').toLowerCase()} request has been completed!`
            });
        } else if (status === 'CANCELLED') {
            io.to(`table:${request.table?._id}`).emit('service:cancelled', {
                type: request.type,
                message: `Your ${request.type.replace('_', ' ').toLowerCase()} request was cancelled.`
            });
        }

        res.status(200).json({
            success: true,
            data: request
        });
    } catch (error) {
        next(error);
    }
};
