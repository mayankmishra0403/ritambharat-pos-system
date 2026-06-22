import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    paymentMethod: {
        type: String,
        enum: ['CASH', 'CARD', 'UPI', 'ONLINE'],
        required: true
    },
    paymentType: {
        type: String,
        enum: ['ORDER'],
        default: 'ORDER'
    },
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },
    transactionId: String,
    receiptUrl: String,
    metadata: {
        type: Map,
        of: String
    },
    refund: {
        amount: Number,
        reason: String,
        refundedAt: Date,
        refundId: String
    },
    failureReason: String
}, {
    timestamps: true
});

paymentSchema.index({ order: 1 });
paymentSchema.index({ restaurant: 1, status: 1 });
paymentSchema.index({ transactionId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
