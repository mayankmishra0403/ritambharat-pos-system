import mongoose from 'mongoose';

const taxSlabSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Tax slab name is required'],
        trim: true
    },
    rate: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    cgstRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    sgstRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    igstRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    isInterState: {
        type: Boolean,
        default: false
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

taxSlabSchema.index({ restaurant: 1 });
taxSlabSchema.index({ restaurant: 1, isDefault: 1 });

const TaxSlab = mongoose.model('TaxSlab', taxSlabSchema);

export default TaxSlab;
