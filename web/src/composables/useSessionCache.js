/**
 * sessionStorage 列表缓存
 * @param {string} key
 * @param {number} [ttl]
 * @returns {{ read: () => any, write: (value: any) => void, clear: () => void }}
 */
export function useSessionCache(key, ttl = 5 * 60 * 1000) {
  const timeKey = `${key}:time`

  const read = () => {
    try {
      const raw = sessionStorage.getItem(key)
      const at = Number(sessionStorage.getItem(timeKey))
      if (!raw || !at || Date.now() - at > ttl) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  const write = (value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
      sessionStorage.setItem(timeKey, String(Date.now()))
    } catch {
      // 缓存失败不影响主流程
    }
  }

  const clear = () => {
    try {
      sessionStorage.removeItem(key)
      sessionStorage.removeItem(timeKey)
    } catch {
      // 忽略
    }
  }

  return { read, write, clear }
}
