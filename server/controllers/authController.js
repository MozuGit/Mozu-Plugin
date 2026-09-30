import TwoFactorAuth from '../../lib/TwoFactorAuth.js'
import {
  TOKEN_TTL,
  MAX_PASSWORD_ATTEMPTS,
  MAX_CODE_ATTEMPTS,
  tokenKey,
  getBearerToken,
  isTokenValid,
  revokeToken,
} from '../../lib/panelAuth.js'

import Redis from '#Redis'
import Config from '#Config'
import crypto from 'crypto'

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a))
  const bufB = Buffer.from(String(b))
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

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
      message: '服务器内部错误',
    })
  }
}

// 获取验证码
const handleGetCode = async (req, res) => {
  const ip = getIP(req)
  if (await Redis.get(`Mozu:panel:code:${ip}`)) {
    return res.json({
      success: false,
      message: '获取验证码频繁，请稍后再试',
    })
  }
  const code = String(crypto.randomInt(0, 100000000)).padStart(8, '0')
  logger.info(logger.yellow(`[魔族陌面版][验证码][来自IP：${ip}] ${code}`))
  await Redis.set(`Mozu:panel:code:${ip}`, code, 'EX', 300)
  res.json({
    success: true,
  })
}

// 获取验证码剩余时间
const handleGetCodeTTL = async (req, res) => {
  const ip = getIP(req)
  const ttl = await Redis.ttl(`Mozu:panel:code:${ip}`)
  res.json({
    success: true,
    ttl,
    totpRequired: isTotpEnabled(),
  })
}

// 重置密码
const handleResetPassword = async (req, res) => {
  const { code, newPassword } = req.body

  if (!code || !newPassword) {
    return res.json({
      success: false,
      message: '请提供验证码和新密码',
    })
  }

  const ip = getIP(req)

  const attemptKey = `Mozu:panel:code:${ip}:count`
  const attempts = await Redis.incr(attemptKey)
  if (attempts === 1) await Redis.expire(attemptKey, 300)
  if (attempts > MAX_CODE_ATTEMPTS) {
    await Redis.del(`Mozu:panel:code:${ip}`)
    await Redis.del(attemptKey)
    return res.json({
      success: false,
      message: '验证码连续错误，请重新获取验证码',
    })
  }

  const savedCode = await Redis.get(`Mozu:panel:code:${ip}`)
  if (!savedCode || !safeEqual(String(code), String(savedCode))) {
    return res.json({
      success: false,
      message: '验证码错误',
    })
  }

  if (isTotpEnabled() && !TwoFactorAuth.verifyToken(Config.panel.login.totp.secret, req.body.token)) {
    return res.json({
      success: false,
      message: req.body.token ? 'TOTP 验证码错误' : '请输入 TOTP 动态验证码',
      needTotp: true,
    })
  }

  Config.modify('panel', 'login', 'password', newPassword)
  await Redis.del(`Mozu:panel:code:${ip}`)
  await Redis.del(attemptKey)
  res.json({
    success: true,
  })
}

// 普通登录
const handleNormalLogin = async (req, res) => {
  const { password } = req.body
  const ip = getIP(req)
  const errorKey = `Mozu:panel:password:error:${ip}`

  if (!Config.panel.login.password) {
    return res.json({
      success: false,
      message: '未设置密码',
    })
  }

  if (parseInt(await Redis.get(errorKey), 10) >= MAX_PASSWORD_ATTEMPTS) {
    return res.json({
      success: false,
      message: '密码连续错误，请60秒后重试',
    })
  }

  const passwordOk =
    password !== undefined &&
    ((await hashSHA256(password)) === Config.panel.login.password ||
      safeEqual(String(password), String(Config.panel.login.password)))

  if (passwordOk && (!isTotpEnabled() || TwoFactorAuth.verifyToken(Config.panel.login.totp.secret, req.body.token))) {
    const token = crypto.randomBytes(32).toString('hex')
    await Redis.set(tokenKey(token), '1', 'EX', TOKEN_TTL)
    await Redis.del(errorKey)
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token: token,
      },
    })
  } else if (!passwordOk) {
    const attempts = await Redis.incr(errorKey)
    if (attempts === 1) await Redis.expire(errorKey, 60)
    res.json({
      success: false,
      message: '密码错误',
    })
  } else {
    res.json({
      success: false,
      message: 'TOTP 验证码错误',
    })
  }
}

// 退出登录
const handleExitLogin = async (req, res) => {
  const token = getBearerToken(req)
  const revoked = await isTokenValid(token)
  if (revoked) await revokeToken(token)
  res.json({
    success: true,
    message: revoked ? '退出登录成功' : '已退出登录',
  })
}

export const handle2FA = async (req, res) => {
  const auth = await validateToken(req)
  if (!auth.valid) {
    return res.status(401).json({
      success: false,
      message: auth.error,
    })
  }
  const { action } = req.query

  try {
    // 获取 TOTP 双因素认证状态
    if (action === 'status') {
      return await handleGetTotpStatus(req, res)
    }

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
      message: error.message,
    })
  }
}

const handleGetTotpStatus = async (req, res) => {
  res.json({
    success: true,
    data: {
      enabled: isTotpEnabled(),
    },
  })
}

const handleCreateTotp = async (req, res) => {
  if (isTotpEnabled()) {
    return res.status(409).json({
      success: false,
      message: 'TOTP 双因素认证已启用',
    })
  }
  const secret = TwoFactorAuth.generateSecret()
  await Redis.set('Mozu:panel:totp:secret', secret.base32, 'EX', 300)
  res.json({
    success: true,
    data: {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url,
    },
  })
}

const handleEnableTotp = async (req, res) => {
  if (isTotpEnabled()) {
    return res.status(409).json({
      success: false,
      message: 'TOTP 双因素认证已启用',
    })
  }
  const secret = await Redis.get('Mozu:panel:totp:secret')
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
      message: 'TOTP 验证码错误',
    })
  }
  const saved = saveTotpConfig(true, secret)
  if (!saved) {
    return res.json({
      success: false,
      message: 'TOTP 配置写入失败，请检查 config/panel 目录权限',
    })
  }
  await Redis.del('Mozu:panel:totp:secret')
  res.json({
    success: true,
    message: 'TOTP 双因素认证启用成功',
  })
}

const handleDeleteTotp = async (req, res) => {
  if (!isTotpEnabled()) {
    return res.json({
      success: false,
      message: 'TOTP 双因素认证未启用',
    })
  }
  const ok = TwoFactorAuth.verifyToken(Config.panel.login.totp.secret, req.body.token)
  if (!ok) {
    return res.json({
      success: false,
      message: 'TOTP 验证码错误',
    })
  }
  const saved = saveTotpConfig(false, '')
  if (!saved) {
    return res.json({
      success: false,
      message: 'TOTP 配置写入失败，请检查 config/panel 目录权限',
    })
  }
  res.json({
    success: true,
    message: 'TOTP 双因素认证关闭成功',
  })
}

function isTotpEnabled() {
  return Config.panel.login.totp?.enabled === true
}

function saveTotpConfig(enabled, secret) {
  const okEnabled = Config.modify('panel', 'login', 'totp.enabled', enabled)
  const okSecret = Config.modify('panel', 'login', 'totp.secret', secret)
  return okEnabled && okSecret
}

async function validateToken(req) {
  const token = getBearerToken(req)
  if (!token) {
    return { valid: false, error: '未登录，请先登录' }
  }
  try {
    if (!(await isTokenValid(token))) {
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
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * 取客户端 IP 用于限流
 * @param {import('express').Request} req
 */
function getIP(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown'
}
