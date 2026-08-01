import express from 'express'
import { getInfo, handleCdk, handlePlayer } from '../controllers/xiuxianController.js'

const router = express.Router()

router.get('/getInfo', getInfo)
router.get('/cdk', handleCdk)
router.post('/cdk', handleCdk)
router.get('/player', handlePlayer)
router.post('/player', handlePlayer)

export default router