import Complaint from '../models/Complaint.js';
import logger from '../utils/logger.js';
import { sendPushToRestaurantStaff } from '../services/push.service.js';
import { sendWhatsAppToStaff } from '../services/whatsapp.service.js';

// @desc    Create complaint
// @route   POST /api/complaints
// @access  Public
export const createComplaint = async (req, res, next) => {
    try {
        const { restaurant, customerName, contact, type, severity, message, voiceNoteUrl } = req.body;

        const complaint = await Complaint.create({
            restaurant,
            customerName,
            contact,
            type,
            severity,
            message,
            voiceNoteUrl
        });

        // Emit socket event to admins/staff
        const io = req.app.get('io');
        io.to(`restaurant:${restaurant}`).emit('complaint:new', {
            complaint,
            message: `New ${severity} complaint from ${customerName}`
        });

        sendPushToRestaurantStaff(restaurant, {
            title: 'New Complaint',
            body: `${severity} complaint from ${customerName}: ${type}`,
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
            vibrate: [200, 100, 200],
            sound: '/sounds/notification.mp3',
            data: { url: '/complaints', type: 'complaint' }
        }, ['OWNER', 'WAITER', 'CHEF']);

        sendWhatsAppToStaff(restaurant, `⚠️ ${severity} complaint from ${customerName}: ${type}`, ['OWNER', 'WAITER', 'CHEF']);

        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully',
            data: complaint
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get complaints
// @route   GET /api/complaints
// @access  Private (Owner/Admin)
export const getComplaints = async (req, res, next) => {
    try {
        if (!req.restaurantId) {
            return res.status(400).json({ success: false, message: 'Restaurant ID not found in request' });
        }

        const { status, type, startDate, endDate } = req.query;
        const query = { restaurant: req.restaurantId, isDeleted: false };

        if (status) query.status = status;
        if (type) query.type = type;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const complaints = await Complaint.find(query)
            .sort({ createdAt: -1 })
            .populate('resolvedBy', 'name');

        res.status(200).json({
            success: true,
            count: complaints.length,
            data: complaints
        });
    } catch (error) {
        logger.error(`Error in getComplaints: ${error.message}`);
        next(error);
    }
};

// @desc    Update complaint status (Resolve)
// @route   PATCH /api/complaints/:id
// @access  Private (Owner/Admin)
export const updateComplaint = async (req, res, next) => {
    try {
        const { status, resolution } = req.body;

        const updateData = { status };

        if (status === 'RESOLVED' || status === 'CLOSED') {
            updateData.resolvedBy = req.user._id;
            updateData.resolvedAt = new Date();
            if (resolution) updateData.resolution = resolution;
        }

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        res.status(200).json({
            success: true,
            data: complaint
        });
    } catch (error) {
        next(error);
    }
};
