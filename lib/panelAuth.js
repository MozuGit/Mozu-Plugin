import Redis from '#Redis'

/**
 * 面板登录令牌。
 */

/** 登录令牌有效期（秒），默认 7 天 */
export const TOKEN_TTL = 60 * 60 * 24 * 7

/** 单个 IP 连续密码错误上限 */
export const MAX_PASSWORD_ATTEMPTS = 10

/** 单次验证码允许的尝试次数 */
export const MAX_CODE_ATTEMPTS = 5

/**
 * @param {string} token
 * @returns {string} Redis 键名
 */
export function tokenKey(token) {
  return `Mozu:panel:token:${token}`
}

/**
 * 从请求头取出 Bearer token
 * @param {import('express').Request} req
 * @returns {string} 空字符串表示没有合法 token
 */
export function getBearerToken(req) {
  const authHeader = req?.headers?.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return ''
  return authHeader.substring(7).trim()
}

/**
 * 校验令牌是否有效（存在即有效，过期由 TTL 负责）
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export async function isTokenValid(token) {
  if (!token) return false
  return (await Redis.exists(tokenKey(token))) === 1
}

/**
 * 注销令牌
 * @param {string} token
 */
export async function revokeToken(token) {
  if (!token) return
  await Redis.del(tokenKey(token))
}
