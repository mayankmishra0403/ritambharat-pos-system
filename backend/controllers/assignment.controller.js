import { assignWaiter, releaseWaiter, transferWaiter, getWaiterLoads, getAssignedTables } from '../services/waiterAssignment.service.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

export const updateWaiterStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['AVAILABLE', 'BUSY', 'BREAK', 'OFFLINE', 'SHIFT_ENDED'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const update = { waiterStatus: status };
        if (status === 'AVAILABLE' || status === 'BUSY') {
            update.checkedInAt = new Date();
        }

        await User.findByIdAndUpdate(req.user._id, update);

        const io = req.app.get('io');
        if (io) {
            io.to(`restaurant:${req.user.restaurant}`).emit('waiter:status-changed', {
                waiterId: req.user._id,
                status
            });
        }

        logger.info(`Waiter ${req.user.name} status → ${status}`);

        res.status(200).json({ success: true, message: `Status updated to ${status}` });
    } catch (error) {
        next(error);
    }
};

export const transferTableWaiter = async (req, res, next) => {
    try {
        const { tableId, newWaiterId, reason } = req.body;

        if (!tableId || !newWaiterId) {
            return res.status(400).json({ success: false, message: 'tableId and newWaiterId are required' });
        }

        const result = await transferWaiter({
            restaurantId: req.user.restaurant,
            tableId,
            newWaiterId,
            changedBy: req.user._id,
            reason
        });

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }

        const io = req.app.get('io');
        if (io && result.oldWaiterId) {
            io.to(`restaurant:${req.user.restaurant}`).emit('waiter:transferred', {
                tableId,
                oldWaiterId: result.oldWaiterId,
                newWaiterId
            });
        }

        res.status(200).json({ success: true, data: { waiter: result.waiter } });
    } catch (error) {
        next(error);
    }
};

export const getLoads = async (req, res, next) => {
    try {
        const { restaurantId } = req.query;
        const id = restaurantId || req.user.restaurant;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
        }

        const loads = await getWaiterLoads(id);

        res.status(200).json({ success: true, data: loads });
    } catch (error) {
        next(error);
    }
};

export const getMyTables = async (req, res, next) => {
    try {
        const tables = await getAssignedTables(req.user._id);

        res.status(200).json({ success: true, data: tables });
    } catch (error) {
        next(error);
    }
};

export const releaseTableWaiter = async (req, res, next) => {
    try {
        const { tableId } = req.params;

        if (!tableId) {
            return res.status(400).json({ success: false, message: 'tableId is required' });
        }

        const result = await releaseWaiter({
            restaurantId: req.user.restaurant,
            tableId,
            changedBy: req.user._id,
            reason: 'Manual release'
        });

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`restaurant:${req.user.restaurant}`).emit('waiter:released', {
                tableId,
                waiterId: result.waiterId
            });
        }

        res.status(200).json({ success: true, message: 'Waiter released from table' });
    } catch (error) {
        next(error);
    }
};
