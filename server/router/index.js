import express from 'express'
import authRouter from './auth.js'
import xiuxianRouter from './xiuxian.js'
import aboutRouter from './about.js'

const router = express.Router()

router.use('/login', authRouter)
router.use('/xiuxian', xiuxianRouter)
router.use('/about', aboutRouter)

export default router