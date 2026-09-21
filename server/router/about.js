import express from 'express'
import { getInfo } from '../controllers/aboutController.js'

const router = express.Router()

router.get('/getInfo', getInfo)

export default router