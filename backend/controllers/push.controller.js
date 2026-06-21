import User from '../models/User.js';
import logger from '../utils/logger.js';

export const subscribe = async (req, res, next) => {
    try {
        const { subscription } = req.body;
        const userId = req.user._id;

        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subscription object'
            });
        }

        const user = await User.findById(userId).select('+pushSubscriptions');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const existing = user.pushSubscriptions.find(s => s.endpoint === subscription.endpoint);
        if (existing) {
            return res.status(200).json({ success: true, message: 'Already subscribed' });
        }

        user.pushSubscriptions.push(subscription);
        await user.save();

        logger.info(`Push subscription added for user ${userId}`);

        res.status(200).json({ success: true, message: 'Subscribed' });
    } catch (error) {
        next(error);
    }
};

export const unsubscribe = async (req, res, next) => {
    try {
        const { endpoint } = req.body;
        const userId = req.user._id;

        if (!endpoint) {
            return res.status(400).json({
                success: false,
                message: 'Endpoint is required'
            });
        }

        const user = await User.findById(userId).select('+pushSubscriptions');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== endpoint);
        await user.save();

        logger.info(`Push subscription removed for user ${userId}`);

        res.status(200).json({ success: true, message: 'Unsubscribed' });
    } catch (error) {
        next(error);
    }
};

export const getVapidPublicKey = async (req, res) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
        return res.status(500).json({
            success: false,
            message: 'VAPID not configured'
        });
    }
    res.status(200).json({ success: true, data: { publicKey } });
};
