import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '1h'
    });
};

// Generate refresh token
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            logger.warn(`Registration failed: Email already exists - ${email}`);
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'OWNER',
            emailVerified: true
        });

        logger.info(`New user registered: ${user.email} (${user.role})`);

        res.status(201).json({
            success: true,
            message: 'Registration successful. You can now login.',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    emailVerified: true
                }
            }
        });
    } catch (error) {
        logger.error(`Registration error: ${error.message}`);
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for user (include password for comparison)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            logger.warn(`Login failed: Invalid email - ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            logger.warn(`Login failed: Inactive account - ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // PIN-based roles must use PIN login, not email/password
        if (user.role === 'WAITER' || user.role === 'CASHIER') {
            logger.warn(`Login failed: ${user.role} must use PIN login - ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Staff accounts use PIN login. Please use the PIN login option.'
            });
        }

        // Auto-verify email if not already (email system removed)
        if (!user.emailVerified) {
            user.emailVerified = true;
            await user.save({ validateBeforeSave: false });
            logger.info(`Email auto-verified for existing user: ${user.email}`);
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            logger.warn(`Login failed: Invalid password - ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Populate restaurant for immediate frontend benefit
        await user.populate('restaurant');

        // Generate tokens
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        logger.info(`User logged in: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user, // Return full populated user
                token,
                refreshToken
            }
        });
    } catch (error) {
        logger.error(`Login error: ${error.message}`);
        next(error);
    }
};

// @desc    PIN Login for staff (WAITER, CASHIER)
// @route   POST /api/auth/pin-login
// @access  Public
export const pinLogin = async (req, res, next) => {
    try {
        const { pin, restaurantId } = req.body;

        if (!pin) {
            return res.status(400).json({
                success: false,
                message: 'PIN is required'
            });
        }

        // Find all staff with PINs — optionally filter by restaurant
        const filter = {
            role: { $in: ['WAITER', 'CASHIER', 'CHEF'] },
            isActive: true,
            pin: { $exists: true, $ne: null }
        };
        if (restaurantId) {
            filter.restaurant = restaurantId;
        }
        const staffUsers = await User.find(filter).select('+pin');

        let user = null;
        for (const u of staffUsers) {
            if (await u.comparePin(pin.toString())) {
                user = u;
                break;
            }
        }

        if (!user) {
            logger.warn(`PIN login failed${restaurantId ? ` for restaurant ${restaurantId}` : ''}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid PIN'
            });
        }

        await user.populate('restaurant');

        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        logger.info(`PIN login: ${user.name} (${user.role})`);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: { user, token, refreshToken }
        });
    } catch (error) {
        logger.error(`PIN login error: ${error.message}`);
        next(error);
    }
};

// @desc    Set/Update PIN for a staff user (OWNER only)
// @route   POST /api/auth/set-pin
// @access  Private/OWNER
export const setPin = async (req, res, next) => {
    try {
        const { userId, pin } = req.body;

        if (!userId || !pin) {
            return res.status(400).json({
                success: false,
                message: 'User ID and PIN are required'
            });
        }

        if (pin.length < 4 || pin.length > 6) {
            return res.status(400).json({
                success: false,
                message: 'PIN must be 4-6 digits'
            });
        }

        if (!/^\d+$/.test(pin)) {
            return res.status(400).json({
                success: false,
                message: 'PIN must contain only digits'
            });
        }

        // Check PIN uniqueness across same restaurant
        const existing = await User.findOne({
            _id: { $ne: userId },
            restaurant: req.user.restaurant,
            pin: pin.toString()
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'This PIN is already in use by another staff member'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!['WAITER', 'CASHIER', 'CHEF'].includes(user.role)) {
            return res.status(400).json({
                success: false,
                message: 'Can only set PIN for WAITER, CASHIER, or CHEF roles'
            });
        }

        user.pin = pin.toString();
        await user.save({ validateBeforeSave: false });

        logger.info(`PIN set for ${user.name} (${user.role})`);

        res.status(200).json({
            success: true,
            message: 'PIN set successfully'
        });
    } catch (error) {
        logger.error(`Set PIN error: ${error.message}`);
        next(error);
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Get user and verify refresh token
        const user = await User.findById(decoded.id).select('+refreshToken');
        if (!user || user.refreshToken !== refreshToken) {
            logger.warn(`RefreshToken failed: Invalid token for user ID ${decoded.id}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Generate new tokens
        const newToken = generateToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        // Update refresh token
        user.refreshToken = newRefreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                token: newToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        logger.error(`RefreshToken error: ${error.message}`);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token'
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
    try {
        // Clear refresh token
        req.user.refreshToken = null;
        await req.user.save();

        logger.info(`User logged out: ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        logger.error(`Logout error: ${error.message}`);
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('restaurant');

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        logger.error(`GetMe error: ${error.message}`);
        next(error);
    }
};

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            // For security, don't reveal if user exists
            logger.info(`Password reset requested for non-existent email: ${email}`);
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, you will receive a password reset OTP'
            });
        }

        // Generate OTP
        const otp = user.generatePasswordResetOTP();
        await user.save({ validateBeforeSave: false });

        // Dev fallback: log OTP to console
        logger.info(`Password reset OTP for ${user.email}: ${otp}`);
        if (process.env.NODE_ENV === 'development') {
            console.log(`\n🔑 PASSWORD RESET OTP for ${user.email}: ${otp}\n`);
        }

        res.status(200).json({
            success: true,
            message: 'Password reset OTP sent to your email',
            data: {
                email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
            }
        });
    } catch (error) {
        logger.error(`ForgotPassword error: ${error.message}`);
        next(error);
    }
};

// @desc    Verify OTP (optional step before reset)
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        // Hash the provided OTP
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        // Find user with matching OTP and valid expiry
        const user = await User.findOne({
            email,
            passwordResetToken: hashedOTP,
            passwordResetExpires: { $gt: Date.now() }
        }).select('+passwordResetToken +passwordResetExpires');

        if (!user) {
            logger.warn(`OTP verification failed for ${email}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully. You can now reset your password.'
        });
    } catch (error) {
        logger.error(`VerifyOTP error: ${error.message}`);
        next(error);
    }
};

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Hash the provided OTP
        const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

        // Find user with matching OTP and valid expiry
        const user = await User.findOne({
            email,
            passwordResetToken: hashedOTP,
            passwordResetExpires: { $gt: Date.now() }
        }).select('+passwordResetToken +passwordResetExpires +refreshToken');

        if (!user) {
            logger.warn(`Password reset failed: Invalid OTP for ${email}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Update password
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.refreshToken = null; // Invalidate all existing sessions

        await user.save();

        logger.info(`Password successfully reset for: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Password reset successful. Please login with your new password.'
        });
    } catch (error) {
        logger.error(`ResetPassword error: ${error.message}`);
        next(error);
    }
};


