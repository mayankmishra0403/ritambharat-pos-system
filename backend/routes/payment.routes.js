import express from 'express';
import {
    createPaymentIntent,
    createManualBill,
    getPaymentMethods,
    handleSafepayWebhook
} from '../controllers/payment.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Payment routes
router.post('/create', protect, authorize(['OWNER', 'ADMIN', 'CASHIER'], ['orders', 'revenue']), createPaymentIntent);
router.post('/manual-bill', protect, authorize(['OWNER', 'ADMIN', 'CASHIER'], ['orders', 'revenue']), createManualBill);
router.get('/methods', protect, authorize(['OWNER', 'ADMIN', 'CASHIER'], ['orders', 'revenue']), getPaymentMethods);

// Webhook routes
router.post('/webhook/safepay', handleSafepayWebhook);

export default router;
