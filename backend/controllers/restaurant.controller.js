import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import cache from '../utils/cache.js';

// @desc    Create restaurant
// @route   POST /api/restaurant
// @access  Private (Owner)
export const createRestaurant = async (req, res, next) => {
    try {
        const restaurantData = {
            ...req.body,
            owner: req.user.id
        };

        const restaurant = await Restaurant.create(restaurantData);

        // Update user's restaurant reference
        await User.findByIdAndUpdate(req.user.id, { restaurant: restaurant._id });

        res.status(201).json({
            success: true,
            message: 'Restaurant created successfully',
            data: restaurant
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get restaurant by ID
// @route   GET /api/restaurant/:id
// @access  Public
export const getRestaurant = async (req, res, next) => {
    try {
        // Try cache first (1 hour TTL for restaurant data)
        const cacheKey = cache.keys.restaurant(req.params.id);
        const cached = await cache.get(cacheKey);

        if (cached) {
            return res.status(200).json({
                success: true,
                data: cached,
                cached: true
            });
        }

        const restaurant = await Restaurant.findById(req.params.id)
            .populate('owner', 'name email');

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Cache for 1 hour
        await cache.set(cacheKey, restaurant, 3600);

        res.status(200).json({
            success: true,
            data: restaurant
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update restaurant
// @route   PATCH /api/restaurant/:id
// @access  Private (Owner)
export const updateRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Update fields
        Object.assign(restaurant, req.body);
        await restaurant.save();

        // Invalidate restaurant cache
        await cache.del(cache.keys.restaurant(req.params.id));

        res.status(200).json({
            success: true,
            message: 'Restaurant updated successfully',
            data: restaurant
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update restaurant settings
// @route   PATCH /api/restaurant/:id/settings
// @access  Private (Owner)
export const updateRestaurantSettings = async (req, res, next) => {
    try {
        const { features, theme } = req.body;

        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        if (features) {
            restaurant.features = { ...restaurant.features, ...features };
        }

        if (theme) {
            restaurant.theme = { ...restaurant.theme, ...theme };
        }

        await restaurant.save();

        res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            data: restaurant
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's primary/first restaurant
// @route   GET /api/restaurant/my-primary
// @access  Private (Owner)
export const getMyPrimaryRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user.id }).sort({ createdAt: 1 });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'No restaurant found. Please complete onboarding.',
                data: null
            });
        }

        res.status(200).json({
            success: true,
            data: restaurant
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all restaurants (for owner)
// @route   GET /api/restaurant
// @access  Private (Owner)
export const getMyRestaurants = async (req, res, next) => {
    try {
        const restaurants = await Restaurant.find({ owner: req.user.id });

        res.status(200).json({
            success: true,
            count: restaurants.length,
            data: restaurants
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurant/:id
// @access  Private (Owner/Admin)
export const deleteRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // For a permanent delete as requested by the user:
        await Restaurant.findByIdAndDelete(req.params.id);

        // Remove restaurant reference from user
        await User.findByIdAndUpdate(restaurant.owner, { $unset: { restaurant: "" } });

        res.status(200).json({
            success: true,
            message: 'Restaurant permanently deleted'
        });
    } catch (error) {
        next(error);
    }
};
