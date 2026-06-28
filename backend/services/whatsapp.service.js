import logger from '../utils/logger.js';
import User from '../models/User.js';
import Table from '../models/Table.js';

const MSG91_API_URL = 'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/';

const getMsg91Config = () => {
    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_WHATSAPP_NUMBER;
    if (!authKey || !integratedNumber) {
        logger.warn('MSG91 not configured — WhatsApp staff messages disabled');
        return null;
    }
    return { authKey, integratedNumber };
};

const sendViaMsg91 = async (to, text) => {
    const config = getMsg91Config();
    if (!config) return;

    try {
        const phone = to.startsWith('91') ? to : `91${to}`;
        const response = await fetch(MSG91_API_URL, {
            method: 'POST',
            headers: {
                authkey: config.authKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                integrated_number: config.integratedNumber,
                content_type: 'text',
                recipient_number: [phone],
                text
            })
        });

        const data = await response.json();
        if (!response.ok || data.status === 'failure') {
            logger.error(`WhatsApp staff send failed to ${to}: ${JSON.stringify(data)}`);
            return false;
        }
        logger.info(`WhatsApp staff delivered to ${to}`);
        return true;
    } catch (error) {
        logger.error(`WhatsApp staff send error to ${to}: ${error.message}`);
        return false;
    }
};

export const sendWhatsAppToStaff = async (restaurantId, text, roleFilter, link) => {
    try {
        const fullText = link ? `${text}\n${link}` : text;

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
            await sendViaMsg91(phone, fullText);
        }
    } catch (error) {
        logger.error(`WhatsApp staff send error for restaurant ${restaurantId}: ${error.message}`);
    }
};

export const sendWhatsAppToUser = async (userId, text, link) => {
    try {
        const user = await User.findById(userId).select('phone name');
        if (!user?.phone) {
            logger.warn(`WhatsApp: user ${userId} has no phone`);
            return;
        }

        const fullText = link ? `${text}\n${link}` : text;
        let phone = user.phone.startsWith('+') ? user.phone.slice(1) : user.phone;
        phone = phone.replace(/[^0-9]/g, '');
        if (phone.length === 10) phone = `91${phone}`;

        await sendViaMsg91(phone, fullText);
        logger.info(`WhatsApp sent to user ${user.name} (${phone})`);
    } catch (error) {
        logger.error(`WhatsApp user send error: ${error.message}`);
    }
};

export const sendWhatsAppForTable = async (tableId, text, link, options = {}) => {
    try {
        const table = await Table.findById(tableId).select('restaurant currentSession name');
        if (!table) return;

        const restaurantId = table.restaurant;

        if (table.currentSession?.waiterId) {
            await sendWhatsAppToUser(table.currentSession.waiterId, text, link);
        } else {
            await sendWhatsAppToStaff(restaurantId, text, 'WAITER', link);
        }

        const ownerText = options.ownerPrefix ? `${options.ownerPrefix}: ${text}` : text;
        await sendWhatsAppToStaff(restaurantId, ownerText, 'OWNER', link);
    } catch (error) {
        logger.error(`WhatsApp table send error: ${error.message}`);
    }
};
