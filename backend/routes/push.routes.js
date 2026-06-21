import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { subscribe, unsubscribe, getVapidPublicKey } from '../controllers/push.controller.js';

const router = Router();

router.get('/vapid-public-key', getVapidPublicKey);
router.post('/subscribe', protect, subscribe);
router.post('/unsubscribe', protect, unsubscribe);

export default router;
