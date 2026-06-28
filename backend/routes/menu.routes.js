import express from 'express';
import {
    createMenuItem,
    getMenuItems,
    getMenuItem,
    updateMenuItem,
    toggleAvailability,
    deleteMenuItem,
    getCategories,
    updateIngredients,
    getCosting
} from '../controllers/menu.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { cacheMiddleware, clearCache } from '../middleware/cache.middleware.js';

const router = express.Router();

// General Menu Invalidator
const invalidateMenuCache = (req, res, next) => {
    // We clear all menu cache for this restaurant to keep simple
    clearCache('menu');
    next();
};

router.post('/', protect, authorize(['OWNER', 'ADMIN'], ['menu']), invalidateMenuCache, createMenuItem);
router.get('/', cacheMiddleware(3600), getMenuItems);
router.get('/restaurant/:id', cacheMiddleware(3600), getMenuItems);
router.get('/restaurant/:id/active', (req, res, next) => { req.query.available = 'true'; next(); }, cacheMiddleware(3600), getMenuItems);
router.get('/categories/:restaurantId', cacheMiddleware(3600), getCategories);
router.get('/:id', cacheMiddleware(3600), getMenuItem);
router.patch('/:id', protect, authorize(['OWNER', 'ADMIN'], ['menu']), invalidateMenuCache, updateMenuItem);
router.patch('/:id/availability', protect, authorize(['OWNER', 'CHEF', 'ADMIN'], ['menu']), invalidateMenuCache, toggleAvailability);
router.put('/:id/ingredients', protect, authorize(['OWNER', 'ADMIN'], ['menu']), invalidateMenuCache, updateIngredients);
router.get('/:id/costing', protect, authorize(['OWNER', 'ADMIN'], ['menu']), getCosting);
router.delete('/:id', protect, authorize(['OWNER', 'ADMIN'], ['menu']), invalidateMenuCache, deleteMenuItem);

export default router;
