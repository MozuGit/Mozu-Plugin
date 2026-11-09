const TOKEN_KEY = 'token'

let onUnauthorized = null

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'API_ERROR', body, cause } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.body = body
    this.cause = cause
  }
}

/**
 * 判断是否为登录失效错误
 * @param {unknown} error
 * @returns {boolean}
 */
export function isUnauthorized(error) {
  return error?.code === 'UNAUTHORIZED'
}

/**
 * 发起请求并返回完整响应体
 * @param {string} url
 * @param {RequestInit & { auth?: boolean }} [options]
 * @returns {Promise<any>}
 */
export async function requestRaw(url, options = {}) {
  const { auth = true, headers: customHeaders, ...rest } = options
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders
  }

  if (auth) {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const config = { ...rest, headers }
  const isFormData = typeof FormData !== 'undefined' && config.body instanceof FormData
  if (config.body && typeof config.body === 'object' && !isFormData) {
    config.body = JSON.stringify(config.body)
  }

  let res
  try {
    res = await fetch(url, config)
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError('网络错误，请重试', { code: 'NETWORK_ERROR', cause: error })
  }

  const body = await res.json().catch(() => null)

  if (res.status === 401) {
    if (auth) {
      localStorage.removeItem(TOKEN_KEY)
      onUnauthorized?.()
    }
    throw new ApiError('未授权', { status: 401, code: 'UNAUTHORIZED', body })
  }

  if (!res.ok) {
    throw new ApiError(body?.message || `请求失败（${res.status}）`, {
      status: res.status,
      code: 'HTTP_ERROR',
      body
    })
  }

  return body
}

/**
 * 发起请求并直接返回 data
 * @param {string} url
 * @param {RequestInit & { auth?: boolean }} [options]
 * @returns {Promise<any>}
 */
export async function request(url, options) {
  const body = await requestRaw(url, options)
  if (!body?.success) {
    throw new ApiError(body?.message || '操作失败', { code: 'BUSINESS_ERROR', body })
  }
  return body.data !== undefined ? body.data : body
}

export { TOKEN_KEY }
