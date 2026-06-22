import logger from '../utils/logger.js';

class PaymentGatewayService {
    getAvailablePaymentMethods(currency) {
        return {
            gateway: 'MANUAL',
            methods: ['CASH', 'CARD', 'UPI', 'ONLINE']
        };
    }
}

export default new PaymentGatewayService();
