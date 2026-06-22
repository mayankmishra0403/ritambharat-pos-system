import logger from '../utils/logger.js';
import User from '../models/User.js';

const META_API_VERSION = 'v22.0';

const getConfig = () => {
    const token = process.env.META_ACCESS_TOKEN;
    const phoneId = process.env.META_PHONE_ID;

    if (!token || !phoneId) {
        logger.warn('Meta WhatsApp not configured — messages disabled');
        return null;
    }

    return { token, phoneId };
};

const sendMessage = async (to, text) => {
    const config = getConfig();
    if (!config) return;

    try {
        const url = `https://graph.facebook.com/${META_API_VERSION}/${config.phoneId}/messages`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to,
                text: { body: text }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            logger.error(`WhatsApp send failed to ${to}: ${response.status} ${errBody}`);
            return false;
        }

        logger.info(`WhatsApp delivered to ${to}`);
        return true;
    } catch (error) {
        logger.error(`WhatsApp send error to ${to}: ${error.message}`);
        return false;
    }
};

export const sendWhatsAppToStaff = async (restaurantId, text, roleFilter) => {
    try {
        const config = getConfig();
        if (!config) return;

        const filter = { restaurant: restaurantId, phone: { $exists: true, $ne: '' } };
        if (roleFilter) {
            filter.role = { $in: Array.isArray(roleFilter) ? roleFilter : [roleFilter] };
        }

        const users = await User.find(filter);
        if (!users.length) {
            logger.warn(`WhatsApp: no staff with phone found for restaurant ${restaurantId}`);
            return;
        }

        for (const user of users) {
            let phone = user.phone.startsWith('+') ? user.phone.slice(1) : user.phone;
            phone = phone.replace(/[^0-9]/g, '');
            if (phone.length === 10) phone = `91${phone}`;
            await sendMessage(phone, text);
        }
    } catch (error) {
        logger.error(`WhatsApp staff send error for restaurant ${restaurantId}: ${error.message}`);
    }
};
