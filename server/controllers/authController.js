import Redis from '#Redis'
import Config from '#Config'
import crypto from 'crypto'

// 统一处理登录相关请求
export const handleLogin = async (req, res) => {
  const { reset } = req.query

  try {
    // 处理获取验证码
    if (reset === 'get_code') {
      return await handleGetCode(req, res)
    }

    // 处理获取验证码剩余时间
    if (reset === 'get_code_ttl') {
      return await handleGetCodeTTL(req, res)
    }

    // 处理重置密码
    if (reset === 'reset_password') {
      return await handleResetPassword(req, res)
    }

    // 登录
    return await handleNormalLogin(req, res)

  } catch (error) {
    res.json({
      success: false,
      message: error.message
    })
  }
}

// 获取验证码
const handleGetCode = async (req, res) => {
  const ip = getIP(req)
  if (await Redis.get(`Mozu:panel:code:${ip}`)) {
    return res.json({
      success: false,
      message: '获取验证码频繁，请稍后再试'
    })
  }
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0')
  logger.info(logger.yellow(`[魔族陌面版][验证码][来自IP：${ip}] ${code}`))
  await Redis.set(`Mozu:panel:code:${ip}`, code, 'EX', 300)
  res.json({
    success: true
  })
}

// 获取验证码剩余时间
const handleGetCodeTTL = async (req, res) => {
  const ip = getIP(req)
  const ttl = await Redis.ttl(`Mozu:panel:code:${ip}`)
  res.json({
    success: true,
    ttl: ip === '127.0.0.1' ? 0 : ttl
  })
}

// 重置密码
const handleResetPassword = async (req, res) => {
  const { code, newPassword } = req.body

  if (!code || !newPassword) {
    return res.json({
      success: false,
      message: '请提供验证码和新密码'
    })
  }

  const ip = getIP(req)
  const savedCode = await Redis.get(`Mozu:panel:code:${ip}`)
  if (code !== savedCode) {
    return res.json({
      success: false,
      message: '验证码错误'
    })
  }

  Config.modify('panel', 'login', 'password', newPassword)
  await Redis.del(`Mozu:panel:code:${ip}`)

  res.json({
    success: true
  })
}

// 普通登录
const handleNormalLogin = async (req, res) => {
  const { password } = req.body

  if (!Config.panel.login.password) {
    return res.json({
      success: false,
      message: '未设置密码'
    })
  }

  if (parseInt(await Redis.get("Mozu:panel:password:error")) >= 10) {
    return res.json({
      success: false,
      message: '密码连续错误，请60秒后重试'
    })
  }

  if (password === Config.panel.login.password || (await hashSHA256(password)) === Config.panel.login.password) {
    const token = crypto.randomBytes(32).toString('hex')
    await Redis.sadd("Mozu:panel:token", token)
    Redis.del("Mozu:panel:password:error")
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token: token
      }
    })
  } else {
    Redis.set("Mozu:panel:password:error", 0, 'EX', 60, 'NX')
    Redis.incr("Mozu:panel:password:error")
    res.json({
      success: false,
      message: '密码错误'
    })
  }
}

// 退出登录
const handleExitLogin = async (req, res) => {
  const authHeader = req.headers.authorization.substring(7)
  const presence = await Redis.sismember("Mozu:panel:token", authHeader)
  if (presence) {
    await Redis.srem("Mozu:panel:token", authHeader)
    res.json({
      success: true,
      message: '退出登录成功'
    })
  }
}

async function hashSHA256(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

function getIP(req) {
  let ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.headers['x-real-ip'] || req.headers['cf-connecting-ip'] || req.headers['x-client-ip']
  if (!ip || ip === 'unknown') {
    ip = req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip
  }
  return ip
}