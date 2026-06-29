import express from 'express';
import {
    getAllCredits,
    getCreditByRestaurant,
    addCredits,
    deductCredits,
    updateThreshold,
    getTransactions,
    getAllTransactions
} from '../controllers/whatsappCredit.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { adminAccess } from '../middleware/tenant.js';

const router = express.Router();

router.use(protect);
router.use(authorize(['SUPER_ADMIN', 'ADMIN']));

router.get('/', getAllCredits);
router.get('/transactions/all', getAllTransactions);
router.get('/:restaurantId', getCreditByRestaurant);
router.get('/:restaurantId/transactions', getTransactions);
router.post('/add', addCredits);
router.post('/deduct', deductCredits);
router.put('/threshold', updateThreshold);

export default router;
