import mongoose from 'mongoose';

const posSessionSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    openingBalance: {
        type: Number,
        required: true,
        min: 0
    },
    closingBalance: {
        type: Number,
        min: 0
    },
    expectedBalance: {
        type: Number,
        min: 0
    },
    totalSales: {
        type: Number,
        default: 0,
        min: 0
    },
    totalCash: {
        type: Number,
        default: 0,
        min: 0
    },
    totalCard: {
        type: Number,
        default: 0,
        min: 0
    },
    totalUpi: {
        type: Number,
        default: 0,
        min: 0
    },
    orderCount: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['OPEN', 'CLOSED'],
        default: 'OPEN'
    },
    openedAt: {
        type: Date,
        default: Date.now
    },
    closedAt: Date,
    notes: String
}, {
    timestamps: true
});

posSessionSchema.index({ restaurant: 1, status: 1, openedAt: -1 });

const PosSession = mongoose.model('PosSession', posSessionSchema);

export default PosSession;
