import mongoose from 'mongoose';

const creditTransactionSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'deduction'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    balanceBefore: {
        type: Number,
        required: true
    },
    balanceAfter: {
        type: Number,
        required: true
    },
    messageType: {
        type: String,
        enum: ['customer_bill', 'manual_adjustment', 'initial_credit'],
        default: 'customer_bill'
    },
    recipient: {
        type: String,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    description: {
        type: String,
        default: ''
    }
}, { timestamps: true });

creditTransactionSchema.index({ restaurant: 1, createdAt: -1 });
creditTransactionSchema.index({ createdAt: -1 });

export default mongoose.model('CreditTransaction', creditTransactionSchema);
