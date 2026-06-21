import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Restaurant name is required'],
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    cuisine: {
        type: String,
        trim: true
    },
    logo: {
        type: String // URL to logo image
    },
    coverImage: {
        type: String // URL to cover image
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    contact: {
        phone: String,
        email: String
    },
    socialMedia: {
        instagram: String,
        facebook: String,
        twitter: String
    },
    businessHours: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        },
        openTime: String, // Format: "09:00"
        closeTime: String, // Format: "22:00"
        isClosed: {
            type: Boolean,
            default: false
        }
    }],
    features: {
        orderingEnabled: {
            type: Boolean,
            default: true
        },
        voiceOrderingEnabled: {
            type: Boolean,
            default: false
        },
        tableQREnabled: {
            type: Boolean,
            default: true
        },
        reviewsEnabled: {
            type: Boolean,
            default: true
        },
        autoConfirmOrders: {
            type: Boolean,
            default: false
        },
        allowStaffReviews: {
            type: Boolean,
            default: false
        },
        inventoryAlerts: {
            type: Boolean,
            default: true
        }
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    theme: {
        primaryColor: {
            type: String,
            default: '#FF6B6B'
        },
        secondaryColor: {
            type: String,
            default: '#4ECDC4'
        },
        fontFamily: {
            type: String,
            default: 'Inter'
        }
    },
    currency: {
        type: String,
        default: 'USD'
    },
    taxRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    isActive: {
        type: Boolean,
        default: true
    },
    paymentGateway: {
        type: String,
        enum: ['CASH', 'CARD', 'UPI', 'ONLINE'],
        default: 'CASH'
    }
}, {
    timestamps: true
});

// Index for faster queries
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ isActive: 1 });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;
