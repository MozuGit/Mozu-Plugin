import express from 'express'
import { getInfo, handleBackup, handleCdk, handlePlayer, handleSect } from '../controllers/xiuxianController.js'

const router = express.Router()

router.get('/getInfo', getInfo)
router.get('/backup', handleBackup)
router.post('/backup', handleBackup)
router.get('/cdk', handleCdk)
router.post('/cdk', handleCdk)
router.get('/player', handlePlayer)
router.post('/player', handlePlayer)
router.get('/sect', handleSect)
router.post('/sect', handleSect)

export default router