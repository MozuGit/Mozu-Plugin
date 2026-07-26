import express from 'express'
import { getInfo } from '../controllers/xiuxianController.js'

const router = express.Router()

logger.info(getInfo)

router.get('/getInfo', getInfo)

export default router