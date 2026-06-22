import express from 'express';
import { verifyWebhook, handleIncomingMessage, sendMessage } from '../controllers/whatsapp.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/webhook', verifyWebhook);
router.post('/webhook', handleIncomingMessage);
router.post('/send', protect, sendMessage);

export default router;
