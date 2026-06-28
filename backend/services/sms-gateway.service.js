import logger from '../utils/logger.js';
import Restaurant from '../models/Restaurant.js';

export const sendCustomerSMS = async (restaurantId, to, message) => {
    try {
        const restaurant = await Restaurant.findById(restaurantId).select('smsGateway');
        if (!restaurant?.smsGateway?.enabled) {
            logger.warn(`SMS gateway not enabled for restaurant ${restaurantId}`);
            return false;
        }

        const { url, username, password } = restaurant.smsGateway;
        if (!url || !username || !password) {
            logger.warn(`SMS gateway incomplete config for restaurant ${restaurantId}`);
            return false;
        }

        const phoneNumber = to.startsWith('+') ? to : `+91${to}`;
        const auth = Buffer.from(`${username}:${password}`).toString('base64');

        const response = await fetch(`${url.replace(/\/$/, '')}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${auth}`
            },
            body: JSON.stringify({
                textMessage: { text: message },
                phoneNumbers: [phoneNumber]
            })
        });

        if (!response.ok) {
            const text = await response.text();
            logger.error(`SMS gateway send failed to ${phoneNumber}: ${response.status} ${text}`);
            return false;
        }

        logger.info(`SMS delivered to ${phoneNumber}`);
        return true;
    } catch (error) {
        logger.error(`SMS gateway error to ${to}: ${error.message}`);
        return false;
    }
};
