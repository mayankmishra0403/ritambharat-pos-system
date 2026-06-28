import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    birthday: Date,
    anniversary: Date,
    notes: String,
    tags: [String],
    totalVisits: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    loyaltyPoints: {
        type: Number,
        default: 0
    },
    lastVisit: Date,
    firstVisit: Date,
    lastOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }
}, {
    timestamps: true
});

customerSchema.index({ restaurant: 1, phone: 1 }, { unique: true });
customerSchema.index({ restaurant: 1, name: 1 });
customerSchema.index({ restaurant: 1, totalSpent: -1 });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
