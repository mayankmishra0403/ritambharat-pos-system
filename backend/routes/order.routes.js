import express from 'express';
import {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    updateOrderPayment,
    cancelOrder,
    getOrderStats,
    getActiveBill,
    updateOrderCustomer,
    acceptOrder
} from '../controllers/order.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { orderRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/', orderRateLimiter, createOrder);
router.get('/', protect, authorize(['OWNER', 'CHEF', 'ADMIN', 'CASHIER'], ['orders']), getOrders); // Query param style
router.get('/restaurant/:restaurantId', protect, authorize(['OWNER', 'CHEF', 'ADMIN', 'CASHIER'], ['orders']), getOrders); // Params style (Prompt requirement)
router.get('/stats/:restaurantId', protect, authorize(['OWNER', 'ADMIN'], ['analytics']), getOrderStats);
router.get('/session/active/:tableId', getActiveBill);
router.get('/:id', getOrder);
router.patch('/:id/status', protect, authorize(['OWNER', 'CHEF', 'ADMIN', 'CASHIER'], ['orders']), updateOrderStatus);
router.patch('/:id/payment', protect, authorize(['OWNER', 'CHEF', 'ADMIN', 'CASHIER'], ['orders']), updateOrderPayment);
router.patch('/:id/customer', protect, authorize(['OWNER', 'ADMIN', 'CASHIER', 'WAITER'], ['orders']), updateOrderCustomer);
router.delete('/:id', protect, authorize(['OWNER', 'CHEF', 'ADMIN', 'CASHIER', 'WAITER'], ['orders']), cancelOrder);
router.post('/:id/accept', protect, authorize(['OWNER', 'CHEF', 'ADMIN', 'CASHIER', 'WAITER'], ['orders']), acceptOrder);

export default router;
