import express from 'express'
import { getInfo, handleConfig, handleBackup, handleCdk, handlePlayer, handleSect, getActivePlayers } from '../controllers/xiuxianController.js'

const router = express.Router()

const routes = [
  { path: '/getInfo', methods: ['get'], handler: getInfo },
  { path: '/get_active_players', methods: ['get'], handler: getActivePlayers },
  { path: '/config', methods: ['get', 'post'], handler: handleConfig },
  { path: '/cdk', methods: ['get', 'post'], handler: handleCdk },
  { path: '/player', methods: ['get', 'post'], handler: handlePlayer },
  { path: '/sect', methods: ['get', 'post'], handler: handleSect },
  { path: '/backup', methods: ['get', 'post'], handler: handleBackup }
]

routes.forEach(({ path, methods, handler }) => {
  methods.forEach(method => {
    router[method](path, handler)
  })
})

export default router