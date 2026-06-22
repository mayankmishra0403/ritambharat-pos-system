import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    pin: {
        type: String,
        select: false
    },
    password: {
        type: String,
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['OWNER', 'CHEF', 'ADMIN', 'CUSTOMER', 'WAITER', 'CASHIER'],
        default: 'CUSTOMER'
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
    },
    refreshToken: {
        type: String,
        select: false
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        select: false
    },
    verificationExpires: {
        type: Date,
        select: false
    },
    phone: {
        type: String,
        trim: true,
        sparse: true,
        match: [/^\+?[0-9]{10,15}$/, 'Please provide a valid phone number (10-15 digits, optional +)']
    },
    profileImage: {
        type: String // URL to image
    },
    permissions: {
        type: [String],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    },
    pushSubscriptions: {
        type: [{
            endpoint: { type: String, required: true },
            keys: {
                p256dh: { type: String, required: true },
                auth: { type: String, required: true }
            }
        }],
        select: false,
        default: []
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    if (this.isModified('pin') && this.pin) {
        const salt = await bcrypt.genSalt(10);
        this.pin = await bcrypt.hash(this.pin, salt);
    }
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to compare pin
userSchema.methods.comparePin = async function (candidatePin) {
    if (!this.pin) return false;
    return await bcrypt.compare(candidatePin, this.pin);
};

// Generate password reset OTP
userSchema.methods.generatePasswordResetOTP = function () {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP before storing
    this.passwordResetToken = crypto.createHash('sha256').update(otp).digest('hex');

    // Set expiry to 10 minutes
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return otp; // Return plain OTP for sending via email
};

// Generate email verification token
userSchema.methods.generateVerificationToken = function () {
    // Generate random token
    const token = crypto.randomBytes(32).toString('hex');

    // Hash token before storing
    this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');

    // Set expiry to 24 hours
    this.verificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    return token; // Return plain token for sending via email
};

// Generate email verification OTP
userSchema.methods.generateEmailVerificationOTP = function () {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP before storing
    this.verificationToken = crypto.createHash('sha256').update(otp).digest('hex');

    // Set expiry to 15 minutes
    this.verificationExpires = Date.now() + 15 * 60 * 1000;

    return otp; // Return plain OTP for sending via email
};

// Remove sensitive data from JSON response
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.pin;
    delete user.refreshToken;
    delete user.pushSubscriptions;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    delete user.verificationToken;
    delete user.verificationExpires;
    return user;
};

const User = mongoose.model('User', userSchema);

export default User;
