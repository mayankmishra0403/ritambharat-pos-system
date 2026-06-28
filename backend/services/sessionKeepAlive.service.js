import cron from 'node-cron';
import User from '../models/User.js';
import { sendWhatsAppToUser } from './whatsapp.service.js';
import logger from '../utils/logger.js';

const WINDOW_HOURS = 24;
const REMINDER_BEFORE_HOURS = 3;

const REMINDER_TEXT = '🔔 Your WhatsApp session will expire soon.\n\nReply with any message (e.g., "ok") to keep receiving real-time order notifications without interruption.';

const getStaffNeedingReminder = async () => {
    const reminderThreshold = new Date(Date.now() - (WINDOW_HOURS - REMINDER_BEFORE_HOURS) * 60 * 60 * 1000);

    return User.find({
        role: { $in: ['WAITER', 'OWNER', 'CHEF', 'CASHIER', 'STAFF_MANAGEMENT'] },
        phone: { $exists: true, $ne: '' },
        lastUserMessageAt: { $lt: reminderThreshold }
    }).select('name phone lastUserMessageAt restaurant');
};

const sendReminders = async () => {
    try {
        const staff = await getStaffNeedingReminder();
        if (!staff.length) return;

        logger.info(`WhatsApp keep-alive: sending reminder to ${staff.length} staff members`);

        for (const user of staff) {
            try {
                await sendWhatsAppToUser(user._id, REMINDER_TEXT);
                logger.info(`Keep-alive reminder sent to ${user.name} (${user.phone})`);
            } catch (err) {
                logger.error(`Keep-alive failed for ${user.name}: ${err.message}`);
            }
        }
    } catch (error) {
        logger.error(`Keep-alive reminder error: ${error.message}`);
    }
};

export const startKeepAliveCron = () => {
    cron.schedule('0 * * * *', () => {
        sendReminders();
    });
    logger.info('WhatsApp keep-alive cron started (hourly)');
};
