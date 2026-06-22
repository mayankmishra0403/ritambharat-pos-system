import express from 'express';
import {
    addStaff,
    getStaff,
    removeStaff,
    updateStaff,
    createStaffReview,
    getStaffReviews,
    getRestaurantStaffStats
} from '../controllers/staff.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes for customers
router.get('/', getStaff);
router.post('/:id/review', createStaffReview);
router.get('/:id/reviews', getStaffReviews);

// Protected routes for owners/admins
router.use(protect);
router.use(authorize(['OWNER', 'ADMIN', 'STAFF_MANAGEMENT'], ['staff']));

router.post('/', addStaff);
router.patch('/:id', updateStaff);
router.get('/stats/summary', getRestaurantStaffStats);
router.delete('/:id', removeStaff);

export default router;
