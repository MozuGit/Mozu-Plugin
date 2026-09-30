import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'

import Redis from '#Redis'
import Config from '#Config'
import routes from './router/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

const trustProxy = parseTrustProxy(Config.panel.login.trustProxy)
app.set('trust proxy', trustProxy === 'unset' ? false : trustProxy)

app.use(express.json())
app.use(warnTrustProxyIfNeeded)
app.use('/api', routes)
app.use(express.static(path.join(__dirname, 'static')))
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'))
})

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
    logger.info(buildLoggerRGB(`┃ 外网地址：http://${Config.panel.login.host}:${PORT}`))
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

/**
 * 解析 trustProxy 配置
 * @param {unknown} value
 * @returns {boolean|number|string|string[]|'unset'}
 */
function parseTrustProxy(value) {
  if (value === undefined || value === null || value === '') return 'unset'
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isInteger(value) && value >= 0 ? value : 'unset'

  if (typeof value === 'string') {
    const text = value.split('#')[0].trim()
    if (!text) return 'unset'
    if (text === 'true') return true
    if (text === 'false') return false
    if (/^\d+$/.test(text)) return parseInt(text, 10)

    const list = text
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean)
    return isValidProxyList(list) ? list : 'unset'
  }

  if (Array.isArray(value)) {
    const list = value.map((item) => String(item).trim()).filter(Boolean)
    return isValidProxyList(list) ? list : 'unset'
  }

  return 'unset'
}

function isValidProxyList(list) {
  if (list.length === 0) return false
  const keywords = ['loopback', 'linklocal', 'uniquelocal']
  const ipv4 = /^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/
  const ipv6 = /^[0-9a-fA-F:]+(\/\d{1,3})?$/
  return list.every((item) => keywords.includes(item) || ipv4.test(item) || ipv6.test(item))
}

/** @param {string} addr */
function isPrivateAddress(addr) {
  const ip = addr.replace(/^::ffff:/i, '')
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('127.')) return true
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true
  if (ip.startsWith('169.254.')) return true
  const match = /^172\.(\d{1,3})\./.exec(ip)
  if (match) {
    const second = parseInt(match[1], 10)
    if (second >= 16 && second <= 31) return true
  }
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true
  return false
}

let trustProxyWarned = false

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 */
function warnTrustProxyIfNeeded(req, _res, next) {
  try {
    if (trustProxy !== 'unset') return next()
    if (!req.headers['x-forwarded-for'] && !req.headers['x-real-ip'] && !req.headers['cf-connecting-ip']) return next()
    const socketAddr = req.socket?.remoteAddress || ''
    if (!isPrivateAddress(socketAddr)) return next()
    if (trustProxyWarned) return next()
    trustProxyWarned = true
    logger.warn(
      logger.yellow(
        '[魔族陌面版] 检测到请求经由反向代理（来源为内网地址且带转发头），但 trustProxy 未配置，' +
          '登录限流会把所有访客算作同一个 IP。请按实际情况把 config/panel/config/login.yaml 的 trustProxy 设为 1 或 2。'
      )
    )
  } catch (err) {
    logger.warn?.(`[魔族陌面版] trustProxy 提示检查失败：${err?.message || err}`)
  }
  next()
}

Redis.del('Mozu:panel:token').catch((err) => {
  logger.warn(`[魔族陌面版] 清理旧登录令牌失败：${err?.message || err}`)
})

function buildLoggerRGB(message) {
  let index = 0
  let result = ''
  for (const ch of message) {
    result += logger.rgb(...RGB[index++ % RGB.length])(ch)
  }
  return result
}

/**
 * 给 Promise 加超时，避免外部依赖挂住启动/响应流程
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} message
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms, message) {
  let timer
  return Promise.race([
    Promise.resolve(promise).finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms)
    }),
  ])
}