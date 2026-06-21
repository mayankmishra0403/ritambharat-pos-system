import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import logger from '../utils/logger.js';

// @desc    Create manual bill
// @route   POST /api/payments/manual-bill
// @access  Private (Owner/Admin)
export const createManualBill = async (req, res, next) => {
    try {
        const { restaurantId, items, subtotal, tax, total, customerName, customerPhone, paymentMethod = 'CASH' } = req.body;
        console.log('Manual Bill Request Data:', { restaurantId, itemCount: items?.length, subtotal, tax, total });

        // Validation
        if (!restaurantId || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID and items are required'
            });
        }

        // Create an order record for the manual bill
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const order = await Order.create({
            restaurant: restaurantId,
            orderNumber,
            items: items.map(item => ({
                menuItem: item.menuItem,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            subtotal: subtotal || items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            tax: tax || 0,
            total: total || subtotal,
            status: 'SERVED',
            paymentStatus: 'PAID',
            paymentMethod: paymentMethod,
            customerName: customerName || undefined,
            customerPhone: customerPhone || undefined,
            orderSource: 'MANUAL' // Mark as manual billing
        });

        // Create payment record
        const payment = await Payment.create({
            order: order._id,
            restaurant: restaurantId,
            amount: total,
            currency: 'USD',
            status: 'COMPLETED',
            paymentMethod: paymentMethod,
            gateway: 'MANUAL'
        });

        // Populate the order with full details for receipt
        const populatedOrder = await Order.findById(order._id)
            .populate('restaurant', 'name address phone email')
            .populate('items.menuItem', 'name price');

        res.status(201).json({
            success: true,
            message: 'Manual bill created successfully',
            data: populatedOrder
        });

    } catch (error) {
        logger.error('Create manual bill error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create manual bill',
            error: error.message
        });
    }
};
