import TaxSlab from '../models/TaxSlab.js';
import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import numberToWords from '../utils/numberToWords.js';

const DEFAULT_SLABS = [
    { name: 'No GST', rate: 0, cgstRate: 0, sgstRate: 0, igstRate: 0 },
    { name: '5% GST', rate: 5, cgstRate: 2.5, sgstRate: 2.5, igstRate: 5 },
    { name: '12% GST', rate: 12, cgstRate: 6, sgstRate: 6, igstRate: 12 },
    { name: '18% GST', rate: 18, cgstRate: 9, sgstRate: 9, igstRate: 18 },
    { name: '28% GST', rate: 28, cgstRate: 14, sgstRate: 14, igstRate: 28 }
];

export const getSlabs = async (req, res, next) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
        }
        const slabs = await TaxSlab.find({ restaurant: restaurantId }).sort({ rate: 1 });
        res.status(200).json({ success: true, data: slabs });
    } catch (error) {
        next(error);
    }
};

export const createSlab = async (req, res, next) => {
    try {
        const { restaurantId, name, rate, cgstRate, sgstRate, igstRate, isInterState, isDefault } = req.body;
        if (!restaurantId || !name || rate === undefined) {
            return res.status(400).json({ success: false, message: 'Restaurant, name, and rate are required' });
        }

        if (isDefault) {
            await TaxSlab.updateMany(
                { restaurant: restaurantId, isDefault: true },
                { isDefault: false }
            );
        }

        const slab = await TaxSlab.create({
            restaurant: restaurantId,
            name, rate, cgstRate, sgstRate, igstRate, isInterState, isDefault
        });

        res.status(201).json({ success: true, data: slab });
    } catch (error) {
        next(error);
    }
};

export const updateSlab = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.isDefault) {
            const slab = await TaxSlab.findById(id);
            if (slab) {
                await TaxSlab.updateMany(
                    { restaurant: slab.restaurant, isDefault: true },
                    { isDefault: false }
                );
            }
        }

        const slab = await TaxSlab.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!slab) {
            return res.status(404).json({ success: false, message: 'Tax slab not found' });
        }
        res.status(200).json({ success: true, data: slab });
    } catch (error) {
        next(error);
    }
};

export const deleteSlab = async (req, res, next) => {
    try {
        const { id } = req.params;
        const slab = await TaxSlab.findByIdAndDelete(id);
        if (!slab) {
            return res.status(404).json({ success: false, message: 'Tax slab not found' });
        }
        res.status(200).json({ success: true, message: 'Tax slab deleted' });
    } catch (error) {
        next(error);
    }
};

export const setDefaultSlab = async (req, res, next) => {
    try {
        const { id } = req.params;
        const slab = await TaxSlab.findById(id);
        if (!slab) {
            return res.status(404).json({ success: false, message: 'Tax slab not found' });
        }

        await TaxSlab.updateMany(
            { restaurant: slab.restaurant, isDefault: true },
            { isDefault: false }
        );

        slab.isDefault = true;
        await slab.save();

        res.status(200).json({ success: true, data: slab });
    } catch (error) {
        next(error);
    }
};

export const initDefaults = async (req, res, next) => {
    try {
        const { restaurantId } = req.body;
        if (!restaurantId) {
            return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
        }

        const existing = await TaxSlab.countDocuments({ restaurant: restaurantId });
        if (existing > 0) {
            return res.status(400).json({ success: false, message: 'Tax slabs already exist for this restaurant' });
        }

        const slabs = await TaxSlab.insertMany(
            DEFAULT_SLABS.map(s => ({ ...s, restaurant: restaurantId }))
        );

        await TaxSlab.findByIdAndUpdate(slabs[2]._id, { isDefault: true });

        res.status(201).json({ success: true, data: slabs });
    } catch (error) {
        next(error);
    }
};

export const generateInvoice = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const existingInvoice = await Invoice.findOne({ order: orderId });
        if (existingInvoice) {
            return res.status(200).json({ success: true, data: existingInvoice });
        }

        const order = await Order.findById(orderId)
            .populate('items.menuItem', 'name hsnCode')
            .populate('table', 'name');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const restaurant = await Restaurant.findById(order.restaurant);

        let defaultSlab = await TaxSlab.findOne({ restaurant: order.restaurant, isDefault: true });
        if (!defaultSlab) {
            defaultSlab = await TaxSlab.findOne({ restaurant: order.restaurant, rate: 0 });
        }

        const slabRate = defaultSlab?.rate || 0;
        const cgstRate = defaultSlab?.cgstRate || slabRate / 2;
        const sgstRate = defaultSlab?.sgstRate || slabRate / 2;
        const igstRate = defaultSlab?.igstRate || slabRate;

        const invoiceItems = [];
        let totalTaxAmount = 0;
        let totalCgst = 0;
        let totalSgst = 0;
        let totalIgst = 0;

        for (const item of order.items) {
            const hsnCode = item.menuItem?.hsnCode || '9985';
            const itemTotal = item.price * item.quantity;
            const taxForItem = (itemTotal * slabRate) / 100;
            const cgstForItem = (itemTotal * cgstRate) / 100;
            const sgstForItem = (itemTotal * sgstRate) / 100;
            const igstForItem = (itemTotal * igstRate) / 100;

            totalTaxAmount += taxForItem;
            totalCgst += cgstForItem;
            totalSgst += sgstForItem;
            totalIgst += igstForItem;

            invoiceItems.push({
                name: item.name,
                hsnCode,
                quantity: item.quantity,
                price: item.price,
                total: itemTotal,
                taxRate: slabRate
            });
        }

        const scAmount = order.serviceChargeAmount || 0;
        const total = order.subtotal + totalTaxAmount + scAmount - order.discountAmount;

        const invoice = await Invoice.create({
            restaurant: order.restaurant,
            order: order._id,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            subTotal: order.subtotal,
            taxAmount: totalTaxAmount,
            cgstAmount: totalCgst,
            sgstAmount: totalSgst,
            igstAmount: totalIgst,
            discountAmount: order.discountAmount || 0,
            serviceCharge: order.serviceCharge || 0,
            serviceChargeAmount: scAmount,
            total,
            amountInWords: numberToWords(total),
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            items: invoiceItems
        });

        await invoice.populate('order', 'orderNumber table');
        res.status(201).json({ success: true, data: invoice });
    } catch (error) {
        next(error);
    }
};

export const getInvoice = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const invoice = await Invoice.findOne({ order: orderId })
            .populate('order', 'orderNumber table createdAt')
            .populate('restaurant', 'name address contact gstin currency logo');

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }
        res.status(200).json({ success: true, data: invoice });
    } catch (error) {
        next(error);
    }
};
