import express from 'express';
import {
    createManualBill,
    getPaymentMethods
} from '../controllers/payment.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/manual-bill', protect, authorize(['OWNER', 'ADMIN', 'CASHIER'], ['orders', 'revenue']), createManualBill);
router.get('/methods', protect, authorize(['OWNER', 'ADMIN', 'CASHIER'], ['orders', 'revenue']), getPaymentMethods);

export default router;
