import express from 'express'
import { syncBatch, pullChanges, syncHealth } from '../controllers/sync.controller.js'
import { syncProtect } from '../middleware/syncAuth.js'

const router = express.Router()

router.post('/batch', syncProtect, syncBatch)
router.get('/pull', syncProtect, pullChanges)
router.get('/health', syncHealth)

export default router
