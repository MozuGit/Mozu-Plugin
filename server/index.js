import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'

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
const displayHost = Config.panel.login.host === 'auto' ? remoteIp || 'localhost' : Config.panel.login.host

const RGB = [
  [255, 107, 107],
  [255, 165, 107],
  [255, 231, 107],
  [107, 255, 150],
  [107, 200, 255],
  [180, 107, 255],
  [255, 107, 200],
]

const PORT = Number(Config.panel.login.port) || 11451

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  logger.error(logger.red(`[魔族陌面版] 端口配置无效：${Config.panel.login.port}，面版未启动`))
} else {
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(buildLoggerRGB('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
    logger.info(buildLoggerRGB('┃ [魔族陌] 启动成功喵~'))
    logger.info(buildLoggerRGB(`┃ 外网地址：http://${displayHost}:${PORT}`))
    logger.info(buildLoggerRGB(`┃ 本地地址：http://127.0.0.1:${PORT}`))
    logger.info(buildLoggerRGB('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
  })

  server.on('error', (err) => {
    const tips = {
      EADDRINUSE:
        `端口 ${PORT} 已被占用：可能是另一个云崽实例、上次没退干净的残留进程，或插件被热重载后重复监听。` +
        `Windows 用 netstat -ano | findstr :${PORT} 找 PID 后 taskkill /PID <pid> /F；` +
        `Linux 用 lsof -i:${PORT}。也可以改 config/panel/config/login.yaml 的 port 再重启。`,
      EACCES: `没有权限监听 ${PORT}（Linux 下 1024 以下端口需要 root，或端口被系统保留）。`,
      EADDRNOTAVAIL: `监听地址 0.0.0.0 不可用，检查网卡 / 容器网络配置。`,
    }
    logger.error(logger.red(`[魔族陌面版] 面版启动失败：${err.code}`))
    logger.error(`[魔族陌面版] ${tips[err.code] || err.message}`)
    logger.error(`[魔族陌面版] 面版已禁用，机器人其它功能不受影响`)
  })
}

function buildLoggerRGB(message) {
  let index = 0
  let result = ''
  for (const ch of message) {
    result += logger.rgb(...RGB[index++ % RGB.length])(ch)
  }
  return result
}

async function getRemoteIp() {
  let cacheData = await Redis.get('Mozu:remote-ip')
  if (cacheData) return cacheData
  let apis = ['http://v4.ip.zxinc.org/info.php?type=json']
  for (let api of apis) {
    let response
    try {
      response = await fetch(api)
    } catch {
      continue
    }
    if (response.status === 200) {
      let { code, data } = await response.json()
      if (code === 0) {
        Redis.set('Mozu:remote-ip', data.myip, 'EX', 3600 * 24)
        return data.myip
      }
    }
  }
  return false
}
