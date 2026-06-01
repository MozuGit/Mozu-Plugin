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
      return {
        event: "user_init",
        data: {
          id: parseInt(id, 10)
        }
      }
    }
    return {
      event: "user_login",
      data: {
        id: parseInt(exists, 10)
      }
    }
  }

  async hasPlayer(openid) {
    const exists = await Redis.hget('Mozu:xiuxian:openid:forward', openid)
    return !!exists
  }

  async getUserInfo(id) {
    const key = `${PLAYER_INFO_KEY}:${id}`
    if ((await Redis.exists(`${PLAYER_INFO_KEY}:${id}`)) === 0) {
      return false
    }
    let [cult, ls, realm, signNum, retreatStartTime, sex, title, sectId] = await Redis.hmget(key, '修为', '灵石', '境界', '签到次数', '闭关时间', '性别', '称号', '宗门ID')
    cult = parseInt(cult, 10) || 0
    ls = parseInt(ls, 10) || 0
    realm = parseInt(realm, 10) || 0
    signNum = parseInt(signNum, 10) || 0
    retreatStartTime = parseInt(retreatStartTime, 10) || 0
    sectId = parseInt(sectId, 10) || 0

    const realmName = await Realm.getRealmName(realm)
    const realmName2 = await Realm.getRealmName(realm + 1)
    const realmNeedExp = await Realm.getNextExp(cult, realm)
    const retreatRunTime = getStringTime(Math.floor(Date.now() / 1000) - retreatStartTime)
    const power = await this.getPower(id)

    let sectInfo
    if (sectId !== 0) {
      sectInfo = await this.getSectInfo(sectId)
    } else {
      sectInfo = {
        id: 0
      }
    }

    const realms = {
      realm: realm,
      realmName,
      realmName2,
      realmNeedExp,
    }
    const retreat = {
      startTime: retreatStartTime,
      runTime: retreatRunTime,
      profit: getProfit(Math.floor(Date.now() / 1000) - retreatStartTime)
    }

    return {
      cult,
      ls,
      signNum,
      realm: realms,
      sex: sex || '未设置',
      title: title || '无',
      sectInfo,
      retreat,
      power
    }
  }

  async getSectInfo(sectId) {
    if ((await Redis.exists(`Mozu:xiuxian:sectInfo:${sectId}`)) === 0) {
      return false
    }
    const [name, desc, members, owner, exp, level, max] = await Redis.hmget(`Mozu:xiuxian:sectInfo:${sectId}`, '宗门名称', '宗门简介', '宗门成员', '宗门宗主', '宗门经验', '宗门等级', '宗门人数上限')
    const sectUpExp = Config.sect.sect_up_exp
    const nextExp = (sectUpExp.length <= level) ? sectUpExp[sectUpExp.length - 1] : sectUpExp[level - 1]
    return {
      id: sectId,
      name,
      desc,
      member: JSON.parse(members).length,
      owner,
      exp,
      level,
      max,
      nextExp
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
      return {
        event: "in_retreat"
      }
    }
    if (Math.floor(Date.now() / 1000) - last <= Config.xiuxian.xiulian) {
      const outTime = Config.xiuxian.xiulian - (Math.floor(Date.now() / 1000) - last)
      return {
        event: "xiulian_cd",
        data: {
          outTime
        }
      }
    }
    const addcult = randomInt(Config.xiuxian.maxcult, Config.xiuxian.mincult, id)
    cult += addcult
    Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
      修为: cult,
      上次修炼时间: Math.floor(Date.now() / 1000)
    })
    return {
      event: "xiulian_end",
      data: {
        cult,
        addcult
      }
    }
  }

  async kaicai(id) {
    let [ls, last, retreatStart] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id}`, '灵石', '上次开采时间', '闭关时间')
    ls = parseInt(ls, 10)
    last = parseInt(last, 10)
    retreatStart = parseInt(retreatStart, 10) || 0
    if (retreatStart !== 0) {
      return {
        event: "in_retreat"
      }
    }
    if (Math.floor(Date.now() / 1000) - last <= Config.xiuxian.kaicai) {
      const outTime = Config.xiuxian.kaicai - (Math.floor(Date.now() / 1000) - last)
      return {
        event: "kaicai_cd",
        data: {
          outTime
        }
      }
    }
    let addls = randomInt(Config.xiuxian.maxls, Config.xiuxian.minls, id)
    ls += addls
    Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
      灵石: ls,
      上次开采时间: Math.floor(Date.now() / 1000)
    })
    return {
      event: "kaicai_end",
      data: {
        ls,
        addls
      }
    }
  }

  async sign(id) {
    let [cult, ls, signCount, lastDay] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id}`, ['修为', '灵石', '签到次数', '上次签到时间'])
    let { cult: addcult, ls: addls } = Config.xiuxian.sign
    const today = gettoday()
    if (lastDay && lastDay === today) {
      return {
        event: "is_signed"
      }
    }
    cult = parseInt(cult, 10) + addcult
    ls = parseInt(ls, 10) + addls
    signCount = parseInt(signCount, 10) + 1
    await Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
      修为: cult,
      灵石: ls,
      签到次数: signCount,
      上次签到时间: today
    })
    return {
      event: "sign_in_success",
      data: {
        addcult,
        addls
      }
    }
  }

  async realmUp(id) {
    const retreatStart = parseInt(await Redis.hget(`${PLAYER_INFO_KEY}:${id}`, '闭关时间'), 10) || 0
    if (retreatStart !== 0) {
      return {
        event: "in_retreat"
      }
    }
    return await Realm.realmUp(id)
  }

  async startRetreat(id) {
    const retreatStart = parseInt(await Redis.hget(`${PLAYER_INFO_KEY}:${id}`, '闭关时间')) || 0
    if (retreatStart === 0) {
      const time = Math.floor(Date.now() / 1000)
      Redis.hset(`${PLAYER_INFO_KEY}:${id}`, '闭关时间', time)
      return {
        event: "start_retreat",
        data: {
          time
        }
      }
    } else {
      return {
        event: "in_retreat"
      }
    }
  }

  async stopRetreat(id) {
    let [cult, retreatStart] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id}`, '修为', '闭关时间')
    cult = parseInt(cult, 10)
    retreatStart = parseInt(retreatStart, 10) || 0
    const time = Math.floor(Date.now() / 1000) - retreatStart
    if (retreatStart === 0) {
      return {
        event: "not_retreat"
      }
    } else {
      const profit = getProfit(time)
      cult = cult + profit.cult
      Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
        修为: cult,
        闭关时间: 0
      })
      return {
        event: "end_retreat",
        data: {
          addcult: getProfit(time).cult,
          retreatStart,
          retreatRunTime: getStringTime(time)
        }
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
        event: "not_id",
        data: {
          event_id: id2
        }
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
        event: "lack_cult",
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
      event: "pvp_end",
      data: {
        winner: isAWin,
        powerA,
        powerB,
        cultA: cultAddA,
        cultB: cultAddB,
        finalWinRate
      }
    }
  }

  async getRank(id, type) {
    const pipeline = Redis.pipeline()
    const idNum = parseInt(await Redis.get('Mozu:xiuxian:openid:counter'))
    switch (type) {
      case '修为':
      case '灵石':
        for (let i = 0; i < idNum; i++) {
          pipeline.hget(`${PLAYER_INFO_KEY}:${i}`, type)
        }
        break
      case '战力':
        for (let i = 0; i < idNum; i++) {
          pipeline.hmget(`${PLAYER_INFO_KEY}:${i}`, '修为', '境界')
        }
        break
      case '闭关':
        for (let i = 0; i < idNum; i++) {
          pipeline.hget(`${PLAYER_INFO_KEY}:${i}`, '闭关时间')
        }
        break
    }
    const results = await pipeline.exec()
    const players = []
    switch (type) {
      case '修为':
      case '灵石':
        for (let i = 0; i < idNum; i++) {
          const value = parseInt(results[i][1], 10)
          if (value > 0) {
            players.push({
              id: i,
              value: value
            })
          }
        }
        break
      case '战力':
        for (let i = 0; i < idNum; i++) {
          const cult = parseInt(results[i][1], 10)
          const realm = parseInt(results[i][2], 10) || 0.75
          const value = Math.floor(realm * (cult / 100))
          if (value > 0) {
            players.push({
              id: i,
              value: value
            })
          }
        }
        break
      case '闭关':
        const time = Math.floor(Date.now() / 1000)
        for (let i = 0; i < idNum; i++) {
          const retreat = parseInt(results[i][1], 10)
          if (retreat > 0) {
            const value = time - retreat
            players.push({
              id: i,
              value: value
            })
          }
        }
        break
    }

    players.sort((a, b) => b.value - a.value)
    const top10Players = players.slice(0, 10)
    const allRanks = top10Players.map((player, index) => ({
      rank: index + 1,
      id: player.id,
      value: player.value
    }))
    const targetPlayer = players.find(p => p.id === id)
    if (!targetPlayer) {
      return {
        event: "success",
        data: {
          ranks: allRanks
        }
      }
    }
    const rank = players.findIndex(p => p.id === id) + 1
    return {
      event: "success",
      data: {
        rank: rank,
        ranks: allRanks,
        cult: targetPlayer.value,
      }
    }
  }

  async createSect(id) {
    let [ls, sectId, retreatStart] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id}`, '灵石', '宗门ID', '闭关时间')
    ls = parseInt(ls, 10)
    sectId = parseInt(sectId, 10) || 0
    retreatStart = parseInt(retreatStart, 10) || 0
    if (retreatStart !== 0) {
      return {
        event: "in_retreat"
      }
    }
    if (sectId !== 0) {
      return {
        event: "in_sect",
        data: {
          sectId
        }
      }
    }
    if (ls >= Config.sect.create_sect_ls) {
      const sectCount = await Redis.incr('Mozu:xiuxian:sectid:counter')
      Redis.hmset(`Mozu:xiuxian:sectInfo:${sectCount}`, {
        宗门名称: "修仙宗门",
        宗门简介: "未设置",
        宗门成员: JSON.stringify([id]),
        宗门宗主: id,
        宗门经验: 0,
        宗门等级: 1,
        宗门人数上限: 20
      })
      Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
        灵石: ls - Config.sect.create_sect_ls,
        宗门ID: sectCount
      })
      return {
        event: "create_sect",
        data: {
          sectId: sectCount
        }
      }
    } else {
      return {
        event: "lack_ls",
        data: {
          ls
        }
      }
    }
  }

  async joinSect(id, joinID) {
    let sectId = parseInt(await Redis.hget(`${PLAYER_INFO_KEY}:${id}`, '宗门ID'), 10) || 0
    if (sectId !== 0) {
      return {
        event: "in_sect",
        data: {
          sectId
        }
      }
    }
    if ((await Redis.exists(`Mozu:xiuxian:sectInfo:${joinID}`)) === 0) {
      return {
        event: "not_sectid"
      }
    }
    let [members, memberMax, noAudit] = await Redis.hmget(`Mozu:xiuxian:sectInfo:${joinID}`, '宗门成员', '宗门人数上限', '无需审核状态')
    members = JSON.parse(members)
    memberNum = members.length
    memberMax = parseInt(memberMax, 10)
    noAudit = parseInt(noAudit, 10) || 0
    if (memberNum >= memberMax) {
      return {
        event: "member_full",
        data: {
          memberNum,
          memberMax
        }
      }
    }
    if (noAudit) {
      members = JSON.parse(await Redis.hget(`Mozu:xiuxian:sectInfo:${joinID}`, '待审核成员') || [])
      members.push(id)
      await Redis.hset(`Mozu:xiuxian:sectInfo:${joinID}`, '待审核成员', JSON.stringify(members))
      return {
        event: "join_sect_audit"
      }
    } else {
      members.push(id)
      await Redis.hset(`Mozu:xiuxian:sectInfo:${joinID}`, '宗门成员', JSON.stringify(members))
      await Redis.hset(`${PLAYER_INFO_KEY}:${id}`, '宗门ID', joinID)
      return {
        event: "join_sect_success",
        data: {
          sectId: joinID
        }
      }
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