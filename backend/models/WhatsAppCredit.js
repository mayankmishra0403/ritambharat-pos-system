import mongoose from 'mongoose';

const whatsAppCreditSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 10,
        min: 0
    },
    totalCredited: {
        type: Number,
        default: 0
    },
    totalUsed: {
        type: Number,
        default: 0
    },
    lowBalanceThreshold: {
        type: Number,
        default: 2.0
    }
}, { timestamps: true });

whatsAppCreditSchema.index({ restaurant: 1 }, { unique: true });

export default mongoose.model('WhatsAppCredit', whatsAppCreditSchema);
