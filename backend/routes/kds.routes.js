import express from 'express';
import {
    getActiveOrders,
    updateOrderStatus,
    getNotifications,
    markNotificationRead
} from '../controllers/kds.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/orders', protect, authorize(['CHEF', 'OWNER', 'ADMIN'], ['orders']), getActiveOrders);
router.patch('/orders/:id/status', protect, authorize(['CHEF', 'OWNER', 'ADMIN'], ['orders']), updateOrderStatus);
router.get('/notifications', protect, authorize(['CHEF', 'OWNER', 'ADMIN'], ['orders']), getNotifications);
router.patch('/notifications/:id/read', protect, authorize(['CHEF', 'OWNER', 'ADMIN'], ['orders']), markNotificationRead);

export default router;
