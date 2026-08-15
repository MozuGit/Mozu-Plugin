import express from 'express'
import os from 'os'
import { fileURLToPath } from 'url'
import path from 'path'
import crypto from 'crypto'

import Redis from '#Redis'
import Config from '#Config'
import routes from './router/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(express.json())
app.use('/api', routes)
app.use(express.static(path.join(__dirname, 'static')))
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'))
})

const remoteIp = await getRemoteIp()
const displayHost = Config.panel.login.host === 'auto'
  ? (remoteIp || 'localhost')
  : Config.panel.login.host

app.listen(Config.panel.login.port || 11451, '0.0.0.0', () => {
  const RGB = [
    Math.floor(Math.random() * 155 + 100),
    Math.floor(Math.random() * 155 + 100),
    Math.floor(Math.random() * 155 + 100)
  ]
  RGB.sort(() => Math.random() - 0.5)
  logger.info(logger.rgb(...RGB)("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
  logger.info(logger.rgb(...RGB)("┃ ") + logger.rgb(131, 224, 255)("[魔族陌] 启动成功喵~"))
  logger.info(logger.rgb(...RGB)("┃ ") + logger.rgb(118, 255, 118)(`外网地址：http://${displayHost}:${Config.panel.login.port || 11451}`))
  logger.info(logger.rgb(...RGB)("┃ ") + logger.rgb(118, 255, 118)(`本地地址：http://127.0.0.1:${Config.panel.login.port || 11451}`))
  logger.info(logger.rgb(...RGB)("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
})

async function getRemoteIp() {
  let cacheData = await Redis.get("Mozu:remote-ip")
  if (cacheData) return cacheData
  let apis = ['http://v4.ip.zxinc.org/info.php?type=json']
  for (let api of apis) {
    let response
    try {
      response = await fetch(api)
    } catch { continue }
    if (response.status === 200) {
      let { code, data } = await response.json()
      if (code === 0) {
        Redis.set("Mozu:remote-ip", data.myip, 'EX', 3600 * 24)
        return data.myip
      }
    }
  }
  return false
}