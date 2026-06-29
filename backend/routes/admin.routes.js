import express from 'express';
import {
    getDashboard,
    getRestaurants,
    getRestaurantStats,
    getDeletedRestaurants,
    createRestaurant,
    toggleRestaurantStatus,
    deleteRestaurant,
    restoreRestaurant,
    bulkToggleRestaurants,
    bulkDeleteRestaurants,
    getUsers,
    toggleUserStatus,
    deleteUser,
    bulkToggleUsers,
    bulkDeleteUsers,
    resetUserPassword,
    getActivities,
    getSystemHealth
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { adminAccess } from '../middleware/tenant.js';

const router = express.Router();

// All admin routes require SUPER_ADMIN or ADMIN role
router.use(protect);
router.use(authorize(['SUPER_ADMIN', 'ADMIN']));

router.get('/dashboard', getDashboard);
router.get('/activities', getActivities);
router.get('/restaurants', getRestaurants);
router.get('/restaurants/stats/:id', getRestaurantStats);
router.get('/restaurants/deleted', getDeletedRestaurants);
router.post('/restaurants', createRestaurant);
router.post('/restaurants/bulk/toggle-status', bulkToggleRestaurants);
router.post('/restaurants/bulk/delete', bulkDeleteRestaurants);
router.patch('/restaurants/:id/toggle-status', toggleRestaurantStatus);
router.post('/restaurants/:id/restore', restoreRestaurant);
router.delete('/restaurants/:id', deleteRestaurant);
router.get('/users', getUsers);
router.post('/users/bulk/toggle-status', bulkToggleUsers);
router.post('/users/bulk/delete', bulkDeleteUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/reset-password', resetUserPassword);
router.get('/health', getSystemHealth);

// WhatsApp Credit routes (mounted at /admin/whatsapp)
import whatsappCreditRouter from './whatsappCredit.routes.js';
router.use('/whatsapp', whatsappCreditRouter);

export default router;
