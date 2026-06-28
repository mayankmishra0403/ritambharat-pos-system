import MenuItem from '../models/MenuItem.js';
import InventoryItem from '../models/InventoryItem.js';
import cache from '../utils/cache.js';

// @desc    Create menu item
// @route   POST /api/menu
// @access  Private (Owner)
// @desc    Create menu item
// @route   POST /api/menu
// @access  Private (Owner)
export const createMenuItem = async (req, res, next) => {
    try {
        const { restaurant } = req.body;

        // Security check
        if (req.user.role !== 'ADMIN' && req.user.restaurant?.toString() !== restaurant) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to add items to this restaurant'
            });
        }

        const menuItem = await MenuItem.create(req.body);

        // Invalidate menu cache for this restaurant
        await cache.invalidatePattern(`menu:${restaurant}*`);

        res.status(201).json({
            success: true,
            message: 'Menu item created successfully',
            data: menuItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get menu items
// @route   GET /api/menu?restaurant=:restaurantId&category=:category
// @route   GET /api/menu/restaurant/:id
// @access  Public
export const getMenuItems = async (req, res, next) => {
    try {
        // Support both query param and route param for restaurant ID
        const restaurant = req.params.id || req.query.restaurant;
        const { category, available } = req.query;

        if (!restaurant) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        // Try cache first (15 minute TTL for menu data)
        const cacheKey = cache.keys.menu(restaurant);
        const cached = await cache.get(cacheKey);

        if (cached) {
            return res.status(200).json({
                success: true,
                count: cached.length,
                data: cached,
                cached: true
            });
        }

        const query = { restaurant, isDeleted: false };

        if (category) {
            query.category = category;
        }

        if (available === 'true') {
            query.isAvailable = true;
        }

        const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });

        // Cache for 15 minutes
        await cache.set(cacheKey, menuItems, 900);

        res.status(200).json({
            success: true,
            count: menuItems.length,
            data: menuItems
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
export const getMenuItem = async (req, res, next) => {
    try {
        const menuItem = await MenuItem.findOne({ _id: req.params.id, isDeleted: false });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        res.status(200).json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update menu item
// @route   PATCH /api/menu/:id
// @access  Private (Owner)
export const updateMenuItem = async (req, res, next) => {
    try {
        const menuItem = await MenuItem.findOne({ _id: req.params.id, isDeleted: false });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        // Security check
        if (req.user.role !== 'ADMIN' && req.user.restaurant?.toString() !== menuItem.restaurant.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this item'
            });
        }

        Object.assign(menuItem, req.body);
        await menuItem.save();

        // Invalidate menu cache
        await cache.invalidatePattern(`menu:${menuItem.restaurant}*`);

        res.status(200).json({
            success: true,
            message: 'Menu item updated successfully',
            data: menuItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle menu item availability
// @route   PATCH /api/menu/:id/availability
// @access  Private (Owner/Chef)
export const toggleAvailability = async (req, res, next) => {
    try {
        const menuItem = await MenuItem.findOne({ _id: req.params.id, isDeleted: false });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        // Security check
        if (req.user.role !== 'ADMIN' && req.user.restaurant?.toString() !== menuItem.restaurant.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this item'
            });
        }

        menuItem.isAvailable = !menuItem.isAvailable;
        await menuItem.save();

        // Invalidate menu cache
        await cache.invalidatePattern(`menu:${menuItem.restaurant}*`);

        res.status(200).json({
            success: true,
            message: `Menu item ${menuItem.isAvailable ? 'enabled' : 'disabled'}`,
            data: menuItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete menu item (soft delete)
// @route   DELETE /api/menu/:id
// @access  Private (Owner)
export const deleteMenuItem = async (req, res, next) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        // Security check
        if (req.user.role !== 'ADMIN' && req.user.restaurant?.toString() !== menuItem.restaurant.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this item'
            });
        }

        menuItem.isDeleted = true;
        await menuItem.save();

        // Invalidate menu cache
        await cache.invalidatePattern(`menu:${menuItem.restaurant}*`);

        res.status(200).json({
            success: true,
            message: 'Menu item deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update menu item ingredients (recipe)
// @route   PUT /api/menu/:id/ingredients
// @access  Private (Owner)
export const updateIngredients = async (req, res, next) => {
    try {
        const menuItem = await MenuItem.findOne({ _id: req.params.id, isDeleted: false });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        if (req.user.role !== 'ADMIN' && req.user.restaurant?.toString() !== menuItem.restaurant.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this item'
            });
        }

        const { ingredients } = req.body;

        menuItem.ingredients = ingredients || [];

        // Compute cost from inventory items
        let totalCost = 0;
        if (menuItem.ingredients.length > 0) {
            const inventoryItems = await InventoryItem.find({
                _id: { $in: menuItem.ingredients.map(i => i.inventoryItem) },
                restaurant: menuItem.restaurant
            });

            const costMap = {};
            inventoryItems.forEach(item => {
                costMap[item._id.toString()] = item.costPrice || 0;
            });

            totalCost = menuItem.ingredients.reduce((sum, ing) => {
                const costPerUnit = costMap[ing.inventoryItem.toString()] || 0;
                return sum + (costPerUnit * ing.quantity);
            }, 0);
        }

        menuItem.costPrice = totalCost;
        menuItem.profitMargin = menuItem.price - totalCost;
        menuItem.profitPercentage = menuItem.price > 0 ? ((menuItem.price - totalCost) / menuItem.price) * 100 : 0;

        await menuItem.save();

        // Invalidate cache
        await cache.invalidatePattern(`menu:${menuItem.restaurant}*`);

        res.status(200).json({
            success: true,
            message: 'Recipe updated successfully',
            data: menuItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get menu item costing breakdown
// @route   GET /api/menu/:id/costing
// @access  Private (Owner)
export const getCosting = async (req, res, next) => {
    try {
        const menuItem = await MenuItem.findOne({ _id: req.params.id, isDeleted: false })
            .populate({
                path: 'ingredients.inventoryItem',
                select: 'name unit costPrice category'
            });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        const ingredientDetails = (menuItem.ingredients || []).map(ing => ({
            inventoryItem: ing.inventoryItem?._id,
            name: ing.inventoryItem?.name || 'Unknown',
            category: ing.inventoryItem?.category,
            quantity: ing.quantity,
            unit: ing.unit,
            costPerUnit: ing.inventoryItem?.costPrice || 0,
            lineCost: (ing.inventoryItem?.costPrice || 0) * ing.quantity
        }));

        res.status(200).json({
            success: true,
            data: {
                _id: menuItem._id,
                name: menuItem.name,
                price: menuItem.price,
                ingredients: ingredientDetails,
                totalCost: menuItem.costPrice,
                profitMargin: menuItem.profitMargin,
                profitPercentage: menuItem.profitPercentage
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get menu categories
// @route   GET /api/menu/categories/:restaurantId
// @access  Public
export const getCategories = async (req, res, next) => {
    try {
        const categories = await MenuItem.distinct('category', {
            restaurant: req.params.restaurantId,
            isDeleted: false
        });

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};
