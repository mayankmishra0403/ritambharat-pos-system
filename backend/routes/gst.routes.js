import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
    getSlabs, createSlab, updateSlab, deleteSlab,
    setDefaultSlab, initDefaults, generateInvoice, getInvoice
} from '../controllers/gst.controller.js';

const router = Router();

router.use(protect);
router.use(authorize(['OWNER', 'ADMIN'], ['menu', 'revenue']));

router.get('/slabs', getSlabs);
router.post('/slabs', createSlab);
router.patch('/slabs/:id', updateSlab);
router.delete('/slabs/:id', deleteSlab);
router.patch('/slabs/:id/default', setDefaultSlab);
router.post('/init-defaults', initDefaults);
router.get('/invoice/:orderId', getInvoice);
router.post('/invoice/:orderId', generateInvoice);

export default router;
