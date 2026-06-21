import mongoose from 'mongoose';

const kitchenNotificationSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    type: {
        type: String,
        enum: ['NEW_ORDER', 'STATUS_UPDATE', 'URGENT'],
        default: 'NEW_ORDER'
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

kitchenNotificationSchema.index({ restaurant: 1, isRead: 1, createdAt: -1 });
kitchenNotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const KitchenNotification = mongoose.model('KitchenNotification', kitchenNotificationSchema);

export default KitchenNotification;
