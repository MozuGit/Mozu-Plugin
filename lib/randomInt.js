import seedrandom from "seedrandom"

const rngCache = new Map()
const MAX_CACHE_SIZE = 1000

/**
 * 生成随机整数
 * @param {number} max - 最大值
 * @param {number} min - 最小值
 * @param {string|number} id - 玩家ID
 * @returns {number}
 */
function randomInt(max, min, id) {
  const timeSlot = Date.now()
  const seed = `${id}_${timeSlot}`
  
  let rng = rngCache.get(seed)
  if (!rng) {
    rng = seedrandom(seed)
    rngCache.set(seed, rng)
    
    if (rngCache.size > MAX_CACHE_SIZE) {
      const firstKey = rngCache.keys().next().value
      rngCache.delete(firstKey)
    }
  }
  
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(rng() * (max - min + 1)) + min
}

export default randomInt