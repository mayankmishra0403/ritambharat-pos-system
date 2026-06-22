import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema({
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
    type: {
        type: String,
        enum: ['CALL_WAITER', 'REQUEST_BILL', 'CLEANING', 'WATER', 'CUTLERY', 'OTHER'],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING'
    },
    comment: {
        type: String,
        trim: true
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'MEDIUM'
    },
    notifiedAt: Date,
    handledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
serviceRequestSchema.index({ restaurant: 1, status: 1 });
serviceRequestSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400, partialFilterExpression: { status: { $in: ['COMPLETED', 'CANCELLED'] } } }); // Auto-expire completed/cancelled after 24h

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

export default ServiceRequest;
