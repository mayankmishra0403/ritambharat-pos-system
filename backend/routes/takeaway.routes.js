import express from 'express';
import {
    getTakeawayDashboard,
    createTakeawayOrder,
    addTakeawayItems,
    markTakeawayReady,
    markTakeawayComplete
} from '../controllers/takeaway.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, authorize(['OWNER', 'ADMIN', 'WAITER', 'CASHIER', 'CHEF'], ['orders']), getTakeawayDashboard);
router.post('/order', protect, authorize(['OWNER', 'ADMIN', 'WAITER', 'CASHIER', 'CHEF'], ['orders']), createTakeawayOrder);
router.post('/order/:id/items', protect, authorize(['OWNER', 'ADMIN', 'WAITER', 'CASHIER', 'CHEF'], ['orders']), addTakeawayItems);
router.patch('/order/:id/ready', protect, authorize(['OWNER', 'ADMIN', 'WAITER', 'CASHIER', 'CHEF'], ['orders']), markTakeawayReady);
router.patch('/order/:id/complete', protect, authorize(['OWNER', 'ADMIN', 'WAITER', 'CASHIER', 'CHEF'], ['orders']), markTakeawayComplete);

export default router;
