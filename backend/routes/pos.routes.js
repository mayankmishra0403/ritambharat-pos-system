import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
    openSession,
    getCurrentSession,
    closeSession,
    getPosData,
    createPosOrder,
    processPayment,
    addPosOrderItems,
    updateOrderTotals,
    mergeTables,
    unmergeTable
} from '../controllers/pos.controller.js';

const router = Router();

router.use(protect);
router.use(authorize(['OWNER', 'ADMIN', 'CHEF', 'CASHIER'], ['orders', 'revenue']));

router.post('/session', openSession);
router.get('/session/current', getCurrentSession);
router.patch('/session/:id/close', closeSession);

router.get('/data', getPosData);
router.post('/order', createPosOrder);
router.post('/order/:id/payment', processPayment);
router.post('/order/:id/items', addPosOrderItems);
router.patch('/order/:id/totals', updateOrderTotals);

router.post('/tables/:mainId/merge/:childId', mergeTables);
router.post('/tables/:id/unmerge', unmergeTable);

export default router;
