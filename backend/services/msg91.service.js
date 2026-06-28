import logger from '../utils/logger.js';

const MSG91_API_URL = 'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/';

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

export const sendCustomerWhatsApp = async (to, variables) => {
    const config = getConfig();
    if (!config) return false;

    const templateId = process.env.MSG91_WHATSAPP_TEMPLATE_ID;

    try {
        let payload;

        if (templateId) {
            payload = {
                integrated_number: config.integratedNumber,
                content_type: 'template',
                payload: {
                    messaging_product: 'whatsapp',
                    to: to.startsWith('91') ? to : `91${to}`,
                    type: 'template',
                    template: {
                        name: templateId,
                        language: { code: 'en' },
                        components: [
                            {
                                type: 'body',
                                parameters: [
                                    { type: 'text', text: variables.customer_name || '' },
                                    { type: 'text', text: variables.restaurant_name || '' },
                                    { type: 'text', text: variables.amount || '' },
                                    { type: 'text', text: variables.bill_url || '' }
                                ]
                            }
                        ]
                    }
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
