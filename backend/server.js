import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import { connectRedis } from './config/redis.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import logger from './utils/logger.js';
import { validateEnvironment } from './utils/validateEnv.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import routes
import authRoutes from './routes/auth.routes.js';
import restaurantRoutes from './routes/restaurant.routes.js';
import tableRoutes from './routes/table.routes.js';
import menuRoutes from './routes/menu.routes.js';
import orderRoutes from './routes/order.routes.js';

import paymentRoutes from './routes/payment.routes.js';
import reviewRoutes from './routes/review.routes.js';
import serviceRoutes from './routes/service.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import staffRoutes from './routes/staff.routes.js';
import kdsRoutes from './routes/kds.routes.js';
import waiterRoutes from './routes/waiter.routes.js';
import posRoutes from './routes/pos.routes.js';
import gstRoutes from './routes/gst.routes.js';
import customerRoutes from './routes/customer.routes.js';
import takeawayRoutes from './routes/takeaway.routes.js';
import roomRoutes from './routes/room.routes.js';
import syncRoutes from './routes/sync.routes.js';
import pushRoutes from './routes/push.routes.js';

// Load environment variables
logger.info('Starting server...');
dotenv.config();
logger.info('Environment variables loaded');

// Validate environment variables
validateEnvironment();

logger.info('Env loaded, Connecting to DB...');

// Connect to database
connectDB();
connectRedis();
logger.info('Initialization sequence triggered...');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            const allowedOrigins = process.env.ALLOWED_ORIGINS
                ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
                : [];
            if (!origin) return callback(null, true);

            if (process.env.NODE_ENV === 'development' || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
                callback(null, true);
            } else {
                logger.warn(`CORS Blocked (WS): Origin ${origin} not allowed. Allowed: ${allowedOrigins.join(', ')}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            connectSrc: ["'self'", 'https:', 'wss:'],
            fontSrc: ["'self'", 'https:', 'data:'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    } : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
            : [];

        // Allow server-to-server requests (no origin) in all environments
        if (!origin) {
            return callback(null, true);
        }

        if (process.env.NODE_ENV === 'development' || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            logger.warn(`CORS Blocked (HTTP): Origin ${origin} not allowed.`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Now add JSON parsing for all other routes
// verify callback captures raw body for webhook signature verification
app.use(express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
        req.rawBody = buf.toString()
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.set('trust proxy', 1);
app.use('/api/', rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/kds', kdsRoutes);
app.use('/api/waiter', waiterRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/gst', gstRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/takeaway', takeawayRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/push', pushRoutes);
const uploadsDir = path.join(__dirname, 'uploads');

// Serve uploaded images through API pipeline (bypasses Cloudflare static cache, applies CORS/security headers)
app.get('/api/images/:filename', (req, res) => {
    const filePath = path.join(uploadsDir, path.basename(req.params.filename));
    if (fs.existsSync(filePath)) {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.set('Access-Control-Allow-Origin', '*');
        res.sendFile(filePath);
    } else {
        res.status(404).json({ success: false, message: 'Image not found' });
    }
});

// Static fallback for direct /uploads access
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('join:restaurant', (restaurantId) => {
        socket.join(`restaurant:${restaurantId}`);
        logger.info(`Socket ${socket.id} joined restaurant:${restaurantId}`);
    });

    socket.on('join:order', (orderId) => {
        socket.join(`order:${orderId}`);
        logger.info(`Socket ${socket.id} joined order:${orderId}`);
    });

    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    logger.info(`📡 WebSocket server ready`);
});

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    httpServer.close(() => process.exit(1));
});

export { io };
