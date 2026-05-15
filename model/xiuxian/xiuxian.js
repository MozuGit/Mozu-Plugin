import Redis from "#Redis"
import { Config } from "./tool/Config/Config.js"
import Realm from "./tool/realm.js"

export default new class {
  async init(openid) {
    const exists = await Redis.hget('Mozu:xiuxian:openid:forward', openid)
    if (!exists) {
      let id = parseInt(await Redis.get('Mozu:xiuxian:openid:counter') || '0')
      await Redis.set('Mozu:xiuxian:openid:counter', ++id)
      Redis.hset('Mozu:xiuxian:openid:forward', openid, id)
      Redis.hset('Mozu:xiuxian:openid:reverse', openid, id)
      Redis.hset(`Mozu:xiuxian:playerInfo:${id}`, {
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
    const key = `Mozu:xiuxian:playerInfo:${id}`
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
    const key = `Mozu:xiuxian:playerInfo:${id}`
    const [cult, realm] = await Redis.hmget(key, '修为', '境界')
    const power = Math.floor(parseInt(realm ?? "0.5", 10) * (parseInt(cult, 10) / 100))
    return power
  }

  async xiulian(id) {
    const last = parseInt(await Redis.hget('Mozu:xiuxian:playerInfo:' + id, '上次修炼时间'), 10)
    if (Math.floor(Date.now() / 1000) - last <= Config.xiuxian.xiulian) {
      const outTime = Config.xiuxian.xiulian - (Math.floor(Date.now() / 1000) - last)
      return { outTime }
    }
    let cult = parseInt(await Redis.hget('Mozu:xiuxian:playerInfo:' + id, '修为'), 10)
    let addcult = randomInt(Config.xiuxian.maxcult, Config.xiuxian.mincult, id)
    cult += addcult
    Redis.hset('Mozu:xiuxian:playerInfo:' + id, '修为', cult)
    Redis.hset('Mozu:xiuxian:playerInfo:' + id, '上次修炼时间', Math.floor(Date.now() / 1000))
    return { cult, addcult }
  }

  async kaicai(id) {
    const last = parseInt(await Redis.hget('Mozu:xiuxian:playerInfo:' + id, '上次开采时间'), 10)
    if (Math.floor(Date.now() / 1000) - last <= Config.xiuxian.kaicai) {
      const outTime = Config.xiuxian.kaicai - (Math.floor(Date.now() / 1000) - last)
      return { outTime }
    }
    let ls = parseInt(await Redis.hget('Mozu:xiuxian:playerInfo:' + id, '灵石'), 10)
    let addls = randomInt(Config.xiuxian.maxls, Config.xiuxian.minls, id)
    ls += addls
    Redis.hset('Mozu:xiuxian:playerInfo:' + id, '灵石', ls)
    Redis.hset('Mozu:xiuxian:playerInfo:' + id, '上次开采时间', Math.floor(Date.now() / 1000))
    return { ls, addls }
  }

  async sign(id) {
    let values = await Redis.hmget('Mozu:xiuxian:playerInfo:' + id, ['修为', '灵石', '签到次数', '上次签到时间'])
    let { cult: addcult, ls: addls } = Config.xiuxian.sign
    const today = gettoday()
    if (values[3] && values[3] === today) return false
    const cult = parseInt(values[0]) + addcult
    const ls = parseInt(values[1]) + addls
    const sign = parseInt(values[2]) + 1
    await Redis.hmset('Mozu:xiuxian:playerInfo:' + id, {
      修为: cult,
      灵石: ls,
      签到次数: sign,
      上次签到时间: today
    })
    return { addcult, addls, today }
  }

  async realmUp(id) {
    return await Realm.realmUp(id)
  }

  async startRetreat(id) {
    const retreatStart = parseInt(await Redis.hget(`Mozu:xiuxian:playerInfo:${id}`, '闭关时间')) || 0
    if (retreatStart === 0) {
      const time = Math.floor(Date.now() / 1000)
      Redis.hset(`Mozu:xiuxian:playerInfo:${id}`, '闭关时间', time)
      return time
    } else {
      return false
    }
  }

  async stopRetreat(id) {
    let [ cult, retreatStart ] = await Redis.hmget(`Mozu:xiuxian:playerInfo:${id}`, '修为', '闭关时间') || 0
    cult = parseInt(cult, 10)
    retreatStart = parseInt(retreatStart, 10) || 0
    const time = Math.floor(Date.now() / 1000) - retreatStart
    if (retreatStart === 0) {
      return false
    } else {
      cult = cult + getProfit(time)
      Redis.hmset(`Mozu:xiuxian:playerInfo:${id}`, {
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

}

function randomInt(min, max, id) {
  let random = (Date.now() * id * 9301 + 49297) % 233280
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(random / 233280 * (max - min + 1)) + min
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