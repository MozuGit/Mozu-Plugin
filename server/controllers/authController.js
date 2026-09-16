import TwoFactorAuth from '../../lib/TwoFactorAuth.js'

import Redis from '#Redis'
import Config from '#Config'
import crypto from 'crypto'

// 统一处理登录相关请求
export const handleLogin = async (req, res) => {
  const { action } = req.query

  try {
    // 处理获取验证码
    if (action === 'get_code') {
      return await handleGetCode(req, res)
    }

    // 处理获取验证码剩余时间
    if (action === 'get_code_ttl') {
      return await handleGetCodeTTL(req, res)
    }

    // 处理重置密码
    if (action === 'reset_password') {
      return await handleResetPassword(req, res)
    }

    //退出登录
    if (action === 'exit') {
      return await handleExitLogin(req, res)
    }

    // 登录
    return await handleNormalLogin(req, res)

  } catch (error) {
    res.json({
      success: false,
      message: "服务器内部错误"
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
  const code = String(crypto.randomInt(0, 1000000)).padStart(8, '0')
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
  if (parseInt(await Redis.get(`Mozu:panel:code:${ip}:count`)) >= 5) {
    await Redis.del(`Mozu:panel:code:${ip}`)
    await Redis.del(`Mozu:panel:code:${ip}:count`)
    return res.json({
      success: false,
      message: '验证码连续错误，请重新获取验证码'
    })
  }
  const savedCode = await Redis.get(`Mozu:panel:code:${ip}`)
  if (code !== savedCode) {
    await Redis.incr(`Mozu:panel:code:${ip}:count`)
    return res.json({
      success: false,
      message: '验证码错误'
    })
  }

  Config.modify('panel', 'login', 'password', newPassword)
  await Redis.del(`Mozu:panel:code:${ip}`)
  await Redis.del(`Mozu:panel:code:${ip}:count`)
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

  if (((await hashSHA256(password)) === Config.panel.login.password || password === Config.panel.login.password) && (!Config.panel.totp.enabled || TwoFactorAuth.verifyToken(Config.panel.totp.secret, req.body.token))) {
    const token = crypto.randomBytes(32).toString('hex')
    await Redis.sadd("Mozu:panel:token", token)
    await Redis.del("Mozu:panel:password:error")
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token: token
      }
    })
  } else if ((await hashSHA256(password)) !== Config.panel.login.password && password !== Config.panel.login.password) {
    await Redis.set("Mozu:panel:password:error", 0, 'EX', 60, 'NX')
    await Redis.incr("Mozu:panel:password:error")
    res.json({
      success: false,
      message: '密码错误'
    })
  } else {
    res.json({
      success: false,
      message: 'TOTP 验证码错误'
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

export const handle2FA = async (req, res) => {
  const auth = await validateToken(req)
  if (!auth.valid) {
    return res.status(401).json({
      success: false,
      message: auth.error
    })
  }
  const { action } = req.query

  try {
    // 启用 TOTP 双因素认证密钥
    if (action === 'create') {
      return await handleCreateTotp(req, res)
    }

    // 启用验证 TOTP 双因素认证
    if (action === 'enable') {
      return await handleEnableTotp(req, res)
    }

    // 删除 TOTP 双因素认证
    if (action === 'delete') {
      return await handleDeleteTotp(req, res)
    }

    return res.status(400).json({
      success: false,
      message: '无效的操作',
    })
  } catch (error) {
    res.json({
      success: false,
      message: error.message
    })
  }
}

const handleCreateTotp = async (req, res) => {
  if (Config.panel.totp.enabled) {
    return res.status(409).json({
      success: false,
      message: 'TOTP 双因素认证已启用'
    })
  }
  const secret = TwoFactorAuth.generateSecret()
  await Redis.set("Mozu:panel:totp:secret", secret.base32, 'EX', 300)
  res.json({
    success: true,
    data: {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url
    }
  })
}

const handleEnableTotp = async (req, res) => {
  if (Config.panel.totp.enabled) {
    return res.status(409).json({
      success: false,
      message: 'TOTP 双因素认证已启用'
    })
  }
  const secret = await Redis.get("Mozu:panel:totp:secret")
  if (!secret) {
    return res.status(400).json({
      success: false,
      message: '密钥未创建或已过期',
    })
  }
  const ok = TwoFactorAuth.verifyToken(secret, req.body.token)
  if (!ok) {
    return res.json({
      success: false,
      message: 'TOTP 验证码错误'
    })
  }
  Config.modify('panel', 'totp', 'enabled', true)
  Config.modify('panel', 'totp', 'secret', secret)
  await Redis.del("Mozu:panel:totp:secret")
  res.json({
    success: true,
    message: 'TOTP 双因素认证启用成功'
  })
}

const handleDeleteTotp = async (req, res) => {
  if (!Config.panel.totp.enabled) {
    return res.json({
      success: false,
      message: 'TOTP 双因素认证未启用'
    })
  }
  const ok = TwoFactorAuth.verifyToken(Config.panel.totp.secret, req.body.token)
  if (!ok) {
    return res.json({
      success: false,
      message: 'TOTP 验证码错误'
    })
  }
  Config.modify('panel', 'totp', 'enabled', false)
  Config.modify('panel', 'totp', 'secret', '')
  res.json({
    success: true,
    message: 'TOTP 双因素认证关闭成功'
  })
}

async function validateToken(req) {
  const authHeader = req?.headers?.authorization
  if (!authHeader) {
    return { valid: false, error: '未登录，请先登录' }
  }
  if (!authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'token 格式错误' }
  }
  const token = authHeader.substring(7)
  if (!token || token.length === 0) {
    return { valid: false, error: 'token 为空' }
  }
  try {
    const presence = await Redis.sismember("Mozu:panel:token", token)
    if (!presence) {
      return { valid: false, error: 'token 无效或已过期' }
    }
    return { valid: true, token }
  } catch (error) {
    return { valid: false, error: '认证服务异常' }
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