import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Menu item name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Salad', 'Soup', 'Side Dish', 'Special']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    image: {
        type: String // URL to item image
    },
    video: {
        type: String // URL to item video
    },
    model3D: {
        glb: String, // URL to GLB file
        usdz: String // URL to USDZ file for iOS
    },
    nutritionalInfo: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number
    },
    dietaryInfo: {
        isVegetarian: {
            type: Boolean,
            default: false
        },
        isVegan: {
            type: Boolean,
            default: false
        },
        isGlutenFree: {
            type: Boolean,
            default: false
        },
        spiceLevel: {
            type: String,
            enum: ['None', 'Mild', 'Medium', 'Hot', 'Extra Hot'],
            default: 'None'
        }
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    // Stock Management
    stockQuantity: {
        type: Number,
        default: 100, // Default stock
        min: 0
    },
    lowStockThreshold: {
        type: Number,
        default: 10
    },
    isLowStock: {
        type: Boolean,
        default: false
    },
    preparationTime: {

        type: Number, // in minutes
        default: 15
    },
    tags: [String],
    hsnCode: {
        type: String,
        default: '9985' // Default HSN for restaurant services
    },
    isDeleted: {
        type: Boolean,
        default: false,
        select: false
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
menuItemSchema.index({ restaurant: 1, category: 1 });
menuItemSchema.index({ restaurant: 1, isAvailable: 1 });
menuItemSchema.index({ isDeleted: 1 });
// Compound index for optimal menu fetching (most common query)
menuItemSchema.index({ restaurant: 1, isAvailable: 1, isDeleted: 1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
