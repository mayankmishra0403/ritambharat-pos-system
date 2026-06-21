import Order from '../models/Order.js'
import Payment from '../models/Payment.js'
import MenuItem from '../models/MenuItem.js'
import Table from '../models/Table.js'
import User from '../models/User.js'
import InventoryItem from '../models/InventoryItem.js'
import TaxSlab from '../models/TaxSlab.js'
import logger from '../utils/logger.js'

const SYSTEM_FIELDS = new Set(['__v', 'createdAt', 'updatedAt'])

const SENSITIVE_USER_FIELDS = new Set(['password', 'pin', 'refreshToken', 'passwordResetToken', 'passwordResetExpires', 'verificationToken', 'verificationExpires'])

const ENTITY_CONFIG = {
    orders: {
        model: Order,
        idField: 'orderNumber',
        queryField: 'orderNumber',
        restaurantField: 'restaurant',
        stripFields: []
    },
    payments: {
        model: Payment,
        idField: 'transactionId',
        queryField: 'transactionId',
        restaurantField: 'restaurant',
        stripFields: []
    },
    menuItems: {
        model: MenuItem,
        idField: '_id',
        queryField: '_id',
        restaurantField: 'restaurant',
        stripFields: []
    },
    tables: {
        model: Table,
        idField: '_id',
        queryField: '_id',
        restaurantField: 'restaurant',
        stripFields: []
    },
    users: {
        model: User,
        idField: '_id',
        queryField: '_id',
        restaurantField: 'restaurant',
        stripFields: SENSITIVE_USER_FIELDS
    },
    inventoryItems: {
        model: InventoryItem,
        idField: '_id',
        queryField: '_id',
        restaurantField: 'restaurant',
        stripFields: []
    },
    taxSlabs: {
        model: TaxSlab,
        idField: '_id',
        queryField: '_id',
        restaurantField: 'restaurant',
        stripFields: []
    }
}

export class SyncService {
    async processBatch(payload, restaurantId) {
        const result = {
            orders: [],
            payments: [],
            menuItems: [],
            tables: [],
            users: [],
            inventoryItems: [],
            taxSlabs: [],
        }

        for (const [entityType, items] of Object.entries(payload)) {
            if (!items || !Array.isArray(items) || items.length === 0) continue
            if (!ENTITY_CONFIG[entityType]) continue

            const config = ENTITY_CONFIG[entityType]
            const processed = []

            for (const item of items) {
                try {
                    const upserted = await this._upsertEntity(config, item, restaurantId)
                    processed.push(upserted)
                } catch (err) {
                    logger.warn(`Sync upsert failed for ${entityType}: ${err.message}`)
                }
            }

            result[entityType] = processed
        }

        result.serverTime = new Date()

        return result
    }

    async processItem(entityType, data, restaurantId) {
        const config = ENTITY_CONFIG[entityType]
        if (!config) return null
        return this._upsertEntity(config, data, restaurantId)
    }

    async getEntityById(entityType, id, restaurantId) {
        const config = ENTITY_CONFIG[entityType]
        if (!config) return null
        return config.model.findOne({ _id: id, [config.restaurantField]: restaurantId }).lean()
    }

    async pullChanges(since, entities, restaurantId) {
        const sinceDate = new Date(since)
        const result = {
            orders: [],
            payments: [],
            menuItems: [],
            tables: [],
            users: [],
            inventoryItems: [],
            taxSlabs: [],
        }

        const requested = new Set(entities || Object.keys(ENTITY_CONFIG))

        for (const [entityType, config] of Object.entries(ENTITY_CONFIG)) {
            if (!requested.has(entityType)) continue

            try {
                const query = {
                    [config.restaurantField]: restaurantId,
                    updatedAt: { $gt: sinceDate }
                }

                const docs = await config.model.find(query).lean()

                result[entityType] = docs
            } catch (err) {
                logger.warn(`Sync pull failed for ${entityType}: ${err.message}`)
            }
        }

        result.serverTime = new Date()

        return result
    }

    _sanitize(data, stripFields) {
        const sanitized = { ...data }
        for (const field of SYSTEM_FIELDS) {
            if (field !== 'updatedAt') {
                delete sanitized[field]
            }
        }
        for (const field of stripFields) {
            delete sanitized[field]
        }
        return sanitized
    }

    async _upsertEntity(config, data, restaurantId) {
        const { model, idField, queryField, restaurantField, stripFields } = config
        const sanitized = this._sanitize(data, stripFields)
        const incomingUpdatedAt = sanitized.updatedAt ? new Date(sanitized.updatedAt) : new Date(0)

        delete sanitized.updatedAt

        const queryValue = sanitized[idField]

        if (!queryValue) {
            sanitized[restaurantField] = restaurantId
            const created = await model.create(sanitized)
            return { _id: created._id, [idField]: created[idField], updatedAt: created.updatedAt, action: 'created' }
        }

        const query = {
            [queryField]: queryValue,
            [restaurantField]: restaurantId
        }

        const existing = await model.findOne(query)

        if (existing) {
            const existingUpdatedAt = existing.updatedAt || new Date(0)

            if (incomingUpdatedAt > existingUpdatedAt) {
                Object.assign(existing, sanitized)
                existing[restaurantField] = restaurantId
                await existing.save()
                return { _id: existing._id, [idField]: existing[idField], updatedAt: existing.updatedAt, action: 'updated' }
            }

            return { _id: existing._id, [idField]: existing[idField], updatedAt: existing.updatedAt, action: 'skipped' }
        }

        sanitized[restaurantField] = restaurantId
        const created = await model.create(sanitized)
        return { _id: created._id, [idField]: created[idField], updatedAt: created.updatedAt, action: 'created' }
    }
}

export const syncService = new SyncService()
