import WhatsAppCredit from '../models/WhatsAppCredit.js';
import CreditTransaction from '../models/CreditTransaction.js';
import Restaurant from '../models/Restaurant.js';
import { logActivity } from '../utils/activityLogger.js';
import logger from '../utils/logger.js';

export const getAllCredits = async (req, res, next) => {
    try {
        const credits = await WhatsAppCredit.find()
            .populate('restaurant', 'name code')
            .sort({ updatedAt: -1 });

        res.status(200).json({ success: true, data: credits });
    } catch (error) {
        next(error);
    }
};

export const getCreditByRestaurant = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        let credit = await WhatsAppCredit.findOne({ restaurant: restaurantId })
            .populate('restaurant', 'name code');

        if (!credit) {
            const restaurant = await Restaurant.findById(restaurantId);
            if (!restaurant) {
                return res.status(404).json({ success: false, message: 'Restaurant not found' });
            }
            credit = await WhatsAppCredit.create({
                restaurant: restaurantId,
                balance: 10,
                totalCredited: 10
            });
            await CreditTransaction.create({
                restaurant: restaurantId,
                type: 'credit',
                amount: 10,
                balanceBefore: 0,
                balanceAfter: 10,
                messageType: 'initial_credit',
                description: 'Initial free credits'
            });
            credit = await WhatsAppCredit.findOne({ restaurant: restaurantId })
                .populate('restaurant', 'name code');
        }

        const costPerMsg = parseFloat(process.env.WHATSAPP_COST_PER_MSG) || 0.50;
        const availableMsgs = Math.floor(credit.balance / costPerMsg);

        res.status(200).json({
            success: true,
            data: {
                ...credit.toObject(),
                costPerMsg,
                availableMsgs
            }
        });
    } catch (error) {
        next(error);
    }
};

export const addCredits = async (req, res, next) => {
    try {
        const { restaurantId, amount, description } = req.body;

        if (!restaurantId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'restaurantId and positive amount are required'
            });
        }

        const roundedAmount = Math.round(amount * 100) / 100;
        let credit = await WhatsAppCredit.findOne({ restaurant: restaurantId });

        if (!credit) {
            credit = await WhatsAppCredit.create({
                restaurant: restaurantId,
                balance: roundedAmount,
                totalCredited: roundedAmount
            });
        } else {
            credit.balance = Math.round((credit.balance + roundedAmount) * 100) / 100;
            credit.totalCredited = Math.round((credit.totalCredited + roundedAmount) * 100) / 100;
            await credit.save();
        }

        await CreditTransaction.create({
            restaurant: restaurantId,
            type: 'credit',
            amount: roundedAmount,
            balanceBefore: credit.balance - roundedAmount,
            balanceAfter: credit.balance,
            messageType: 'manual_adjustment',
            createdBy: req.user._id,
            description: description || 'Manual credit added by admin'
        });

        const restaurant = await Restaurant.findById(restaurantId).select('name code');

        logActivity({
            action: 'added WhatsApp credits',
            performedBy: req.user._id,
            targetType: 'restaurant',
            targetId: restaurantId,
            targetName: restaurant?.name || restaurantId,
            details: { amount: roundedAmount, description }
        });

        logger.info(`Admin added ₹${roundedAmount} credits to restaurant ${restaurantId}`);

        res.status(200).json({
            success: true,
            message: `₹${roundedAmount} credits added successfully`,
            data: credit
        });
    } catch (error) {
        next(error);
    }
};

export const deductCredits = async (req, res, next) => {
    try {
        const { restaurantId, amount, description } = req.body;

        if (!restaurantId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'restaurantId and positive amount are required'
            });
        }

        const roundedAmount = Math.round(amount * 100) / 100;
        const credit = await WhatsAppCredit.findOne({ restaurant: restaurantId });

        if (!credit) {
            return res.status(404).json({ success: false, message: 'No credit record found for this restaurant' });
        }

        if (credit.balance < roundedAmount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Current: ₹${credit.balance}, attempted deduction: ₹${roundedAmount}`
            });
        }

        const balanceBefore = credit.balance;
        credit.balance = Math.round((credit.balance - roundedAmount) * 100) / 100;
        credit.totalUsed = Math.round((credit.totalUsed + roundedAmount) * 100) / 100;
        await credit.save();

        await CreditTransaction.create({
            restaurant: restaurantId,
            type: 'deduction',
            amount: roundedAmount,
            balanceBefore,
            balanceAfter: credit.balance,
            messageType: 'manual_adjustment',
            createdBy: req.user._id,
            description: description || 'Manual deduction by admin'
        });

        const restaurant = await Restaurant.findById(restaurantId).select('name code');

        logActivity({
            action: 'deducted WhatsApp credits',
            performedBy: req.user._id,
            targetType: 'restaurant',
            targetId: restaurantId,
            targetName: restaurant?.name || restaurantId,
            details: { amount: roundedAmount, description }
        });

        res.status(200).json({
            success: true,
            message: `₹${roundedAmount} deducted from credits`,
            data: credit
        });
    } catch (error) {
        next(error);
    }
};

export const updateThreshold = async (req, res, next) => {
    try {
        const { restaurantId, threshold } = req.body;

        if (!restaurantId || threshold === undefined || threshold < 0) {
            return res.status(400).json({ success: false, message: 'restaurantId and non-negative threshold are required' });
        }

        const credit = await WhatsAppCredit.findOneAndUpdate(
            { restaurant: restaurantId },
            { lowBalanceThreshold: threshold },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: `Low balance threshold set to ₹${threshold}`,
            data: credit
        });
    } catch (error) {
        next(error);
    }
};

export const getTransactions = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const filter = { restaurant: restaurantId };
        const [transactions, total] = await Promise.all([
            CreditTransaction.find(filter)
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            CreditTransaction.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getAllTransactions = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            CreditTransaction.find()
                .populate('restaurant', 'name code')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            CreditTransaction.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};
