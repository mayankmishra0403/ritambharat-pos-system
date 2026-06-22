import webpush from 'web-push';
import logger from '../utils/logger.js';
import User from '../models/User.js';

const getVapidConfig = () => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@ritambharat.software';

    if (!publicKey || !privateKey) {
        logger.warn('VAPID keys not configured — push notifications disabled');
        return null;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    return { publicKey, privateKey, subject };
};

export const sendPushToUser = async (userId, payload) => {
    try {
        const config = getVapidConfig();
        if (!config) return;

        const user = await User.findById(userId).select('+pushSubscriptions');
        if (!user?.pushSubscriptions?.length) return;

        logger.info(`Push: sending to user ${userId} (${user.pushSubscriptions.length} subs)`);

        const results = await Promise.allSettled(
            user.pushSubscriptions.map(sub =>
                webpush.sendNotification(sub, JSON.stringify(payload))
                    .then(() => logger.info(`Push: delivered to ${sub.endpoint.slice(0, 50)}...`))
                    .catch(async (err) => {
                        logger.error(`Push: failed for ${sub.endpoint.slice(0, 50)}... — ${err.statusCode || 'no status'} ${err.message}`);
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            await User.findByIdAndUpdate(userId, {
                                $pull: { pushSubscriptions: { endpoint: sub.endpoint } }
                            });
                        }
                    })
            )
        );

        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
            logger.warn(`Push: ${failed.length}/${results.length} failed for user ${userId}`);
        }
    } catch (error) {
        logger.error(`Push send error for user ${userId}: ${error.message}`);
    }
};

export const sendPushToRestaurantStaff = async (restaurantId, payload, roleFilter) => {
    try {
        const config = getVapidConfig();
        if (!config) return;

        const filter = { restaurant: restaurantId, 'pushSubscriptions.0': { $exists: true } };
        if (roleFilter) {
            filter.role = { $in: Array.isArray(roleFilter) ? roleFilter : [roleFilter] };
        }

        const users = await User.find(filter).select('+pushSubscriptions');
        if (!users.length) {
            logger.warn(`Push: no users found for restaurant ${restaurantId}`);
            return;
        }

        const allSubs = users.flatMap(u => u.pushSubscriptions || []);
        if (!allSubs.length) {
            logger.warn(`Push: users found but no subs for restaurant ${restaurantId}`);
            return;
        }

        logger.info(`Push: sending to ${users.length} users (${allSubs.length} subs) for restaurant ${restaurantId}`);

        const results = await Promise.allSettled(
            allSubs.map(sub =>
                webpush.sendNotification(sub, JSON.stringify(payload))
                    .then(() => logger.info(`Push: delivered to ${sub.endpoint.slice(0, 50)}...`))
                    .catch(async (err) => {
                        logger.error(`Push: failed for ${sub.endpoint.slice(0, 50)}... — ${err.statusCode || 'no status'} ${err.message}`);
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            await User.updateOne(
                                { 'pushSubscriptions.endpoint': sub.endpoint },
                                { $pull: { pushSubscriptions: { endpoint: sub.endpoint } } }
                            );
                        }
                    })
            )
        );

        const rejected = results.filter(r => r.status === 'rejected');
        if (rejected.length > 0) {
            logger.warn(`Push: ${rejected.length}/${results.length} failed for restaurant ${restaurantId}`);
        }
    } catch (error) {
        logger.error(`Push send error for restaurant ${restaurantId}: ${error.message}`);
    }
};
