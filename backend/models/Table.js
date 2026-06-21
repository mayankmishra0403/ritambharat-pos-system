import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Table name is required'],
        trim: true
    },
    capacity: {
        type: Number,
        min: 1,
        default: 4
    },
    qrSecret: {
        type: String
    },
    qrCode: {
        type: String
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    },
    shape: {
        type: String,
        enum: ['round', 'rect', 'square', 'oval'],
        default: 'square'
    },
    posX: {
        type: Number,
        default: 0
    },
    posY: {
        type: Number,
        default: 0
    },
    location: {
        type: String,
        enum: ['Indoor', 'Outdoor', 'VIP', 'Patio', 'Bar'],
        default: 'Indoor'
    },
    status: {
        type: String,
        enum: ['FREE', 'OCCUPIED', 'RESERVED', 'CLEANING'],
        default: 'FREE'
    },
    currentSession: {
        sessionId: String, // Unique ID for current occupation session
        securityToken: String, // Secret token for placing orders (Prevents remote abuse)
        startTime: Date,
        occupiedAt: Date, // Track when table became occupied
        customerCount: Number,
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        waiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for restaurant and table name uniqueness
tableSchema.index({ restaurant: 1, name: 1 }, { unique: true });
// Index for filtering active tables
tableSchema.index({ restaurant: 1, isActive: 1 });

// Generate QR secret and QR code data before saving
tableSchema.pre('save', function (next) {
    if (!this.qrSecret) {
        this.qrSecret = Math.random().toString(36).substring(2, 10).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    // Always regenerate qrCode to include the qrSecret
    this.qrCode = `/menu/${this.restaurant}?table=${this._id}&token=${this.qrSecret}`;
    next();
});

const Table = mongoose.model('Table', tableSchema);

export default Table;
