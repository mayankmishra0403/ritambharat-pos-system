import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Payment from '../models/Payment.js';
import Table from '../models/Table.js';
import Complaint from '../models/Complaint.js';
import mongoose from 'mongoose';
import cache from '../utils/cache.js';

// ... (other exports remain unchanged)

// @desc    Get dashboard summary
// @route   GET /api/analytics/dashboard/:restaurantId
// @access  Private (Owner)
export const getDashboardSummary = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ success: false, message: 'Invalid restaurant ID' });
        }

        // Try cache first (5 minute TTL for analytics - balances freshness with performance)
        const cacheKey = cache.keys.analytics(restaurantId, 'dashboard');
        const cached = await cache.get(cacheKey);

        if (cached) {
            return res.status(200).json({
                success: true,
                data: cached,
                cached: true
            });
        }

        const restaurantObjectId = new mongoose.Types.ObjectId(restaurantId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Active Guests Calculation
        const occupiedTables = await Table.find({ restaurant: restaurantId, status: 'OCCUPIED' });
        const activeGuests = occupiedTables.reduce((acc, table) => acc + (table.capacity || 2), 0); // specific capacity or default to 2

        // Avg Prep Time Calculation (Last 24 hours orders that reached READY state)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const completedOrders = await Order.find({
            restaurant: restaurantId,
            status: { $in: ['READY', 'SERVED', 'COMPLETED'] },
            readyAt: { $exists: true },
            createdAt: { $gte: yesterday }
        }).select('createdAt acceptedAt readyAt');

        let totalPrepTimeMinutes = 0;
        let validOrdersCount = 0;

        completedOrders.forEach(order => {
            const start = order.acceptedAt || order.createdAt;
            const end = order.readyAt;
            if (start && end) {
                const diffMs = new Date(end) - new Date(start);
                const diffMins = diffMs / (1000 * 60);
                if (diffMins > 0 && diffMins < 180) { // filter out outliers > 3 hours
                    totalPrepTimeMinutes += diffMins;
                    validOrdersCount++;
                }
            }
        });

        const avgPrepTime = validOrdersCount > 0 ? Math.round(totalPrepTimeMinutes / validOrdersCount) : 0;

        const summary = {
            today: {
                orders: await Order.countDocuments({ restaurant: restaurantId, createdAt: { $gte: today } }),
                revenue: 0,
                avgOrderValue: 0
            },
            active: {
                pending: await Order.countDocuments({ restaurant: restaurantId, status: 'PENDING' }),
                preparing: await Order.countDocuments({ restaurant: restaurantId, status: 'PREPARING' }),
                ready: await Order.countDocuments({ restaurant: restaurantId, status: 'READY' }),
                guests: activeGuests
            },
            performance: {
                avgPrepTime: avgPrepTime // in minutes
            },
            allTime: {
                totalOrders: await Order.countDocuments({ restaurant: restaurantId }),
                totalRevenue: 0
            }
        };

        // Today's revenue
        const todayRevenue = await Order.aggregate([
            { $match: { restaurant: restaurantObjectId, createdAt: { $gte: today }, paymentStatus: 'PAID' } },
            { $group: { _id: null, total: { $sum: '$total' }, avg: { $avg: '$total' } } }
        ]);

        if (todayRevenue.length > 0) {
            summary.today.revenue = todayRevenue[0].total;
            summary.today.avgOrderValue = todayRevenue[0].avg;
        }

        // All-time revenue
        const allTimeRevenue = await Payment.aggregate([
            { $match: { restaurant: restaurantObjectId, status: 'COMPLETED' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        if (allTimeRevenue.length > 0) {
            summary.allTime.totalRevenue = allTimeRevenue[0].total;
        }

        // Trend calculations
        const yesterdayStart = new Date(today);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(today);
        yesterdayEnd.setMilliseconds(-1);

        const yesterdayRevenueData = await Order.aggregate([
            { $match: { restaurant: restaurantObjectId, createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd }, paymentStatus: 'PAID' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const yesterdayRevenue = yesterdayRevenueData.length > 0 ? yesterdayRevenueData[0].total : 0;
        const revenueTrend = yesterdayRevenue > 0 ? ((summary.today.revenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1) : "0.0";

        const yesterdayOrders = await Order.countDocuments({ restaurant: restaurantId, createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } });
        const ordersTrend = yesterdayOrders > 0 ? ((summary.today.orders - yesterdayOrders) / yesterdayOrders * 100).toFixed(1) : "0.0";

        // Prep time trend (Yesterday's avg)
        const dayBeforeYesterday = new Date(yesterdayStart);
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);

        const yesterdayCompletedOrders = await Order.find({
            restaurant: restaurantId,
            status: { $in: ['READY', 'SERVED', 'COMPLETED'] },
            readyAt: { $exists: true },
            createdAt: { $gte: dayBeforeYesterday, $lte: yesterdayEnd }
        }).select('createdAt acceptedAt readyAt');

        let yestTotalPrep = 0;
        let yestValidCount = 0;
        yesterdayCompletedOrders.forEach(o => {
            const start = o.acceptedAt || o.createdAt;
            const end = o.readyAt;
            if (start && end) {
                const diff = (new Date(end) - new Date(start)) / (1000 * 60);
                if (diff > 0 && diff < 180) { yestTotalPrep += diff; yestValidCount++; }
            }
        });
        const yestAvgPrepTime = yestValidCount > 0 ? Math.round(yestTotalPrep / yestValidCount) : 0;
        const prepTimeTrend = yestAvgPrepTime > 0 ? ((avgPrepTime - yestAvgPrepTime) / yestAvgPrepTime * 100).toFixed(1) : "0.0";

        // Guest trend (Total guests from orders today vs yesterday)
        const guestsTodayData = await Order.aggregate([
            { $match: { restaurant: restaurantObjectId, createdAt: { $gte: today } } },
            { $group: { _id: null, total: { $sum: '$guestCount' } } }
        ]);
        const guestsToday = guestsTodayData.length > 0 ? guestsTodayData[0].total : 0;

        const guestsYesterdayData = await Order.aggregate([
            { $match: { restaurant: restaurantObjectId, createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } } },
            { $group: { _id: null, total: { $sum: '$guestCount' } } }
        ]);
        const guestsYesterday = guestsYesterdayData.length > 0 ? guestsYesterdayData[0].total : 0;
        const guestsTrend = guestsYesterday > 0 ? ((guestsToday - guestsYesterday) / guestsYesterday * 100).toFixed(1) : "0.0";

        // Recent Activity (Merge Orders, Reservations, Complaints)
        const recentOrders = await Order.find({ restaurant: restaurantObjectId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('orderNumber status total createdAt table')
            .populate('table', 'name')
            .lean();


        const recentComplaints = await Complaint.find({ restaurant: restaurantObjectId, isDeleted: { $ne: true } })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('message type severity status createdAt')
            .lean();

        const recentActivity = [
            ...recentOrders.map(o => ({
                id: o._id,
                type: 'order',
                text: `Order #${o.orderNumber?.slice(-4) || '????'} (${o.status})`, // Shorten ID
                subtext: o.table ? `Table: ${o.table.name}` : `Total: $${o.total}`,
                time: o.createdAt,
                status: o.status
            })),
            ...recentComplaints.map(c => ({
                id: c._id,
                type: 'complaint',
                text: `Complaint: ${c.type}`,
                subtext: c.message.substring(0, 30) + '...',
                time: c.createdAt,
                status: c.severity
            }))
        ]
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 10); // Return top 10 mixed activities


        const dashboardData = {
            ...summary,
            trends: {
                revenue: (revenueTrend >= 0 ? '+' : '') + revenueTrend + '%',
                orders: (ordersTrend >= 0 ? '+' : '') + ordersTrend + '%',
                prepTime: (prepTimeTrend >= 0 ? '+' : '') + prepTimeTrend + '%',
                guests: (guestsTrend >= 0 ? '+' : '') + guestsTrend + '%'
            },
            recentActivity
        };

        // Cache for 5 minutes
        await cache.set(cacheKey, dashboardData, 300);

        res.status(200).json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        next(error);
    }
};
// @route   GET /api/analytics/orders/:restaurantId
// @access  Private (Owner)
export const getOrdersAnalytics = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { startDate, endDate, groupBy = 'day', timezone = 'UTC' } = req.query;

        const matchQuery = { restaurant: restaurantId };

        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
        }

        // Group by format
        const groupFormat = groupBy === 'month' ? '%Y-%m' : groupBy === 'week' ? '%Y-W%U' : '%Y-%m-%d';

        const analytics = await Order.aggregate([
            { $match: { ...matchQuery, restaurant: new mongoose.Types.ObjectId(restaurantId) } },
            {
                $group: {
                    _id: { $dateToString: { format: groupFormat, date: '$createdAt', timezone } },
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$total' },
                    avgOrderValue: { $avg: '$total' },
                    statusBreakdown: {
                        $push: '$status'
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get revenue analytics
// @route   GET /api/analytics/revenue/:restaurantId
// @access  Private (Owner)
export const getRevenueAnalytics = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { startDate, endDate } = req.query;

        const currentStart = new Date(startDate);
        const currentEnd = new Date(endDate);
        const duration = currentEnd.getTime() - currentStart.getTime();
        const previousStart = new Date(currentStart.getTime() - duration);
        const previousEnd = new Date(currentStart);

        const getStats = async (start, end) => {
            const result = await Order.aggregate([
                {
                    $match: {
                        restaurant: new mongoose.Types.ObjectId(restaurantId),
                        paymentStatus: 'PAID',
                        createdAt: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$total' },
                        totalTransactions: { $sum: 1 },
                        avgTransactionValue: { $avg: '$total' }
                    }
                }
            ]);
            return result[0] || { totalRevenue: 0, totalTransactions: 0, avgTransactionValue: 0 };
        };

        const currentStats = await getStats(currentStart, currentEnd);
        const previousStats = await getStats(previousStart, previousEnd);

        // Calculate trends
        const calculateTrend = (curr, prev) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

        // Get payment method breakdown for CURRENT period
        const paymentMethodStats = await Order.aggregate([
            {
                $match: {
                    restaurant: new mongoose.Types.ObjectId(restaurantId),
                    paymentStatus: 'PAID',
                    createdAt: { $gte: currentStart, $lte: currentEnd }
                }
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    total: { $sum: '$total' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                ...currentStats,
                trends: {
                    revenue: Number(calculateTrend(currentStats.totalRevenue, previousStats.totalRevenue).toFixed(1)),
                    orders: Number(calculateTrend(currentStats.totalTransactions, previousStats.totalTransactions).toFixed(1)),
                    ticket: Number(calculateTrend(currentStats.avgTransactionValue, previousStats.avgTransactionValue).toFixed(1))
                },
                paymentMethodBreakdown: paymentMethodStats
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get peak hours analytics
// @route   GET /api/analytics/peak-hours/:restaurantId
// @access  Private (Owner)
export const getPeakHoursAnalytics = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { startDate, endDate, timezone = 'UTC' } = req.query;

        const matchQuery = { restaurant: restaurantId };

        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
        }

        const peakHours = await Order.aggregate([
            { $match: { ...matchQuery, restaurant: new mongoose.Types.ObjectId(restaurantId) } },
            {
                $group: {
                    _id: { $hour: { date: '$createdAt', timezone } },
                    orderCount: { $sum: 1 },
                    totalRevenue: { $sum: '$total' }
                }
            },
            { $sort: { orderCount: -1 } }
        ]);

        // Day of week analysis
        const dayOfWeek = await Order.aggregate([
            { $match: { ...matchQuery, restaurant: new mongoose.Types.ObjectId(restaurantId) } },
            {
                $group: {
                    _id: { $dayOfWeek: { date: '$createdAt', timezone } },
                    orderCount: { $sum: 1 },
                    totalRevenue: { $sum: '$total' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeekNamed = dayOfWeek.map(d => ({
            day: dayNames[d._id - 1],
            orderCount: d.orderCount,
            totalRevenue: d.totalRevenue
        }));

        res.status(200).json({
            success: true,
            data: {
                hourlyBreakdown: peakHours,
                dayOfWeekBreakdown: dayOfWeekNamed
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get top menu items
// @route   GET /api/analytics/top-items/:restaurantId
// @access  Private (Owner)
export const getTopMenuItems = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { startDate, endDate, limit = 10 } = req.query;

        const matchQuery = { restaurant: restaurantId };

        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
        }

        const topItems = await Order.aggregate([
            { $match: { ...matchQuery, restaurant: new mongoose.Types.ObjectId(restaurantId) } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.menuItem',
                    itemName: { $first: '$items.name' },
                    totalOrdered: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalOrdered: -1 } },
            { $limit: parseInt(limit) }
        ]);

        // Populate menu item details
        await MenuItem.populate(topItems, { path: '_id', select: 'name category image' });

        res.status(200).json({
            success: true,
            data: topItems
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get table usage analytics
// @route   GET /api/analytics/table-usage/:restaurantId
// @access  Private (Owner)
export const getTableUsageAnalytics = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { startDate, endDate } = req.query;

        const matchQuery = { restaurant: restaurantId };

        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
        }

        const tableUsage = await Order.aggregate([
            { $match: { ...matchQuery, restaurant: new mongoose.Types.ObjectId(restaurantId) } },
            {
                $group: {
                    _id: '$table',
                    orderCount: { $sum: 1 },
                    totalRevenue: { $sum: '$total' },
                    avgOrderValue: { $avg: '$total' }
                }
            },
            { $sort: { orderCount: -1 } }
        ]);

        // Populate table details
        await Table.populate(tableUsage, { path: '_id', select: 'name location' });

        res.status(200).json({
            success: true,
            data: tableUsage
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get dashboard notifications
// @route   GET /api/analytics/notifications/:restaurantId
// @access  Private (Owner)
export const getNotifications = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ success: false, message: 'Invalid restaurant ID' });
        }

        // Fetch actionable items
        const pendingOrders = await Order.find({ restaurant: restaurantId, status: 'PENDING' })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const newComplaints = await Complaint.find({ restaurant: restaurantId, status: 'OPEN', isDeleted: { $ne: true } })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();


        const notifications = [
            ...pendingOrders.map(o => ({
                id: o._id,
                type: 'order',
                title: 'New Order Pending',
                message: `Order #${o.orderNumber?.slice(-4) || '????'} needs acceptance`,
                time: o.createdAt,
                unread: true,
                link: '/orders'
            })),
            ...newComplaints.map(c => ({
                id: c._id,
                type: 'complaint',
                title: `${c.severity} Complaint`,
                message: c.message.substring(0, 40) + '...',
                time: c.createdAt,
                unread: true,
                link: '/complaints'
            })),
        ].sort((a, b) => new Date(b.time) - new Date(a.time));

        res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (error) {
        next(error);
    }
};

