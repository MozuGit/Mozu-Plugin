import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import crypto from 'crypto'

import routes from './router/index.js'
import Config from '#Config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(express.json())
app.use('/api', routes)
app.use(express.static(path.join(__dirname, 'static')))
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'))
})

app.listen(Config.panel.login.port, (Config.panel.login.host === 'auto' ? '0.0.0.0' : Config.panel.login.host), () => {

})