import safepayService from './safepay.service.js';
import logger from '../utils/logger.js';

/**
 * Payment Gateway Strategy Service
 * Routes payments to appropriate gateway based on currency, location, and preferences
 */
class PaymentGatewayService {
    /**
     * Determine which gateway to use
     */
    selectGateway(currency, preferredGateway = null) {
        return 'SAFEPAY';
    }

    async createPayment({ amount, currency, orderId, orderNumber, restaurantId, successUrl, cancelUrl, metadata = {} }) {

        logger.info(`Using SAFEPAY for payment - Amount: ${amount} ${currency}`);

        try {
            return await safepayService.createCheckout({
                amount: Math.round(amount * 100),
                currency,
                orderId,
                orderReference: orderNumber,
                successUrl,
                cancelUrl,
                metadata: {
                    restaurantId,
                    ...metadata
                }
            });
        } catch (error) {
            logger.error(`Payment creation failed with SAFEPAY: ${error.message}`);
            throw error;
        }
    }

    async verifyPayment(gateway, identifier) {
        try {
            return await safepayService.getPaymentStatus(identifier);
        } catch (error) {
            logger.error(`Payment verification failed: ${error.message}`);
            throw error;
        }
    }

    async createRefund(gateway, identifier, amount = null) {
        try {
            return await safepayService.createRefund(identifier, amount);
        } catch (error) {
            logger.error(`Refund creation failed: ${error.message}`);
            throw error;
        }
    }

    getAvailablePaymentMethods(currency) {
        return {
            gateway: 'SAFEPAY',
            methods: ['Card', 'JazzCash', 'EasyPaisa', 'Bank Transfer']
        };
    }
}

export default new PaymentGatewayService();
