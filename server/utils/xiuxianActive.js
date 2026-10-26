const ACTIVE_KEY_PREFIX = 'Mozu:xiuxian:active:'

/** 面板支持的活跃统计区间 */
export const ACTIVE_RANGE_VALUES = [7, 10, 14, 30, 365]

/**
 * 解析前端传入的统计区间
 * @param {unknown} value
 * @returns {number|null}
 */
export function parseActiveRange(value) {
  const range = Number.parseInt(value, 10)
  return ACTIVE_RANGE_VALUES.includes(range) ? range : null
}

/**
 * 本地时区的 YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export function formatDay(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 本地时区的 YYYY-MM
 * @param {Date} date
 * @returns {string}
 */
export function formatMonth(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * 某个月份的全部日期键（当月天数按本地时区计算）
 * @param {number} year
 * @param {number} monthIndex 0-11
 * @returns {string[]}
 */
export function getMonthDayKeys(year, monthIndex) {
  const total = new Date(year, monthIndex + 1, 0).getDate()
  const keys = []
  for (let day = 1; day <= total; day++) {
    keys.push(`${ACTIVE_KEY_PREFIX}${formatDay(new Date(year, monthIndex, day, 12))}`)
  }
  return keys
}

/**
 * 读取最近 N 天的活跃人数（按日期从旧到新）
 * @param {{ pipeline: () => any }} redis
 * @param {number} range
 * @param {Date} [now]
 * @returns {Promise<Array<{date: string, label: string, active: number, type: 'day'}>>}
 */
export async function buildDailyTrend(redis, range, now = new Date()) {
  const pipeline = redis.pipeline()
  const days = []
  for (let offset = range - 1; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset, 12)
    days.push(date)
    pipeline.scard(`${ACTIVE_KEY_PREFIX}${formatDay(date)}`)
  }
  const results = await pipeline.exec()

  return results.map(([error, count], index) => {
    const day = formatDay(days[index])
    return {
      date: day,
      label: day.slice(5),
      active: error ? 0 : Number(count) || 0,
      type: 'day',
    }
  })
}

/**
 * 读取最近 12 个月的月活跃人数（按自然月去重，从旧到新）
 * @param {{ pipeline: () => any }} redis
 * @param {Date} [now]
 * @returns {Promise<Array<{date: string, label: string, active: number, type: 'month'}>>}
 */
export async function buildMonthlyTrend(redis, now = new Date()) {
  const months = []
  for (let offset = 11; offset >= 0; offset--) {
    months.push(new Date(now.getFullYear(), now.getMonth() - offset, 1, 12))
  }

  const pipeline = redis.pipeline()
  for (const month of months) {
    pipeline.sunion(...getMonthDayKeys(month.getFullYear(), month.getMonth()))
  }
  const results = await pipeline.exec()

  return results.map(([error, members], index) => {
    const key = formatMonth(months[index])
    return {
      date: key,
      label: key,
      active: error || !Array.isArray(members) ? 0 : members.length,
      type: 'month',
    }
  })
}

/**
 * 统计区间内的平均值
 * @param {Array<{active: number}>} trend
 * @returns {number}
 */
export function getTrendAverage(trend) {
  if (!Array.isArray(trend) || trend.length === 0) return 0
  const total = trend.reduce((sum, item) => sum + (Number(item.active) || 0), 0)
  return Math.round(total / trend.length)
}

/**
 * 昨日 00:00 到今日 00:00 的秒级时间戳区间
 * @param {Date} [now]
 * @returns {{start: number, end: number}}
 */
export function getYesterdayRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return {
    start: Math.floor(start.getTime() / 1000),
    end: Math.floor(end.getTime() / 1000),
  }
}

/**
 * 统计昨日新注册的修仙玩家数
 * @param {{ pipeline: () => any }} redis
 * @param {number} playerCount
 * @param {Date} [now]
 * @returns {Promise<number>}
 */
export async function countNewPlayers(redis, playerCount, now = new Date()) {
  const total = Number(playerCount)
  if (!Number.isInteger(total) || total <= 0) return 0

  const { start, end } = getYesterdayRange(now)
  const pipeline = redis.pipeline()
  for (let id = 1; id <= total; id++) {
    pipeline.hget(`Mozu:xiuxian:playerInfo:${id}`, '注册时间')
  }
  const results = await pipeline.exec()

  let count = 0
  for (const [error, value] of results) {
    if (error || value == null || value === '') continue
    const timestamp = Number(value)
    if (timestamp >= start && timestamp < end) {
      count += 1
    }
  }
  return count
}
