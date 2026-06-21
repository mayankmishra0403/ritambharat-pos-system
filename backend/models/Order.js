import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
    name: String, // Snapshot of item name
    price: Number, // Snapshot of price at time of order
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    specialInstructions: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    table: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table'
    },
    orderNumber: {
        type: String,
        unique: true
    },
    sessionId: String, // Groups orders belonging to same table session
    items: [orderItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'],
        default: 'PENDING'
    },
    paymentStatus: {
        type: String,
        enum: ['UNPAID', 'PAID', 'REFUNDED'],
        default: 'UNPAID'
    },
    paymentMethod: {
        type: String,
        enum: ['CASH', 'CARD', 'UPI', 'ONLINE'],
        default: 'CASH'
    },
    orderSource: {
        type: String,
        enum: ['MANUAL', 'VOICE', 'WHATSAPP', 'QR'],
        default: 'MANUAL'
    },
    customerName: String,
    customerPhone: String,
    specialInstructions: String,
    tipAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    promoCode: String,
    orderType: {
        type: String,
        enum: ['DINE_IN', 'TAKEAWAY', 'DELIVERY'],
        default: 'DINE_IN'
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
    discountType: {
        type: String,
        enum: ['PERCENTAGE', 'FIXED'],
        default: 'FIXED'
    },
    gstBreakdown: {
        cgst: { type: Number, default: 0 },
        sgst: { type: Number, default: 0 },
        igst: { type: Number, default: 0 },
        taxSlab: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxSlab' }
    },
    statusHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    acceptedAt: Date,
    preparingAt: Date,
    readyAt: Date,
    servedAt: Date,
    cancelledAt: Date,
    cancellationReason: String
}, {
    timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.orderNumber = `ORD-${Date.now()}-${rand}`;
    }
    next();
});

// Update status timestamps
orderSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        const now = new Date();
        switch (this.status) {
            case 'ACCEPTED':
                this.acceptedAt = now;
                break;
            case 'PREPARING':
                this.preparingAt = now;
                break;
            case 'READY':
                this.readyAt = now;
                break;
            case 'SERVED':
                this.servedAt = now;
                break;
            case 'CANCELLED':
                this.cancelledAt = now;
                break;
        }

        // Add to status history
        this.statusHistory.push({
            status: this.status,
            timestamp: now
        });
    }
    next();
});

// Indexes for efficient queries
orderSchema.index({ restaurant: 1, status: 1, createdAt: -1 }); // Highly efficient for Analytics status filtering
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ table: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
