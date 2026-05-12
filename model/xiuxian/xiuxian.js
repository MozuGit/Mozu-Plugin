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
    const cult = parseInt(await Redis.hget('Mozu:xiuxian:playerInfo:' + id, '修为'), 10)
    const ls = parseInt(await Redis.hget('Mozu:xiuxian:playerInfo:' + id, '灵石'), 10)
    const realm = parseInt(await Redis.hget('Mozu:xiuxian:playerInfo:' + id, '境界'), 10)
    const signNum = parseInt(await Redis.hget('Mozu:xiuxian:playerInfo:' + id, '签到次数'), 10)
    const realmName = await Realm.getRealmName(realm)
    const realmName2 = await Realm.getRealmName(realm + 1)
    const realmNeedExp = await Realm.getNextExp(cult, realm)
    const sex = await Redis.hget('Mozu:xiuxian:playerInfo:' + id, '性别')
    const title = await Redis.hget('Mozu:xiuxian:playerInfo:' + id, '称号')
    const sectId = await Redis.hget('Mozu:xiuxian:playerInfo:' + id, '宗门ID') || "无"
    const sectName = await Redis.hget(`Mozu:xiuxian:sectInfo:${sectId}`, '宗门名称') || '无'
    return { cult, ls, signNum, realm, realmName, realmName2, realmNeedExp, sex, title, sectId, sectName }
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