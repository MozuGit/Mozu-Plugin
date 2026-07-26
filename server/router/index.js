import express from 'express'
import authRouter from './auth.js'
import xiuxianRouter from './xiuxian.js'

const router = express.Router()

router.use('/login', authRouter)
router.use('/xiuxian', xiuxianRouter)

export default router