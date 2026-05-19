import Redis from "#Redis"
import randomInt from "#randomInt"
import Realm from "./tool/realm.js"
import { Config } from "./tool/Config/Config.js"

const PLAYER_INFO_KEY = "Mozu:xiuxian:playerInfo"

export default new class {
  async init(openid) {
    const exists = await Redis.hget('Mozu:xiuxian:openid:forward', openid)
    if (!exists) {
      const id = await Redis.incr('Mozu:xiuxian:openid:counter')
      Redis.hset('Mozu:xiuxian:openid:forward', openid, id)
      Redis.hset('Mozu:xiuxian:openid:reverse', id, openid)
      Redis.hset(`${PLAYER_INFO_KEY}:${id}`, {
        修为: 0,
        灵石: 0,
        境界: 0,
        称号: "无",
        性别: "未设置",
        宗门ID: "",
        签到次数: 0,
        注册时间: Math.floor(Date.now() / 1000)
      })
      return id
    }
    return exists
  }

  async getUserInfo(id) {
    const key = `${PLAYER_INFO_KEY}:${id}`
    const [cult, ls, realm, signNum, retreatStartTime, sex, title, sectId] = await Redis.hmget(key, '修为', '灵石', '境界', '签到次数', '闭关时间', '性别', '称号', '宗门ID')
    const cultNum = parseInt(cult, 10) || 0
    const lsNum = parseInt(ls, 10) || 0
    const realmNum = parseInt(realm, 10) || 0
    const signNumVal = parseInt(signNum, 10) || 0
    const retreatStartTimeNum = parseInt(retreatStartTime, 10) || 0
    
    const realmName = await Realm.getRealmName(realmNum)
    const realmName2 = await Realm.getRealmName(realmNum + 1)
    const realmNeedExp = await Realm.getNextExp(cultNum, realmNum)
    const retreatRunTime = getStringTime(Math.floor(Date.now() / 1000) - retreatStartTimeNum)
    const power = await this.getPower(id)

    const sectInfo = await this.getSectInfo(sectId)
    const realms = {
      realm: realmNum, 
      realmName, 
      realmName2, 
      realmNeedExp, 
    }
    const retreat = {
      startTime: retreatStartTimeNum, 
      runTime: retreatRunTime,
      profit: getProfit(Math.floor(Date.now() / 1000) - retreatStartTimeNum)
    }
    
    return { 
        cult: cultNum, 
        ls: lsNum, 
        signNum: signNumVal, 
        realm: realms,
        sex: sex || '未设置', 
        title: title || '无', 
        sectInfo,
        retreat,
        power
    }
  }

  async getSectInfo(sectId) {
    const sectName = await Redis.hget(`Mozu:xiuxian:sectInfo:${sectId}`, '宗门名称') || '无'
    return {
      sectId,
      sectName: sectName || "无"
    }
  }

  async getPower(id) {
    const key = `${PLAYER_INFO_KEY}:${id}`
    let [cult, realm] = await Redis.hmget(key, '修为', '境界')
    cult = parseInt(cult, 10)
    realm = parseInt(realm, 10) || 0.75
    const power = Math.floor(realm * (cult / 100))
    return power
  }

  async xiulian(id) {
    let [cult, last, retreatStart] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id}`, '修为', '上次修炼时间', '闭关时间')
    cult = parseInt(cult, 10)
    last = parseInt(last, 10)
    retreatStart = parseInt(retreatStart, 10) || 0
    if (retreatStart !== 0) {
      return { retreat: true }
    }
    if (Math.floor(Date.now() / 1000) - last <= Config.xiuxian.xiulian) {
      const outTime = Config.xiuxian.xiulian - (Math.floor(Date.now() / 1000) - last)
      return { outTime }
    }
    let addcult = randomInt(Config.xiuxian.maxcult, Config.xiuxian.mincult, id)
    cult += addcult
    Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
      修为: cult,
      上次修炼时间: Math.floor(Date.now() / 1000)
    })
    return { cult, addcult }
  }

  async kaicai(id) {
    let [ls, last, retreatStart] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id}`, '灵石', '上次开采时间', '闭关时间')
    ls = parseInt(ls, 10)
    last = parseInt(last, 10)
    retreatStart = parseInt(retreatStart, 10) || 0
    if (retreatStart !== 0) {
      return { retreat: true }
    }
    if (Math.floor(Date.now() / 1000) - last <= Config.xiuxian.kaicai) {
      const outTime = Config.xiuxian.kaicai - (Math.floor(Date.now() / 1000) - last)
      return { outTime }
    }
    let addls = randomInt(Config.xiuxian.maxls, Config.xiuxian.minls, id)
    ls += addls
    Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
      灵石: ls,
      上次开采时间: Math.floor(Date.now() / 1000)
    })
    return { ls, addls }
  }

  async sign(id) {
    let [cult, ls, signCount, lastDay] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id}`, ['修为', '灵石', '签到次数', '上次签到时间'])
    let { cult: addcult, ls: addls } = Config.xiuxian.sign
    const today = gettoday()
    if (lastDay && lastDay === today) return false
    cult = parseInt(cult, 10) + addcult
    ls = parseInt(ls, 10) + addls
    signCount = parseInt(signCount, 10) + 1
    await Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
      修为: cult,
      灵石: ls,
      签到次数: signCount,
      上次签到时间: today
    })
    return { addcult, addls, today }
  }

  async realmUp(id) {
    const retreatStart = parseInt(await Redis.hget(`${PLAYER_INFO_KEY}:${id}`, '闭关时间'), 10)
    if (retreatStart !== 0) {
      return { retreat: true }
    }
    return await Realm.realmUp(id)
  }

  async startRetreat(id) {
    const retreatStart = parseInt(await Redis.hget(`${PLAYER_INFO_KEY}:${id}`, '闭关时间')) || 0
    if (retreatStart === 0) {
      const time = Math.floor(Date.now() / 1000)
      Redis.hset(`${PLAYER_INFO_KEY}:${id}`, '闭关时间', time)
      return time
    } else {
      return false
    }
  }

  async stopRetreat(id) {
    let [cult, retreatStart] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id}`, '修为', '闭关时间')
    cult = parseInt(cult, 10)
    retreatStart = parseInt(retreatStart, 10) || 0
    const time = Math.floor(Date.now() / 1000) - retreatStart
    if (retreatStart === 0) {
      return false
    } else {
      const profit = getProfit(time)
      cult = cult + profit.cult
      Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
        修为: cult,
        闭关时间: 0
      })
      return {
        cult: getProfit(time).cult,
        retreatStart,
        retreatRunTime: getStringTime(time)
      }
    }
  }

  async pvp(id, id2) {
    if (id === id2) {
      return {
        event: "self_pvp"
      }
    }
    if ((await Redis.exists(`${PLAYER_INFO_KEY}:${id2}`)) === 0) {
      return {
        event: "not_id"
      }
    }
    let [cult, retreatStart, pvp_cd] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id}`, '修为', '闭关时间', '切磋冷却')
    cult = parseInt(cult, 10)
    retreatStart = parseInt(retreatStart, 10) || 0
    pvp_cd = parseInt(pvp_cd, 10) || 0
    if (retreatStart !== 0) {
      return {
        event: "in_retreat",
        data: {
          event_id: id
        }
      }
    } else if (cult < 5000) {
      return {
        event: "cult_lack",
        data: {
          event_id: id,
          cult: cult
        }
      }
    } else if ((Math.floor(Date.now() / 1000) - pvp_cd) <= Config.xiuxian.pvp.atk_cd) {
      return {
        event: "pvp_cd",
        data: {
          event_id: id,
          pvp_cd: Config.xiuxian.pvp.atk_cd - (Math.floor(Date.now() / 1000) - pvp_cd)
        }
      }
    }
    [cult, retreatStart, pvp_cd] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id2}`, '修为', '闭关时间', '切磋冷却')
    cult = parseInt(cult, 10)
    retreatStart = parseInt(retreatStart, 10) || 0
    pvp_cd = parseInt(pvp_cd, 10) || 0
    if (retreatStart !== 0) {
      return {
        event: "in_retreat",
        data: {
          event_id: id2
        }
      }
    } else if (cult < 5000) {
      return {
        event: "cult_lack",
        data: {
          event_id: id2,
          cult: cult
        }
      }
    } else if ((Math.floor(Date.now() / 1000) - pvp_cd) <= Config.xiuxian.pvp.def_cd) {
      return {
        event: "pvp_cd",
        data: {
          event_id: id2,
          pvp_cd: Config.xiuxian.pvp.def_cd - (Math.floor(Date.now() / 1000) - pvp_cd)
        }
      }
    }
    const powerA = await this.getPower(id)
    const powerB = await this.getPower(id2)
    const baseWinRate = powerA / (powerA + powerB)
    const randomFactor = 0.95 + Math.random() * 0.1
    let finalWinRate = baseWinRate * randomFactor
    finalWinRate = Math.max(0.01, Math.min(0.99, finalWinRate))
    const roll = Math.random()
    const isAWin = roll < finalWinRate
    const cultAddA = randomInt(1000, 5000, id)
    const cultAddB = randomInt(1000, 5000, id2)
    const cultA = parseInt(await Redis.hget(`${PLAYER_INFO_KEY}:${id}`, '修为'), 10)
    const cultB = parseInt(await Redis.hget(`${PLAYER_INFO_KEY}:${id2}`, '修为'), 10)
    if (isAWin) {
      Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
        修为: cultA + cultAddA,
        切磋冷却: Math.floor(Date.now() / 1000)
      })
      Redis.hmset(`${PLAYER_INFO_KEY}:${id2}`, {
        修为: cultB - cultAddB,
        被切磋冷却: Math.floor(Date.now() / 1000)
      })
    } else {
      Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
        修为: cultA - cultAddA,
        切磋冷却: Math.floor(Date.now() / 1000)
      })
      Redis.hmset(`${PLAYER_INFO_KEY}:${id2}`, {
        修为: cultB + cultAddB,
        被切磋冷却: Math.floor(Date.now() / 1000)
      })
    }
    return {
      winner: isAWin,
      powerA,
      powerB,
      cultA: cultAddA,
      cultB: cultAddB,
      finalWinRate
    }
  }
}

function gettoday() {
  const currentDate = new Date();
  const year = currentDate.getFullYear()
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  const day = currentDate.getDate().toString().padStart(2, '0')
  const date_time = `${year}-${month}-${day}`
  return date_time
}

function getStringTime(time) {
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = time % 60
  const timeText = `${hours}小时${minutes}分${seconds}秒`
  return timeText
}

function getProfit(time) {
  let hours = Math.floor(time / 3600)
  const hoursMax = parseInt(Config.xiuxian.retreat.max, 10)
  if (hoursMax !== 0) {
    if (hours > hoursMax) {
      hours = hoursMax
    }
  }
  const cult = hours * parseInt(Config.xiuxian.retreat.cult, 10)
  return { cult }
}