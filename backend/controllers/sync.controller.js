import { syncService } from '../services/sync.service.js'
import logger from '../utils/logger.js'
import { sendWhatsAppToStaff } from '../services/whatsapp.service.js'

export const syncBatch = async (req, res, next) => {
    try {
        const restaurantId = req.restaurantId
        const payload = req.body
        const io = req.app.get('io')

        if (!payload || Object.keys(payload).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Sync payload is empty'
            })
        }

        const result = await syncService.processBatch(payload, restaurantId)

        if (io) {
            if (result.orders) {
                for (const item of result.orders) {
                    if (item.action === 'created') {
                        const order = await syncService.getEntityById('orders', item._id, restaurantId)
                        if (order) {
                            io.to(`restaurant:${restaurantId}`).emit('order:created', {
                                order,
                                message: `New order #${order.orderNumber} synced from POS`
                            })

                            sendWhatsAppToStaff(restaurantId, `🆕 New Order – #${order.orderNumber}`, ['OWNER', 'WAITER'])
                        }
                    } else if (item.action === 'updated') {
                        io.to(`restaurant:${restaurantId}`).emit('order:updated', {
                            orderId: item._id,
                            orderNumber: item.orderNumber
                        })
                    }
                }
            }

            if (result.payments) {
                for (const item of result.payments) {
                    if (item.action === 'created') {
                        io.to(`restaurant:${restaurantId}`).emit('order:payment-updated', {
                            paymentId: item._id,
                            transactionId: item.transactionId
                        })
                    }
                }
            }
        }

        logger.info(`Sync batch processed for restaurant ${restaurantId}`)

        res.status(200).json({
            success: true,
            data: result
        })
    } catch (error) {
        logger.error(`Sync batch error: ${error.message}`)
        next(error)
    }
}

export const pullChanges = async (req, res, next) => {
    try {
        const restaurantId = req.restaurantId
        const { since, entities } = req.query

        if (!since) {
            return res.status(400).json({
                success: false,
                message: 'Query parameter "since" is required (ISO timestamp)'
            })
        }

        const entityList = entities ? entities.split(',') : null
        const result = await syncService.pullChanges(since, entityList, restaurantId)

        logger.info(`Sync pull processed for restaurant ${restaurantId} since ${since}`)

        res.status(200).json({
            success: true,
            data: result
        })
    } catch (error) {
        logger.error(`Sync pull error: ${error.message}`)
        next(error)
    }
}

export const syncHealth = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                status: 'ok',
                serverTime: new Date()
            }
        })
    } catch (error) {
        next(error)
    }
}
