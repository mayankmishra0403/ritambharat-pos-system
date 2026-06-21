import express from 'express';
import {
    createRestaurant,
    getRestaurant,
    updateRestaurant,
    updateRestaurantSettings,
    getMyRestaurants,
    getMyPrimaryRestaurant,
    deleteRestaurant
} from '../controllers/restaurant.controller.js';
import {
    getInvoiceSettings,
    updateInvoiceSettings
} from '../controllers/invoiceSettings.controller.js';
import { protect, authorize, verifyRestaurantOwnership } from '../middleware/auth.js';
import { cacheMiddleware, clearCache } from '../middleware/cache.middleware.js';

const router = express.Router();

router.post('/', protect, authorize('OWNER', 'ADMIN'), createRestaurant);
router.get('/my-restaurants', protect, authorize('OWNER'), getMyRestaurants);
router.get('/my-primary', protect, authorize('OWNER'), getMyPrimaryRestaurant);
router.get('/:id', cacheMiddleware(3600), getRestaurant);

// Clear cache on updates
const invalidateRestaurantCache = (req, res, next) => {
    clearCache(`restaurant/${req.params.id}`);
    next();
};

router.patch('/:id', protect, authorize(['OWNER', 'ADMIN'], ['settings']), verifyRestaurantOwnership, invalidateRestaurantCache, updateRestaurant);
router.patch('/:id/settings', protect, authorize(['OWNER', 'ADMIN'], ['settings']), verifyRestaurantOwnership, invalidateRestaurantCache, updateRestaurantSettings);
router.get('/:id/invoice-settings', protect, authorize(['OWNER', 'ADMIN'], ['settings']), verifyRestaurantOwnership, getInvoiceSettings);
router.patch('/:id/invoice-settings', protect, authorize(['OWNER', 'ADMIN'], ['settings']), verifyRestaurantOwnership, invalidateRestaurantCache, updateInvoiceSettings);
router.delete('/:id', protect, authorize(['OWNER', 'ADMIN'], ['settings']), verifyRestaurantOwnership, invalidateRestaurantCache, deleteRestaurant);

export default router;
