import express from 'express';
import {
    getRooms,
    createRoom,
    updateRoom,
    deleteRoom
} from '../controllers/room.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, authorize(['OWNER', 'ADMIN'], ['tables']), getRooms);
router.post('/', protect, authorize(['OWNER', 'ADMIN'], ['tables']), createRoom);
router.patch('/:id', protect, authorize(['OWNER', 'ADMIN'], ['tables']), updateRoom);
router.delete('/:id', protect, authorize(['OWNER', 'ADMIN'], ['tables']), deleteRoom);

export default router;
