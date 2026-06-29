import logger from '../utils/logger.js';
import WhatsAppCredit from '../models/WhatsAppCredit.js';
import CreditTransaction from '../models/CreditTransaction.js';

const MSG91_API_URL = 'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/';

const getCostPerMsg = () => {
    return parseFloat(process.env.WHATSAPP_COST_PER_MSG) || 0.50;
};

const getConfig = () => {
    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey) {
        logger.warn('MSG91 not configured — customer WhatsApp disabled');
        return null;
    }
    const integratedNumber = process.env.MSG91_WHATSAPP_NUMBER;
    if (!integratedNumber) {
        logger.warn('MSG91 WhatsApp number not configured');
        return null;
    }
    return { authKey, integratedNumber };
};

const checkAndDeductCredit = async (restaurantId, recipient) => {
    try {
        const costPerMsg = getCostPerMsg();
        const credit = await WhatsAppCredit.findOne({ restaurant: restaurantId });

        if (!credit) {
            logger.warn(`WhatsApp credit not found for restaurant ${restaurantId} — blocking send`);
            return { success: false, reason: 'no_credit_record', balance: 0, cost: costPerMsg };
        }

        if (credit.balance < costPerMsg) {
            logger.warn(`WhatsApp credit insufficient for restaurant ${restaurantId}: balance=₹${credit.balance}, cost=₹${costPerMsg}`);
            return { success: false, reason: 'insufficient_credits', balance: credit.balance, cost: costPerMsg };
        }

        const balanceBefore = credit.balance;
        credit.balance = Math.round((credit.balance - costPerMsg) * 100) / 100;
        credit.totalUsed = Math.round((credit.totalUsed + costPerMsg) * 100) / 100;
        await credit.save();

        await CreditTransaction.create({
            restaurant: restaurantId,
            type: 'deduction',
            amount: costPerMsg,
            balanceBefore,
            balanceAfter: credit.balance,
            messageType: 'customer_bill',
            recipient,
            description: 'Customer bill WhatsApp'
        });

        return { success: true, balanceAfter: credit.balance };
    } catch (error) {
        logger.error(`Credit check/deduct error for restaurant ${restaurantId}: ${error.message}`);
        return { success: false, reason: 'error', error: error.message };
    }
};

export const sendCustomerWhatsApp = async (to, variables, restaurantId) => {
    const config = getConfig();
    if (!config) return false;

    if (!restaurantId) {
        logger.warn('sendCustomerWhatsApp called without restaurantId — skipping credit check');
    } else {
        const creditResult = await checkAndDeductCredit(restaurantId, to);
        if (!creditResult.success) {
            logger.warn(`Customer WhatsApp blocked: ${creditResult.reason} for restaurant ${restaurantId}`);
            return false;
        }
    }

    const templateId = process.env.MSG91_WHATSAPP_TEMPLATE_ID;

    try {
        let payload;

        if (templateId) {
            payload = {
                integrated_number: config.integratedNumber,
                content_type: 'template',
                payload: {
                    type: 'template',
                    to: to.startsWith('91') ? to : `91${to}`,
                    template: {
                        name: templateId,
                        language: { code: 'en', policy: 'deterministic' },
                        components: [
                            {
                                type: 'body',
                                parameters: [
                                    { type: 'text', parameter_name: 'var_1', text: variables.customer_name || 'Guest' },
                                    { type: 'text', parameter_name: 'var_2', text: variables.restaurant_name || 'our restaurant' },
                                    { type: 'text', parameter_name: 'var_3', text: variables.amount || '₹0' },
                                    { type: 'text', parameter_name: 'var_4', text: variables.bill_url || '' }
                                ]
                            }
                        ]
                    },
                    messaging_product: 'whatsapp'
                }
            };
        } else {
            const message = variables.message || `Hi ${variables.customer_name || ''}, thank you for dining at ${variables.restaurant_name || ''}! Your bill of ${variables.amount || ''} has been paid. View your bill: ${variables.bill_url || ''}`;

            payload = {
                integrated_number: config.integratedNumber,
                content_type: 'text',
                recipient_number: [to],
                text: message
            };
        }

        const response = await fetch(MSG91_API_URL, {
            method: 'POST',
            headers: {
                authkey: config.authKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || data.type === 'failure' || data.status === 'failure') {
            logger.error(`MSG91 WhatsApp failed to ${to}: ${JSON.stringify(data)}`);
            return false;
        }

        logger.info(`MSG91 WhatsApp delivered to ${to}: ${JSON.stringify(data)}`);
        return true;
    } catch (error) {
        logger.error(`MSG91 WhatsApp error to ${to}: ${error.message}`);
        return false;
    }
};
