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
import {
    updateWaiterStatus,
    transferTableWaiter,
    getLoads,
    getMyTables,
    releaseTableWaiter
} from '../controllers/assignment.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Existing waiter routes
router.get('/data', protect, authorize(['WAITER', 'OWNER', 'ADMIN'], ['orders']), getWaiterData);
router.get('/tables', protect, authorize(['WAITER', 'OWNER', 'ADMIN'], ['orders']), getWaiterTables);
router.get('/orders', protect, authorize(['WAITER', 'OWNER', 'ADMIN'], ['orders']), getWaiterOrders);
router.post('/order', protect, authorize(['WAITER', 'OWNER', 'ADMIN'], ['orders']), createWaiterOrder);
router.patch('/orders/:id/status', protect, authorize(['WAITER', 'OWNER', 'ADMIN'], ['orders']), updateWaiterOrderStatus);
router.post('/orders/:id/items', protect, authorize(['WAITER', 'OWNER', 'ADMIN'], ['orders']), addWaiterOrderItems);
router.post('/orders/:id/bill', protect, authorize(['WAITER', 'OWNER', 'ADMIN'], ['orders']), requestWaiterBill);

// Assignment routes
router.patch('/status', protect, authorize(['WAITER', 'OWNER', 'ADMIN'], ['orders']), updateWaiterStatus);
router.post('/transfer', protect, authorize(['OWNER', 'ADMIN'], ['staff']), transferTableWaiter);
router.get('/loads', protect, authorize(['OWNER', 'ADMIN', 'CASHIER'], ['orders', 'staff']), getLoads);
router.get('/my-tables', protect, authorize(['WAITER', 'OWNER', 'ADMIN'], ['orders']), getMyTables);
router.post('/:tableId/release', protect, authorize(['OWNER', 'ADMIN'], ['staff']), releaseTableWaiter);

export default router;
