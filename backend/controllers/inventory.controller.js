import InventoryItem from '../models/InventoryItem.js';

// @desc    Get inventory items
// @route   GET /api/inventory/:restaurantId
// @access  Private (Owner/Chef/Admin)
export const getInventory = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;

        // Security check
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CHEF' && req.user.restaurant?.toString() !== restaurantId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view inventory for this restaurant'
            });
        }

        const items = await InventoryItem.find({ restaurant: restaurantId, isDeleted: false })
            .sort({ isLowStock: -1, updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private (Owner/Chef/Admin)
export const createInventoryItem = async (req, res, next) => {
    try {
        const { name, sku, category, stockQuantity, lowStockThreshold, maxStock, unit, costPrice, supplier, image } = req.body;

        const item = await InventoryItem.create({
            restaurant: req.user.restaurant,
            name,
            sku,
            category,
            stockQuantity,
            lowStockThreshold,
            maxStock,
            unit,
            costPrice,
            supplier,
            image
        });

        res.status(201).json({
            success: true,
            data: item,
            message: 'Inventory item created successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update stock quantity
// @route   PATCH /api/inventory/:itemId
// @access  Private (Owner/Chef/Admin)
export const updateStock = async (req, res, next) => {
    try {
        const { quantity, reason } = req.body;
        const item = await InventoryItem.findById(req.params.itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Security
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CHEF' && req.user.restaurant?.toString() !== item.restaurant.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this item'
            });
        }

        if (reason === 'restock' || (quantity > item.stockQuantity && !reason)) {
            item.lastRestockDate = new Date();
        }

        item.stockQuantity = quantity;
        await item.save();

        res.status(200).json({
            success: true,
            data: item,
            message: 'Stock updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update inventory item details
// @route   PUT /api/inventory/:itemId
// @access  Private (Owner/Chef/Admin)
export const updateInventoryItem = async (req, res, next) => {
    try {
        const item = await InventoryItem.findById(req.params.itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Security
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CHEF' && req.user.restaurant?.toString() !== item.restaurant.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this item'
            });
        }

        const allowedFields = (({ name, sku, category, stockQuantity, unit, unitPrice, costPrice, lowStockThreshold, supplier, description, image }) => ({ name, sku, category, stockQuantity, unit, unitPrice, costPrice, lowStockThreshold, supplier, description, image }))(req.body);
        Object.assign(item, allowedFields);

        await item.save();

        res.status(200).json({
            success: true,
            data: item,
            message: 'Item updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete inventory item (soft delete)
// @route   DELETE /api/inventory/:itemId
// @access  Private (Owner/Chef/Admin)
export const deleteInventoryItem = async (req, res, next) => {
    try {
        const item = await InventoryItem.findById(req.params.itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Security
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CHEF' && req.user.restaurant?.toString() !== item.restaurant.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this item'
            });
        }

        item.isDeleted = true;
        await item.save();

        res.status(200).json({
            success: true,
            message: 'Item removed from inventory'
        });
    } catch (error) {
        next(error);
    }
};
