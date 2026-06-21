import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { listCustomers, getCustomerDetail, getCustomerOrders } from '../controllers/customer.controller.js';

const router = Router();

router.use(protect);
router.use(authorize(['OWNER', 'ADMIN'], ['dashboard', 'revenue']));

router.get('/', listCustomers);
router.get('/:id', getCustomerDetail);
router.get('/:id/orders', getCustomerOrders);

export default router;
