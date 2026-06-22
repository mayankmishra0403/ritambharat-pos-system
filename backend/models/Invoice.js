import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true
    },
    invoiceNo: {
        type: String,
        required: true,
        unique: true
    },
    customerName: String,
    customerPhone: String,
    subTotal: {
        type: Number,
        required: true,
        min: 0
    },
    taxAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    cgstAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    sgstAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    igstAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    serviceCharge: {
        type: Number,
        default: 0,
        min: 0
    },
    serviceChargeAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    amountInWords: String,
    paymentStatus: {
        type: String,
        enum: ['PAID', 'UNPAID', 'REFUNDED'],
        default: 'PAID'
    },
    paymentMethod: String,
    items: [{
        name: String,
        hsnCode: String,
        quantity: Number,
        price: Number,
        total: Number,
        taxRate: Number
    }],
    generatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

invoiceSchema.index({ restaurant: 1, createdAt: -1 });
invoiceSchema.index({ invoiceNo: 1 });

// Auto-generate invoice number (atomic to prevent duplicates)
invoiceSchema.pre('save', async function (next) {
    if (!this.invoiceNo) {
        const date = new Date();
        const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const prefix = `INV-${yearMonth}`;
        // Atomic counter to prevent race conditions on concurrent requests
        const result = await mongoose.model('Invoice').findOneAndUpdate(
            { invoiceNo: { $regex: `^${prefix}` } },
            { $inc: { __counter: 1 } },
            { sort: { __counter: -1 }, new: true }
        );
        const count = result ? result.__counter + 1 : 1;
        this.invoiceNo = `${prefix}-${count.toString().padStart(4, '0')}`;
    }
    next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
