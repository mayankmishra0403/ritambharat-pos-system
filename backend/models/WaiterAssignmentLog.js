import mongoose from 'mongoose';

const waiterAssignmentLogSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    table: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    waiter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    oldWaiter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        enum: ['ASSIGN', 'RELEASE', 'TRANSFER', 'REASSIGN'],
        required: true
    },
    mode: {
        type: String,
        enum: ['FIXED_SECTIONS', 'AUTO_ASSIGN', 'ROUND_ROBIN', 'MANUAL', 'TRANSFER', 'RELEASE']
    },
    reason: String,
    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

waiterAssignmentLogSchema.index({ restaurant: 1, createdAt: -1 });
waiterAssignmentLogSchema.index({ waiter: 1, createdAt: -1 });
waiterAssignmentLogSchema.index({ table: 1 });

const WaiterAssignmentLog = mongoose.model('WaiterAssignmentLog', waiterAssignmentLogSchema);

export default WaiterAssignmentLog;
