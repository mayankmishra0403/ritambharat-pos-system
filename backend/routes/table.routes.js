import express from 'express';
import {
    createTable,
    getTables,
    getTable,
    updateTable,
    deleteTable,
    downloadQRCode,
    resetTable
} from '../controllers/table.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('OWNER', 'ADMIN'), createTable);
router.get('/', getTables);
router.get('/:id', getTable);
router.get('/:id/qr', protect, authorize('OWNER', 'ADMIN'), downloadQRCode);
router.patch('/:id', protect, authorize('OWNER', 'ADMIN'), updateTable);
router.patch('/:id/reset', protect, authorize('OWNER', 'ADMIN', 'WAITER'), resetTable);
router.delete('/:id', protect, authorize('OWNER', 'ADMIN'), deleteTable);

export default router;
