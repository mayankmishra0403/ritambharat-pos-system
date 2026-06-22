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
        default: 'INR'
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
    },
    tagline: { type: String, default: '' },
    gstin: { type: String, default: '' },
    fssai: { type: String, default: '' },
    alternatePhone: { type: String, default: '' },
    website: { type: String, default: '' },
    invoiceSettings: {
        template: { type: String, enum: ['hotel-classic', 'premium-restaurant', 'modern-pos', 'minimal-receipt'], default: 'hotel-classic' },
        invoiceTitle: { type: String, default: 'TAX INVOICE' },
        showLogo: { type: Boolean, default: true },
        showGstin: { type: Boolean, default: true },
        showFssai: { type: Boolean, default: true },
        showCustomerDetails: { type: Boolean, default: true },
        showWaiterName: { type: Boolean, default: false },
        showCashierName: { type: Boolean, default: false },
        showAmountInWords: { type: Boolean, default: true },
        showGstBreakdown: { type: Boolean, default: true },
        showServiceCharge: { type: Boolean, default: false },
        showQRCode: { type: Boolean, default: false },
        showFooter: { type: Boolean, default: true },
        showPax: { type: Boolean, default: false },
        qrType: { type: String, enum: ['google-review', 'website', 'menu', 'upi'], default: 'website' },
        qrPosition: { type: String, enum: ['footer-center', 'footer-right'], default: 'footer-center' },
        qrSize: { type: String, enum: ['small', 'medium'], default: 'small' },
        qrUrl: { type: String, default: '' },
        thankYouMessage: { type: String, default: 'Thank You For Visiting' },
        visitAgainMessage: { type: String, default: 'Please Visit Again' },
        customerCareNumber: { type: String, default: '' },
        footerEmail: { type: String, default: '' },
        footerWebsite: { type: String, default: '' },
        customFooterNote: { type: String, default: '' },
        showPoweredBy: { type: Boolean, default: true },
        monospaceFont: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

// Index for faster queries
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ isActive: 1 });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;
