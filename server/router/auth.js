import express from 'express'
import { handleLogin, handle2FA } from '../controllers/authController.js'

const router = express.Router()

router.get('/', handleLogin)
router.post('/', handleLogin)
router.get('/tfa', handle2FA)
router.post('/tfa', handle2FA)

export default router
