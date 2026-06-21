import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger.js';

class SafepayService {
    constructor() {
        this.apiKey = process.env.SAFEPAY_API_KEY;
        this.secretKey = process.env.SAFEPAY_SECRET_KEY;
        this.environment = process.env.SAFEPAY_ENVIRONMENT || 'sandbox';
        this.baseURL = this.environment === 'production'
            ? 'https://api.getsafepay.com'
            : 'https://sandbox.api.getsafepay.com';

        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'X-SFPY-API-KEY': this.apiKey,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Create a payment checkout session
     * @param {Object} params - Payment parameters
     * @param {number} params.amount - Amount in smallest currency unit (paisas for PKR)
     * @param {string} params.currency - Currency code (PKR, USD)
     * @param {string} params.orderId - Your internal order ID
     * @param {string} params.orderReference - Order reference/number
     * @param {string} params.successUrl - Redirect URL on success
     * @param {string} params.cancelUrl - Redirect URL on cancel
     * @param {Object} params.metadata - Additional metadata
     */
    async createCheckout(params) {
        try {
            const {
                amount,
                currency = 'PKR',
                orderId,
                orderReference,
                successUrl,
                cancelUrl,
                metadata = {}
            } = params;

            const payload = {
                amount: Math.round(amount), // Ensure integer
                currency: currency.toUpperCase(),
                order_id: orderId,
                source: 'custom',
                webhooks: true,
                redirect_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    order_reference: orderReference,
                    ...metadata
                }
            };

            logger.info(`Creating Safepay checkout for order ${orderId}`);

            const response = await this.client.post('/v1/payments/checkout', payload);

            return {
                success: true,
                tracker: response.data.data.tracker,
                checkoutUrl: response.data.data.checkout_url,
                token: response.data.data.token
            };
        } catch (error) {
            logger.error(`Safepay checkout creation failed: ${error.message}`);
            throw new Error(`Safepay Error: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Verify webhook signature
     * @param {string} signature - X-SFPY-Signature header
     * @param {Object} payload - Webhook payload
     */
    verifyWebhookSignature(signature, payload) {
        const rawPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const computedSignature = crypto
            .createHmac('sha256', this.secretKey)
            .update(rawPayload)
            .digest('hex');

        return signature === computedSignature;
    }

    /**
     * Get payment status by tracker
     * @param {string} tracker - Safepay tracker ID
     */
    async getPaymentStatus(tracker) {
        try {
            const response = await this.client.get(`/v1/payments/${tracker}`);

            return {
                success: true,
                status: response.data.data.state, // 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'
                amount: response.data.data.amount,
                currency: response.data.data.currency,
                reference: response.data.data.reference,
                metadata: response.data.data.metadata
            };
        } catch (error) {
            logger.error(`Failed to get Safepay payment status: ${error.message}`);
            throw new Error(`Safepay Error: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Process webhook event
     * @param {Object} event - Webhook event data
     */
    async processWebhook(event) {
        try {
            const { tracker, state, amount, currency, metadata } = event.data;

            logger.info(`Processing Safepay webhook - Tracker: ${tracker}, State: ${state}`);

            return {
                tracker,
                status: this.mapSafepayStatus(state),
                amount,
                currency,
                metadata
            };
        } catch (error) {
            logger.error(`Safepay webhook processing failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Map Safepay status to internal payment status
     */
    mapSafepayStatus(safepayState) {
        const statusMap = {
            'PENDING': 'PENDING',
            'COMPLETED': 'COMPLETED',
            'PAID': 'COMPLETED',
            'FAILED': 'FAILED',
            'CANCELLED': 'FAILED',
            'EXPIRED': 'FAILED'
        };

        return statusMap[safepayState] || 'PENDING';
    }

    /**
     * Create refund
     * @param {string} tracker - Original payment tracker
     * @param {number} amount - Amount to refund
     */
    async createRefund(tracker, amount) {
        try {
            const payload = {
                tracker,
                amount: Math.round(amount)
            };

            logger.info(`Creating Safepay refund for tracker ${tracker}`);

            const response = await this.client.post('/v1/payments/refund', payload);

            return {
                success: true,
                refundId: response.data.data.id,
                status: response.data.data.status
            };
        } catch (error) {
            logger.error(`Safepay refund failed: ${error.message}`);
            throw new Error(`Safepay Refund Error: ${error.response?.data?.message || error.message}`);
        }
    }
}

export default new SafepayService();
