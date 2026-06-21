import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter rate limit for authentication routes
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        success: false,
        message: 'Too many login attempts, please try again later.'
    }
});

// Rate limit for order creation (prevent spam)
export const orderRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 orders per 5 minutes
    message: {
        success: false,
        message: 'Too many orders created, please wait before placing another order.'
    }
});
// Factory function for custom rate limiters
export const createRateLimiter = (maxRequests, windowMinutes) => {
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        max: maxRequests,
        message: {
            success: false,
            message: `Too many requests, please try again after ${windowMinutes} minutes.`
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};
