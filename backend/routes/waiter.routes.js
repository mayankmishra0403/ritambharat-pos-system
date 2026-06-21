import express from 'express';
import {
    getWaiterData,
    getWaiterTables,
    getWaiterOrders,
    createWaiterOrder,
    updateWaiterOrderStatus,
    requestWaiterBill,
    addWaiterOrderItems
} from '../controllers/waiter.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/data', protect, authorize(['WAITER', 'OWNER', 'ADMIN'], ['orders']), getWaiterData);
router.get('/tables', protect, authorize(['WAITER', 'OWNER', 'ADMIN'], ['orders']), getWaiterTables);
router.get('/orders', protect, authorize(['WAITER', 'OWNER', 'ADMIN'], ['orders']), getWaiterOrders);
router.post('/order', protect, authorize(['WAITER', 'OWNER', 'ADMIN'], ['orders']), createWaiterOrder);
router.patch('/orders/:id/status', protect, authorize(['WAITER', 'OWNER', 'ADMIN'], ['orders']), updateWaiterOrderStatus);
router.post('/orders/:id/items', protect, authorize(['WAITER', 'OWNER', 'ADMIN'], ['orders']), addWaiterOrderItems);
router.post('/orders/:id/bill', protect, authorize(['WAITER', 'OWNER', 'ADMIN'], ['orders']), requestWaiterBill);

export default router;
