import express from 'express'
import { getInfo, handleCdk } from '../controllers/xiuxianController.js'

const router = express.Router()

router.get('/getInfo', getInfo)
router.get('/cdk', handleCdk)
router.post('/cdk', handleCdk)

export default router