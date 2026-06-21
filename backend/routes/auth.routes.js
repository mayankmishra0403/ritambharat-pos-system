import express from 'express';
import { register, login, pinLogin, setPin, refreshToken, logout, getMe, forgotPassword, verifyOTP, resetPassword } from '../controllers/auth.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import {
    registerValidation,
    loginValidation,
    refreshTokenValidation,
    forgotPasswordValidation,
    verifyOTPValidation,
    resetPasswordValidation
} from '../middleware/validators/auth.validator.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Rate limiters
const authLimiter = createRateLimiter(20, 15); // 20 requests per 15 minutes
const generalLimiter = createRateLimiter(50, 15); // 50 requests per 15 minutes

// Public routes
router.post('/register', generalLimiter, registerValidation, register);
router.post('/login', generalLimiter, loginValidation, login);
router.post('/pin-login', generalLimiter, pinLogin);
router.post('/set-pin', protect, authorize(['OWNER']), setPin);
router.post('/refresh', refreshTokenValidation, refreshToken);

// Password reset routes
router.post('/forgot-password', authLimiter, forgotPasswordValidation, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOTPValidation, verifyOTP);
router.post('/reset-password', authLimiter, resetPasswordValidation, resetPassword);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
