import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
    listCustomers,
    getCustomerDetail,
    getCustomerOrders,
    findOrCreateCustomer,
    updateCustomer,
    redeemLoyaltyPoints,
    getLoyaltySettings,
    getBirthdayCustomers
} from '../controllers/customer.controller.js';

const router = Router();

router.post('/find-or-create', protect, findOrCreateCustomer);
router.get('/loyalty-settings', protect, getLoyaltySettings);
router.get('/birthday', protect, getBirthdayCustomers);

router.use(protect);
router.use(authorize(['OWNER', 'ADMIN'], ['dashboard', 'revenue']));

router.get('/', listCustomers);
router.get('/:id', getCustomerDetail);
router.patch('/:id', updateCustomer);
router.post('/redeem', redeemLoyaltyPoints);
router.get('/:id/orders', getCustomerOrders);

export default router;
