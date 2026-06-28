import Table from '../models/Table.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import WaiterAssignmentLog from '../models/WaiterAssignmentLog.js';
import logger from '../utils/logger.js';
import { sendWhatsAppToUser } from './whatsapp.service.js';

class BaseStrategy {
    constructor(restaurantId, settings) {
        this.restaurantId = restaurantId;
        this.settings = settings;
    }

    async selectWaiter(tableId, options) {
        throw new Error('selectWaiter must be implemented by subclass');
    }
}

class AutoAssignmentStrategy extends BaseStrategy {
    async selectWaiter(tableId, options) {
        const ignoreOnBreak = this.settings.ignoreOnBreak !== false;
        const maxTables = this.settings.maxActiveTablesPerWaiter || 10;
        const weights = this.settings.scoringWeights || { activeTables: 5, activeOrders: 2, pendingBills: 3, activeGuests: 1 };

        const statusFilter = ignoreOnBreak
            ? { $in: ['AVAILABLE', 'BUSY'] }
            : { $in: ['AVAILABLE', 'BUSY', 'BREAK'] };

        const waiters = await User.find({
            restaurant: this.restaurantId,
            role: 'WAITER',
            isActive: true,
            waiterStatus: statusFilter
        }).select('_id name waiterStatus lastAssignmentAt');

        if (!waiters.length) return null;

        const waiterIds = waiters.map(w => w._id);

        const activeTables = await Table.aggregate([
            { $match: { restaurant: this.restaurantId, 'currentSession.waiterId': { $in: waiterIds }, isActive: true } },
            { $group: { _id: '$currentSession.waiterId', count: { $sum: 1 } } }
        ]);
        const tableCountMap = {};
        for (const t of activeTables) {
            tableCountMap[t._id.toString()] = t.count;
        }

        const activeOrders = await Order.aggregate([
            { $match: { restaurant: this.restaurantId, paymentStatus: 'UNPAID', status: { $nin: ['CANCELLED', 'SERVED'] } } },
            { $lookup: { from: 'tables', localField: 'table', foreignField: '_id', as: 'tableDoc' } },
            { $unwind: { path: '$tableDoc', preserveNullAndEmptyArrays: true } },
            { $match: { 'tableDoc.currentSession.waiterId': { $in: waiterIds } } },
            { $group: { _id: '$tableDoc.currentSession.waiterId', orders: { $sum: 1 }, guests: { $sum: { $ifNull: ['$tableDoc.currentSession.customerCount', 0] } } } }
        ]);
        const orderCountMap = {};
        const guestCountMap = {};
        for (const o of activeOrders) {
            const id = o._id.toString();
            orderCountMap[id] = o.orders;
            guestCountMap[id] = o.guests;
        }

        const pendingBills = await Order.aggregate([
            { $match: { restaurant: this.restaurantId, paymentStatus: 'UNPAID', status: 'SERVED' } },
            { $lookup: { from: 'tables', localField: 'table', foreignField: '_id', as: 'tableDoc' } },
            { $unwind: { path: '$tableDoc', preserveNullAndEmptyArrays: true } },
            { $match: { 'tableDoc.currentSession.waiterId': { $in: waiterIds } } },
            { $group: { _id: '$tableDoc.currentSession.waiterId', count: { $sum: 1 } } }
        ]);
        const billCountMap = {};
        for (const b of pendingBills) {
            billCountMap[b._id.toString()] = b.count;
        }

        let bestWaiter = null;
        let bestScore = Infinity;

        for (const waiter of waiters) {
            const id = waiter._id.toString();
            const tCount = tableCountMap[id] || 0;
            const oCount = orderCountMap[id] || 0;
            const bCount = billCountMap[id] || 0;
            const gCount = guestCountMap[id] || 0;

            if (tCount >= maxTables) continue;

            const score = (tCount * weights.activeTables)
                + (oCount * weights.activeOrders)
                + (bCount * weights.pendingBills)
                + (gCount * weights.activeGuests);

            if (score < bestScore || (score === bestScore && (!bestWaiter || (waiter.lastAssignmentAt || 0) < (bestWaiter.lastAssignmentAt || 0)))) {
                bestScore = score;
                bestWaiter = waiter;
            }
        }

        return bestWaiter;
    }
}

class RoundRobinStrategy extends BaseStrategy {
    async selectWaiter(tableId, options) {
        const waiters = await User.find({
            restaurant: this.restaurantId,
            role: 'WAITER',
            isActive: true,
            waiterStatus: { $in: ['AVAILABLE', 'BUSY'] }
        }).select('_id name').sort({ name: 1 });

        if (!waiters.length) return null;

        const restaurant = await Restaurant.findById(this.restaurantId).select('waiterSettings.roundRobinIndex');
        let index = restaurant?.waiterSettings?.roundRobinIndex || 0;
        if (index >= waiters.length) index = 0;

        const selected = waiters[index];

        await Restaurant.findByIdAndUpdate(this.restaurantId, {
            $set: { 'waiterSettings.roundRobinIndex': (index + 1) % waiters.length }
        });

        return selected;
    }
}

class FixedSectionStrategy extends BaseStrategy {
    async selectWaiter(tableId, options) {
        const restaurant = await Restaurant.findById(this.restaurantId)
            .select('waiterSettings.fixedSections')
            .populate('waiterSettings.fixedSections.waiterId', '_id name waiterStatus');

        if (!restaurant?.waiterSettings?.fixedSections?.length) return null;

        const tableStr = tableId.toString();
        for (const section of restaurant.waiterSettings.fixedSections) {
            const hasTable = section.tableIds?.some(t => t.toString() === tableStr);
            if (hasTable) {
                return section.waiterId;
            }
        }

        return null;
    }
}

class ManualStrategy extends BaseStrategy {
    async selectWaiter(tableId, options) {
        if (!options?.preferredWaiterId) return null;

        const waiter = await User.findOne({
            _id: options.preferredWaiterId,
            restaurant: this.restaurantId,
            role: 'WAITER',
            isActive: true
        }).select('_id name waiterStatus');

        if (!waiter) return null;
        if (waiter.waiterStatus === 'OFFLINE' || waiter.waiterStatus === 'SHIFT_ENDED') return null;

        return waiter;
    }
}

const STRATEGY_MAP = {
    AUTO_ASSIGN: AutoAssignmentStrategy,
    ROUND_ROBIN: RoundRobinStrategy,
    FIXED_SECTIONS: FixedSectionStrategy,
    MANUAL: ManualStrategy
};

export const assignWaiter = async ({ restaurantId, tableId, orderId, preferredWaiterId, changedBy, mode }) => {
    try {
        const restaurant = await Restaurant.findById(restaurantId).select('waiterSettings');
        if (!restaurant) return { success: false, message: 'Restaurant not found' };

        const effectiveMode = mode || restaurant.waiterSettings?.mode || 'AUTO_ASSIGN';

        const table = await Table.findById(tableId);
        if (!table) return { success: false, message: 'Table not found' };

        if (table.currentSession?.waiterId) {
            const existingWaiter = await User.findById(table.currentSession.waiterId).select('_id name');
            return { success: true, waiter: existingWaiter, message: 'Table already has assigned waiter' };
        }

        const StrategyClass = STRATEGY_MAP[effectiveMode];
        if (!StrategyClass) return { success: false, message: `Unknown assignment mode: ${effectiveMode}` };

        const strategy = new StrategyClass(restaurantId, restaurant.waiterSettings || {});
        const selectedWaiter = await strategy.selectWaiter(tableId, { preferredWaiterId, orderId });

        if (!selectedWaiter) {
            return { success: false, message: 'No available waiter found' };
        }

        const now = new Date();
        const result = await Table.findOneAndUpdate(
            {
                _id: tableId,
                'currentSession.waiterId': { $exists: false }
            },
            {
                $set: {
                    'currentSession.waiterId': selectedWaiter._id,
                    'currentSession.waiterAssignedAt': now
                }
            },
            { new: true }
        );

        if (!result) {
            const existingWaiter = await User.findById(table.currentSession.waiterId).select('_id name');
            return { success: true, waiter: existingWaiter, message: 'Table already has assigned waiter (concurrent)' };
        }

        await User.findByIdAndUpdate(selectedWaiter._id, { lastAssignmentAt: now });

        await WaiterAssignmentLog.create({
            restaurant: restaurantId,
            table: tableId,
            order: orderId,
            waiter: selectedWaiter._id,
            changedBy: changedBy || selectedWaiter._id,
            action: 'ASSIGN',
            mode: effectiveMode
        });

        const frontendUrl = process.env.FRONTEND_URL || 'https://pos.ritambharat.software';
        const tableName = result.name || `Table ${tableId}`;
        const acceptLink = orderId ? `${frontendUrl}/accept/${orderId}` : '';
        await sendWhatsAppToUser(
            selectedWaiter._id,
            `Table ${tableName} assigned to you`,
            acceptLink
        );

        logger.info(`Waiter ${selectedWaiter.name} assigned to table ${tableName} (mode: ${effectiveMode})`);

        return { success: true, waiter: selectedWaiter, message: `Assigned to ${selectedWaiter.name}` };
    } catch (error) {
        logger.error(`Waiter assignment error: ${error.message}`);
        return { success: false, message: error.message };
    }
};

export const releaseWaiter = async ({ restaurantId, tableId, changedBy, reason }) => {
    try {
        const table = await Table.findById(tableId);
        if (!table) return { success: false, message: 'Table not found' };

        const oldWaiterId = table.currentSession?.waiterId;
        if (!oldWaiterId) return { success: true, message: 'No waiter assigned' };

        await WaiterAssignmentLog.create({
            restaurant: restaurantId,
            table: tableId,
            waiter: oldWaiterId,
            changedBy: changedBy || oldWaiterId,
            action: 'RELEASE',
            mode: 'RELEASE',
            reason: reason || 'Table closed'
        });

        logger.info(`Waiter released from table ${table.name}`);

        return { success: true, waiterId: oldWaiterId };
    } catch (error) {
        logger.error(`Waiter release error: ${error.message}`);
        return { success: false, message: error.message };
    }
};

export const transferWaiter = async ({ restaurantId, tableId, newWaiterId, changedBy, reason }) => {
    try {
        const table = await Table.findById(tableId);
        if (!table) return { success: false, message: 'Table not found' };

        const newWaiter = await User.findOne({
            _id: newWaiterId,
            restaurant: restaurantId,
            role: 'WAITER',
            isActive: true
        }).select('_id name waiterStatus');

        if (!newWaiter) return { success: false, message: 'New waiter not found' };
        if (newWaiter.waiterStatus === 'OFFLINE' || newWaiter.waiterStatus === 'SHIFT_ENDED') {
            return { success: false, message: 'Selected waiter is not available' };
        }

        const oldWaiterId = table.currentSession?.waiterId;

        const now = new Date();
        table.currentSession.waiterId = newWaiter._id;
        table.currentSession.waiterAssignedAt = now;
        await table.save();

        await User.findByIdAndUpdate(newWaiter._id, { lastAssignmentAt: now });

        await WaiterAssignmentLog.create({
            restaurant: restaurantId,
            table: tableId,
            waiter: newWaiter._id,
            oldWaiter: oldWaiterId,
            changedBy: changedBy,
            action: 'TRANSFER',
            mode: 'TRANSFER',
            reason: reason || 'Manager transfer'
        });

        const tableName = table.name || `Table ${tableId}`;
        await sendWhatsAppToUser(newWaiter._id, `Table ${tableName} transferred to you`);

        logger.info(`Table ${tableName} transferred to waiter ${newWaiter.name}`);

        return { success: true, waiter: newWaiter, oldWaiterId };
    } catch (error) {
        logger.error(`Waiter transfer error: ${error.message}`);
        return { success: false, message: error.message };
    }
};

export const getWaiterLoads = async (restaurantId) => {
    try {
        const waiters = await User.find({
            restaurant: restaurantId,
            role: 'WAITER',
            isActive: true
        }).select('_id name waiterStatus lastAssignmentAt');

        const waiterIds = waiters.map(w => w._id);

        const activeTables = await Table.aggregate([
            { $match: { restaurant: restaurantId, 'currentSession.waiterId': { $in: waiterIds }, isActive: true } },
            { $group: { _id: '$currentSession.waiterId', count: { $sum: 1 } } }
        ]);
        const tableCountMap = {};
        for (const t of activeTables) tableCountMap[t._id.toString()] = t.count;

        const activeOrders = await Order.aggregate([
            { $match: { restaurant: restaurantId, paymentStatus: 'UNPAID', status: { $nin: ['CANCELLED', 'SERVED'] } } },
            { $lookup: { from: 'tables', localField: 'table', foreignField: '_id', as: 'tableDoc' } },
            { $unwind: { path: '$tableDoc', preserveNullAndEmptyArrays: true } },
            { $match: { 'tableDoc.currentSession.waiterId': { $in: waiterIds } } },
            { $group: { _id: '$tableDoc.currentSession.waiterId', orders: { $sum: 1 }, guests: { $sum: { $ifNull: ['$tableDoc.currentSession.customerCount', 0] } } } }
        ]);
        const orderCountMap = {};
        const guestCountMap = {};
        for (const o of activeOrders) {
            const id = o._id.toString();
            orderCountMap[id] = o.orders;
            guestCountMap[id] = o.guests;
        }

        const pendingBills = await Order.aggregate([
            { $match: { restaurant: restaurantId, paymentStatus: 'UNPAID', status: 'SERVED' } },
            { $lookup: { from: 'tables', localField: 'table', foreignField: '_id', as: 'tableDoc' } },
            { $unwind: { path: '$tableDoc', preserveNullAndEmptyArrays: true } },
            { $match: { 'tableDoc.currentSession.waiterId': { $in: waiterIds } } },
            { $group: { _id: '$tableDoc.currentSession.waiterId', count: { $sum: 1 } } }
        ]);
        const billCountMap = {};
        for (const b of pendingBills) billCountMap[b._id.toString()] = b.count;

        return waiters.map(w => {
            const id = w._id.toString();
            return {
                _id: w._id,
                name: w.name,
                status: w.waiterStatus,
                lastAssignmentAt: w.lastAssignmentAt,
                activeTables: tableCountMap[id] || 0,
                activeOrders: orderCountMap[id] || 0,
                activeGuests: guestCountMap[id] || 0,
                pendingBills: billCountMap[id] || 0
            };
        });
    } catch (error) {
        logger.error(`Get waiter loads error: ${error.message}`);
        return [];
    }
};

export const getAssignedTables = async (waiterId) => {
    try {
        const tables = await Table.find({
            'currentSession.waiterId': waiterId,
            isActive: true,
            status: 'OCCUPIED'
        }).select('name status currentSession capacity location');

        return tables;
    } catch (error) {
        logger.error(`Get assigned tables error: ${error.message}`);
        return [];
    }
};
