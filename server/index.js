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

const RGB = [[255, 107, 107], [255, 165, 107], [255, 231, 107], [107, 255, 150], [107, 200, 255], [180, 107, 255], [255, 107, 200]]

app.listen(Config.panel.login.port || 11451, '0.0.0.0', () => {
  logger.info(buildLoggerRGB("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
  logger.info(buildLoggerRGB("┃ [魔族陌] 启动成功喵~"))
  logger.info(buildLoggerRGB(`┃ 外网地址：http://${displayHost}:${Config.panel.login.port || 11451}`))
  logger.info(buildLoggerRGB(`┃ 本地地址：http://127.0.0.1:${Config.panel.login.port || 11451}`))
  logger.info(buildLoggerRGB("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
})

function buildLoggerRGB(message) {
  let index = 0
  let result = ""
  for (const ch of message) {
    result += logger.rgb(...(RGB[index++]))(ch)
    if (index >= RGB.length) index = 0
  }
  return result
}

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