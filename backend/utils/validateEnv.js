import logger from './logger.js';

/**
 * Validate critical environment variables on server startup
 */
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'NODE_ENV'
];

const optionalEnvVars = [
    'REDIS_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'MSG91_AUTH_KEY',
    'MSG91_WHATSAPP_NUMBER',
    'MSG91_WHATSAPP_TEMPLATE_ID'
];

export const validateEnvironment = () => {
    const missing = [];
    const warnings = [];

    // Check required variables
    requiredEnvVars.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });

    // Check optional but recommended variables
    optionalEnvVars.forEach(varName => {
        if (!process.env[varName]) {
            warnings.push(varName);
        }
    });

    // Fatal errors for missing required vars
    if (missing.length > 0) {
        logger.error('❌ Missing required environment variables:', missing.join(', '));
        logger.error('Please check your .env file and ensure all required variables are set.');
        process.exit(1);
    }

    // Warnings for missing optional vars
    if (warnings.length > 0) {
        logger.warn('⚠️  Missing optional environment variables:', warnings.join(', '));
        logger.warn('Some features may not work correctly.');
    }

    // Validate NODE_ENV
    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(process.env.NODE_ENV)) {
        logger.warn(`⚠️  NODE_ENV=${process.env.NODE_ENV} is not standard. Expected: ${validEnvs.join(', ')}`);
    }

    // Warn about default JWT secrets in production
    const defaultSecrets = ['your-super-secret-key-change-this-in-production', 'dev-jwt-secret', 'dev-refresh-secret'];
    if (process.env.NODE_ENV === 'production') {
        if (defaultSecrets.some(s => process.env.JWT_SECRET?.includes(s))) {
            logger.error('❌ JWT_SECRET appears to be a development default! Change it immediately for production.');
            process.exit(1);
        }
        if (defaultSecrets.some(s => process.env.JWT_REFRESH_SECRET?.includes(s))) {
            logger.error('❌ JWT_REFRESH_SECRET appears to be a development default! Change it immediately for production.');
            process.exit(1);
        }
        if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
            logger.error('❌ JWT_SECRET must be at least 32 characters long in production.');
            process.exit(1);
        }
    }

    logger.info('✅ Environment validation passed');
};
