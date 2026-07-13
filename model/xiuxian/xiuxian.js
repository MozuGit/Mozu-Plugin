import Redis from "#Redis"
import randomInt from "#randomInt"
import crypto from 'crypto'
import { evaluate } from "mathjs"
import { Config } from "./tools/Config/Config.js"

const PLAYER_INFO_KEY = "Mozu:xiuxian:playerInfo"
const SECT_INFO_KEY = "Mozu:xiuxian:sectInfo"

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
        称号: -1,
        性别: "未设置",
        宗门ID: 0,
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
    let [cult, ls, realm, signNum, retreatStartTime, sex, titleIndex, titles, sectId] = await Redis.hmget(key, '修为', '灵石', '境界', '签到次数', '闭关时间', '性别', '称号', '称号列表', '宗门ID')
    cult = parseInt(cult, 10) || 0
    ls = parseInt(ls, 10) || 0
    realm = parseInt(realm, 10) || 0
    signNum = parseInt(signNum, 10) || 0
    retreatStartTime = parseInt(retreatStartTime, 10) || 0
    sectId = parseInt(sectId, 10) || 0
    titles = JSON.parse(titles || '[]')
    titleIndex = parseInt(titleIndex, 10) || -1
    const title = titleIndex !== -1
      ? titles[titleIndex - 1]?.title
        ? titles[titleIndex - 1].validTime === 0
          ? titles[titleIndex - 1].title
          : titles[titleIndex - 1].validTime > Math.floor(Date.now() / 1000)
            ? titles[titleIndex - 1].title
            : '无'
        : '无'
      : '无'

    const realmName = (Config.Realm.Realms.length >= realm) ? Config.Realm.Realms[realm - 1]?.name || '无' : Config.Realm.Realms[Config.Realm.Realms.length].name || '未命名'
    const realmName2 = Config.Realm.Realms[realm]?.name
    const realmNeedExp = Config.Realm.Realms[realm]?.value ? Math.max(0, (Config.Realm.Realms[realm].value || 0) - cult) : -1
    const retreatRunTime = getStringTime(Math.floor(Date.now() / 1000) - retreatStartTime)
    const power = await this.getPower(id) || 0

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
      title,
      titles,
      sectInfo,
      retreat,
      power
    }
  }

  async getSectInfo(sectId) {
    if ((await Redis.exists(`${SECT_INFO_KEY}:${sectId}`)) === 0) {
      return false
    }
    const [name, desc, members, owner, exp, level] = await Redis.hmget(`${SECT_INFO_KEY}:${sectId}`, '宗门名称', '宗门简介', '宗门成员', '宗门宗主', '宗门经验', '宗门等级')
    const nextExp = Config.sect.sect_level[level]?.up_exp || 0
    return {
      id: sectId,
      name,
      desc,
      member: JSON.parse(members).length,
      owner,
      exp,
      level,
      max: Config.sect.sect_level.length > parseInt(level, 10) ? Config.sect.sect_level[level - 1].memberMax : Config.sect.sect_level[Config.sect.sect_level.length - 1].memberMax,
      nextExp
    }
  }

  async getPower(id) {
    const key = `${PLAYER_INFO_KEY}:${id}`
    let [cult, realm] = await Redis.hmget(key, '修为', '境界')
    cult = parseInt(cult, 10)
    realm = parseInt(realm, 10) || 0.75
    const power = Math.floor(evaluate(Config.xiuxian.powerFormula, { cult: cult, realm: realm }))
    return power
  }

  async xiulian(id, isMaster) {
    let [cult, last, retreatStart] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id}`, '修为', '上次修炼时间', '闭关时间')
    cult = parseInt(cult, 10)
    last = parseInt(last, 10)
    retreatStart = parseInt(retreatStart, 10) || 0
    if (retreatStart !== 0) {
      return {
        event: "in_retreat"
      }
    }
    if (Math.floor(Date.now() / 1000) - last <= Config.xiuxian.xiulian && !(isMaster && Config.setting.master_no_cd)) {
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

  async kaicai(id, isMaster) {
    let [ls, last, retreatStart] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id}`, '灵石', '上次开采时间', '闭关时间')
    ls = parseInt(ls, 10)
    last = parseInt(last, 10)
    retreatStart = parseInt(retreatStart, 10) || 0
    if (retreatStart !== 0) {
      return {
        event: "in_retreat"
      }
    }
    if (Math.floor(Date.now() / 1000) - last <= Config.xiuxian.kaicai && !(isMaster && Config.setting.master_no_cd)) {
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
    let [cult, realm] = await Redis.hmget('Mozu:xiuxian:playerInfo:' + id, '修为', '境界')
    cult = parseInt(cult, 10)
    realm = parseInt(realm, 10)
    const Realms = Config.Realm.Realms
    if (realm >= Realms.length) {
      return {
        event: "realm_max"
      }
    }
    if (cult >= Realms[realm].value) {
      if (randomInt(1, 100, id) <= Realms[realm].success) {
        Redis.hset(`${PLAYER_INFO_KEY}:${id}`, '境界', realm + 1)
        return {
          event: "realm_up",
          data: {
            state: "success",
            rate: Realms[realm].success,
            cult: Realms[realm].failed
          }
        }
      } else {
        const cultFailed = cult - Realms[realm].failed
        Redis.hset(`${PLAYER_INFO_KEY}:${id}`, '修为', cultFailed)
        return {
          event: "realm_up",
          data: {
            state: "failed",
            rate: Realms[realm].success,
            cult: Realms[realm].failed
          }
        }
      }
    } else {
      return {
        event: "cult_lack"
      }
    }
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

  async pvp(id, id2, isMaster) {
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
    } else if ((Math.floor(Date.now() / 1000) - pvp_cd) <= Config.xiuxian.pvp.atk_cd && !(isMaster && Config.setting.master_no_cd)) {
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
    } else if ((Math.floor(Date.now() / 1000) - pvp_cd) <= Config.xiuxian.pvp.def_cd && !(isMaster && Config.setting.master_no_cd)) {
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

  async getRank(type, id) {
    const pipeline = Redis.pipeline()
    const idNum = parseInt(await Redis.get('Mozu:xiuxian:openid:counter'))
    switch (type) {
      case '修为':
      case '灵石':
        for (let i = 0; i < idNum; i++) {
          pipeline.hmget(`${PLAYER_INFO_KEY}:${i}`, type, '称号', '称号列表')
        }
        break
      case '战力':
        for (let i = 0; i < idNum; i++) {
          pipeline.hmget(`${PLAYER_INFO_KEY}:${i}`, '修为', '境界', '称号', '称号列表')
        }
        break
      case '闭关':
        for (let i = 0; i < idNum; i++) {
          pipeline.hmget(`${PLAYER_INFO_KEY}:${i}`, '闭关时间', '称号', '称号列表')
        }
        break
    }
    const results = await pipeline.exec()
    const players = []
    switch (type) {
      case '修为':
      case '灵石':
        for (let i = 0; i < idNum; i++) {
          const value = parseInt(results[i][1][0], 10)
          const titleIndex = parseInt(results[i][1][1], 10) || 0
          const titles = JSON.parse(results[i][1][2] || '[]')
          const title = titleIndex !== -1
            ? titles[titleIndex - 1]?.title
              ? titles[titleIndex - 1].validTime === 0
                ? titles[titleIndex - 1].title
                : titles[titleIndex - 1].validTime > Math.floor(Date.now() / 1000)
                  ? titles[titleIndex - 1].title
                  : '无'
              : '无'
            : '无'
          if (value > 0) {
            players.push({
              id: i,
              value: value,
              title: title
            })
          }
        }
        break
      case '战力':
        for (let i = 0; i < idNum; i++) {
          const cult = parseInt(results[i][1][0], 10)
          const realm = parseInt(results[i][1][1], 10) || 0.75
          const value = Math.floor(evaluate(Config.xiuxian.powerFormula, { cult: cult, realm: realm }))
          const titleIndex = parseInt(results[i][1][2], 10) || 0
          const titles = JSON.parse(results[i][1][3] || '[]')
          const title = titleIndex !== -1
            ? titles[titleIndex - 1]?.title
              ? titles[titleIndex - 1].validTime === 0
                ? titles[titleIndex - 1].title
                : titles[titleIndex - 1].validTime > Math.floor(Date.now() / 1000)
                  ? titles[titleIndex - 1].title
                  : '无'
              : '无'
            : '无'
          if (value > 0) {
            players.push({
              id: i,
              value: value,
              title: title
            })
          }
        }
        break
      case '闭关':
        const time = Math.floor(Date.now() / 1000)
        for (let i = 0; i < idNum; i++) {
          const retreat = parseInt(results[i][1][0], 10)
          const titleIndex = parseInt(results[i][1][1], 10) || 0
          const titles = JSON.parse(results[i][1][2] || '[]')
          const title = titleIndex !== -1
            ? titles[titleIndex - 1]?.title
              ? titles[titleIndex - 1].validTime === 0
                ? titles[titleIndex - 1].title
                : titles[titleIndex - 1].validTime > Math.floor(Date.now() / 1000)
                  ? titles[titleIndex - 1].title
                  : '无'
              : '无'
            : '无'
          if (retreat > 0) {
            const value = time - retreat
            players.push({
              id: i,
              value: value,
              title: title
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
      value: player.value,
      title: player.title
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
        value: targetPlayer.value,
      }
    }
  }

  async huntBeast(id, beastInfo, isMaster) {
    let [cult, ls, last, retreatStart] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id}`, '修为', '灵石', '上次猎杀妖兽时间', '闭关时间')
    cult = parseInt(cult, 10),
    ls = parseInt(ls, 10)
    last = parseInt(last, 10) || 0
    retreatStart = parseInt(retreatStart, 10) || 0
    if (retreatStart !== 0) {
      return {
        event: "in_retreat"
      }
    }
    if (Math.floor(Date.now() / 1000) - last <= Config.beast.huntBeastCD && !(isMaster && Config.setting.master_no_cd)) {
      const outTime = Config.beast.huntBeastCD - (Math.floor(Date.now() / 1000) - last)
      return {
        event: "hunt_beast_cd",
        data: {
          outTime
        }
      }
    }
    const power = await this.getPower(id)
    const baseWinRate = power / (power + beastInfo.power)
    const randomFactor = 0.95 + Math.random() * 0.1
    let finalWinRate = baseWinRate * randomFactor
    finalWinRate = Math.max(0.01, Math.min(0.99, finalWinRate))
    const roll = Math.random()
    const isWin = roll < finalWinRate
    if (isWin) {
      cult += beastInfo.reward.cult
      ls += beastInfo.reward.ls
      Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
        修为: cult,
        灵石: ls,
        上次猎杀妖兽时间: Math.floor(Date.now() / 1000)
      })
      return {
        event: "hunt_beast",
        data: {
          state: "success",
          winRate: (finalWinRate * 100).toFixed(2)
        }
      }
    } else {
      cult += beastInfo.punishment.cult
      Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
        修为: cult,
        上次猎杀妖兽时间: Math.floor(Date.now() / 1000)
      })
      return {
        event: "hunt_beast",
        data: {
          state: "failure",
          winRate: (finalWinRate * 100).toFixed(2)
        }
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
      Redis.hmset(`${SECT_INFO_KEY}:${sectCount}`, {
        宗门名称: "修仙宗门",
        宗门简介: "未设置",
        宗门成员: JSON.stringify([id]),
        宗门宗主: id,
        宗门经验: 0,
        宗门等级: 1,
        宗门成员等级: JSON.stringify([{ id: id, permission: 10 }])
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

  async sectMember(id) {
    let sectId = parseInt(await Redis.hget(`${PLAYER_INFO_KEY}:${id}`, '宗门ID'), 10) || 0
    if (sectId === 0) {
      return {
        event: "no_sect"
      }
    }
    let memberPermission = JSON.parse(await Redis.hget(`${SECT_INFO_KEY}:${sectId}`, '宗门成员等级'))
    memberPermission = memberPermission.sort((a, b) => b.permission - a.permission)
    return {
      event: "members_list",
      data: {
        members: memberPermission
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
    if ((await Redis.exists(`${SECT_INFO_KEY}:${joinID}`)) === 0) {
      return {
        event: "not_sectid"
      }
    }
    let [level, members, memberPermission, noAudit] = await Redis.hmget(`${SECT_INFO_KEY}:${joinID}`, '宗门等级', '宗门成员', '宗门成员等级', '无需审核状态')
    level = parseInt(level, 10)
    members = JSON.parse(members)
    const memberNum = members.length
    const memberMax = Config.sect.sect_level[level - 1].memberMax
    memberPermission = JSON.parse(memberPermission)
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
      members = new Set(members)
      members.add(id)
      memberPermission.push({ id: id, level: 1 })
      await Redis.hmset(`${SECT_INFO_KEY}:${joinID}`, {
        宗门成员: JSON.stringify([...members]),
        宗门成员等级: JSON.stringify(memberPermission)
      })
      await Redis.hset(`${PLAYER_INFO_KEY}:${id}`, '宗门ID', joinID)
      return {
        event: "join_sect_success",
        data: {
          sectId: joinID
        }
      }
    } else {
      let memberAudit = new Set(JSON.parse(await Redis.hget(`${SECT_INFO_KEY}:${joinID}`, '待审核成员') || '[]'))
      memberAudit.add(id)
      await Redis.hset(`${SECT_INFO_KEY}:${joinID}`, '待审核成员', JSON.stringify([...memberAudit]))
      return {
        event: "join_sect_audit"
      }
    }
  }

  async sectUp(id) {
    const sectId = parseInt(await Redis.hget(`${PLAYER_INFO_KEY}:${id}`, '宗门ID'), 10)
    if ((await Redis.exists(`${SECT_INFO_KEY}:${sectId}`)) === 0) {
      return {
        event: "no_sect"
      }
    }
    let [exp, level, membersPermission] = await Redis.hmget(`${SECT_INFO_KEY}:${sectId}`, '宗门经验', '宗门等级', '宗门成员等级')
    exp = parseInt(exp, 10)
    level = parseInt(level, 10)
    membersPermission = JSON.parse(membersPermission)
    if (membersPermission.find(item => item.id === id)?.permission < 7) {
      return {
        event: "no_permission"
      }
    }
    if (Config.sect.sect_level.length > level) {
      if (exp >= Config.sect.sect_level[level].up_exp) {
        level++
        if (Config.sect.sect_up_reset) {
          Redis.hmset(`${SECT_INFO_KEY}:${sectId}`, {
            宗门经验: 0,
            宗门等级: level
          })
        } else {
          Redis.hset(`${SECT_INFO_KEY}:${id}`, '宗门等级', level)
        }
        return {
          event: "sect_level_up"
        }
      } else {
        return {
          event: "sect_exp_lack"
        }
      }
    } else {
      return {
        event: "sect_level_max"
      }
    }
  }

  async signSect(id) {
    let [cult, ls, lastDay, sectId] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id}`, ['修为', '灵石', '宗门上次签到时间', '宗门ID'])
    if ((await Redis.exists(`${SECT_INFO_KEY}:${sectId}`)) === 0) {
      return {
        event: "no_sect"
      }
    }
    let [exp, level] = await Redis.hmget(`${SECT_INFO_KEY}:${sectId}`, '宗门经验', '宗门等级')
    exp = parseInt(exp, 10)
    level = parseInt(level, 10)
    let { cult: addcult, ls: addls, sectExp } = Config.sect.sect_level[level - 1].sign
    const today = gettoday()
    if (lastDay && lastDay === today) {
      return {
        event: "is_signed"
      }
    }
    cult = parseInt(cult, 10) + addcult
    ls = parseInt(ls, 10) + addls
    exp = exp + sectExp
    await Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
      修为: cult,
      灵石: ls,
      宗门上次签到时间: today
    })
    await Redis.hset(`${SECT_INFO_KEY}:${sectId}`, '宗门经验', exp)
    return {
      event: "sign_in_success",
      data: {
        addcult,
        addls,
        sectExp
      }
    }
  }

  async listSect(id) {
    const sectCount = parseInt(await Redis.get('Mozu:xiuxian:sectid:counter'), 10) || 0
    let sectList = []
    const sectNum = (sectCount > 10) ? 10 : sectCount
    const sectArr = Array.from({ length: sectCount }, (_, i) => i + 1)
    for (let i = 0; i < sectNum; i++) {
      const ran = randomInt(sectCount - 1 - i, 0, id)
      sectList.push(sectArr.splice(ran, 1)[0])
    }
    if (sectList.length === 0) {
      return {
        event: "not_sects"
      }
    }
    const pipeline = Redis.pipeline()
    for (let sectId of sectList) {
      pipeline.hmget(`${SECT_INFO_KEY}:${sectId}`, '宗门名称', '宗门简介', '宗门成员', '宗门宗主', '宗门等级')
    }
    const results = await pipeline.exec()
    let sectInfos = []
    for (let i = 0; i < sectNum; i++) {
      sectInfos.push({
        id: sectList[i],
        name: results[i][1][0],
        desc: results[i][1][1],
        memberNum: JSON.parse(results[i][1][2]).length,
        owner: results[i][1][3],
        level: results[i][1][4],
        memberMax: Config.sect.sect_level[results[i][1][4] - 1].memberMax
      })
    }
    return {
      event: "get_list_sect_success",
      data: {
        sectInfos
      }
    }
  }

  async auditSect(id) {
    const sectId = await Redis.hget(`${PLAYER_INFO_KEY}:${id}`, '宗门ID')
    if ((await Redis.exists(`${SECT_INFO_KEY}:${sectId}`)) === 0) {
      return {
        event: "no_sect"
      }
    }
    let [membersPermission, memberAudit] = await Redis.hmget(`${SECT_INFO_KEY}:${sectId}`, '宗门成员等级', '待审核成员')
    membersPermission = JSON.parse(membersPermission)
    memberAudit = JSON.parse(memberAudit || '[]')
    if (membersPermission.find(item => item.id === id)?.permission < 7) {
      return {
        event: "no_permission"
      }
    }
    const pipeline = Redis.pipeline()
    for (let member of memberAudit) {
      pipeline.hmget(`${PLAYER_INFO_KEY}:${member}`, '修为', '境界')
    }
    const result = await pipeline.exec()
    let membersList = []
    for (let i = 0; i < result.length; i++) {
      const values = result[i][1]
      membersList.push({
        id: memberAudit[i],
        cult: values[0],
        realm: Config.Realm.Realms[values[1] - 1].name || '无'
      })
    }
    return {
      event: "audit_list",
      data: {
        membersList: membersList || []
      }
    }
  }

  async auditSectMember(id, auditId, approved, auditAll = false) {
    const sectId = await Redis.hget(`${PLAYER_INFO_KEY}:${id}`, '宗门ID')
    if ((await Redis.exists(`${SECT_INFO_KEY}:${sectId}`)) === 0) {
      return {
        event: "no_sect"
      }
    }
    let [level, members, membersPermission, memberAudit] = await Redis.hmget(`${SECT_INFO_KEY}:${sectId}`, '宗门等级', '宗门成员', '宗门成员等级', '待审核成员')
    let memberNum = JSON.parse(members).length
    const memberMax = Config.sect.sect_level[level - 1].memberMax
    members = JSON.parse(members)
    membersPermission = JSON.parse(membersPermission)
    memberAudit = JSON.parse(memberAudit || '[]')
    if (membersPermission.find(item => item.id === id)?.permission < 7) {
      return {
        event: "no_permission"
      }
    }
    if (memberNum >= memberMax && approved) {
      return {
        event: "member_max"
      }
    }
    if (auditAll) {
      if (memberAudit.length === 0) {
        return {
          event: "no_member_audit"
        }
      }
      if (approved) {
        const pipeline = Redis.pipeline()
        for (let member of memberAudit) {
          pipeline.hget(`${PLAYER_INFO_KEY}:${member}`, '宗门ID')
        }
        const results = await pipeline.exec()
        let hasSect = []
        const sectIds = results.map(([err, sectId]) => sectId)
        memberAudit = memberAudit.filter((_, index) => {
          const _sectId = sectIds[index]
          if (_sectId && _sectId !== '0') hasSect.push(_sectId)
          return !_sectId || _sectId === '0'
        })
        let addMembers = []
        while (memberAudit.length > 0 && memberNum < memberMax) {
          const member = memberAudit.shift()
          addMembers.push(member)
          members.push(member)
          memberNum++
        }
        for (let member of addMembers) {
          pipeline.hset(`${PLAYER_INFO_KEY}:${member}`, '宗门ID', sectId)
          membersPermission.push({ id: member, permission: 1 })
        }
        pipeline.hmset(`${SECT_INFO_KEY}:${sectId}`, {
          宗门成员: JSON.stringify(members),
          待审核成员: JSON.stringify(memberAudit),
          宗门成员等级: JSON.stringify(membersPermission)
        })
        await pipeline.exec()
        return {
          event: "sect_audit_all_agreed",
          data: {
            addMembers: addMembers,
            hasSect: hasSect.length
          }
        }
      } else {
        await Redis.hset(`${SECT_INFO_KEY}:${sectId}`, '待审核成员', '[]')
        return {
          event: "sect_audit_all_refused",
          data: {
            refusedMembers: memberAudit
          }
        }
      }
    } else {
      if (approved) {
        if (memberAudit.includes(auditId)) {
          const _sectId = await Redis.hget(`${PLAYER_INFO_KEY}:${auditId}`, '宗门ID')
          if (_sectId && _sectId !== '0') {
            await Redis.hset(`${SECT_INFO_KEY}:${sectId}`, '待审核成员', JSON.stringify(memberAudit.filter(item => item !== auditId)))
            return {
              event: "member_has_sect"
            }
          }
          members.push(auditId)
          membersPermission.push({ id: auditId, permission: 1 })
          await Redis.hset(`${PLAYER_INFO_KEY}:${auditId}`, '宗门ID', sectId)
          await Redis.hmset(`${SECT_INFO_KEY}:${sectId}`, {
            宗门成员: JSON.stringify(members),
            待审核成员: JSON.stringify(memberAudit.filter(item => item !== auditId)),
            宗门成员等级: JSON.stringify(membersPermission)
          })
          return {
            event: "member_agreed"
          }
        } else {
          return {
            event: "not_member"
          }
        }
      } else {
        if (memberAudit.includes(auditId)) {
          await Redis.hset(`${SECT_INFO_KEY}:${sectId}`, '待审核成员', JSON.stringify(memberAudit.filter(item => item !== auditId)))
          return {
            event: "member_refused"
          }
        } else {
          return {
            event: "not_member"
          }
        }
      }
    }
  }

  async exitSect(id) {
    const sectId = await Redis.hget(`${PLAYER_INFO_KEY}:${id}`, '宗门ID')
    if ((await Redis.exists(`${SECT_INFO_KEY}:${sectId}`)) === 0) {
      return {
        event: "no_sect"
      }
    }
    let [members, memberPermission] = await Redis.hmget(`${SECT_INFO_KEY}:${sectId}`, '宗门成员', '宗门成员等级')
    members = JSON.parse(members)
    memberPermission = JSON.parse(memberPermission)
    const member = memberPermission.find(member => member.id === id)
    if (member && member.permission !== 10) {
      members = members.filter(item => item !== id)
      memberPermission = memberPermission.filter(member => member.id !== id)
      Redis.hmset(`${SECT_INFO_KEY}:${sectId}`, {
        宗门成员: JSON.stringify(members),
        宗门成员等级: JSON.stringify(memberPermission)
      })
      Redis.hset(`${PLAYER_INFO_KEY}:${id}`, '宗门ID', "0")
      return {
        event: "sect_exit"
      }
    } else {
      return {
        event: "sect_owner"
      }
    }
  }

  async transferSect(id, transfer_id, confirmed = false) {
    const sectId = await Redis.hget(`${PLAYER_INFO_KEY}:${id}`, '宗门ID')
    if ((await Redis.exists(`${SECT_INFO_KEY}:${sectId}`)) === 0) {
      return {
        event: "no_sect"
      }
    }
    let [members, memberPermission] = await Redis.hmget(`${SECT_INFO_KEY}:${sectId}`, '宗门成员', '宗门成员等级')
    members = JSON.parse(members)
    memberPermission = JSON.parse(memberPermission)
    if (memberPermission.find(member => member.id === id)?.permission === 10) {
      if (!members.includes(parseInt(transfer_id, 10))) {
        return {
          event: "not_transfer_id"
        }
      }
      if (confirmed) {
        const member = memberPermission.find(member => member.id === id)
        const transfer_member = memberPermission.find(member => member.id === transfer_id)
        member.permission = 1
        transfer_member.permission = 10
        Redis.hmset(`${SECT_INFO_KEY}:${sectId}`, {
          宗门宗主: transfer_id,
          宗门成员等级: JSON.stringify(memberPermission)
        })
        return {
          event: "sect_transfer"
        }
      } else {
        return {
          event: "no_confirmed"
        }
      }
    } else {
      return {
        event: "no_permission"
      }
    }
  }

  async sectEnshrined(id, lsNum) {
    let [ls, sectId] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id}`, '灵石', '宗门ID')
    ls = parseInt(ls, 10)
    lsNum = parseInt(lsNum, 10)
    if ((await Redis.exists(`${SECT_INFO_KEY}:${sectId}`)) === 0) {
      return {
        event: "no_sect"
      }
    }
    if (ls < lsNum) {
      return {
        event: "lack_ls",
        data: {
          ls: lsNum
        }
      }
    }
    if (lsNum >= 0 && lsNum % 10 === 0) {
      ls = ls - lsNum
      let [exp, memberContribution] = await Redis.hmget(`${SECT_INFO_KEY}:${sectId}`, '宗门经验', '宗门贡献')
      exp = parseInt(exp, 10) + lsNum / 10
      memberContribution = JSON.parse(memberContribution || '[]')
      const member = memberContribution.find(member => member.id === id)
      if (!member) {
        memberContribution.push({ id: id, contribution: lsNum })
      } else {
        member.contribution += lsNum
      }
      Redis.hmset(`${SECT_INFO_KEY}:${sectId}`, {
        宗门经验: exp,
        宗门贡献: JSON.stringify(memberContribution)
      })
      Redis.hset(`${PLAYER_INFO_KEY}:${id}`, '灵石', ls)
      return {
        event: "sect_enshrined",
        data: {
          addExp: lsNum / 10,
          addContribution: lsNum
        }
      }
    } else {
      return {
        event: "invalid_lsNum"
      }
    }
  }

  async setSex(id, sexType) {
    const sex = await Redis.hget(`${PLAYER_INFO_KEY}:${id}`, '性别')
    if (sex !== "未设置") {
      return {
        event: "in_is_sex"
      }
    }
    if (sexType !== "男" && sexType !== "女") {
      return {
        event: "invalid_sex"
      }
    }
    Redis.hset(`${PLAYER_INFO_KEY}:${id}`, '性别', sexType)
    return {
      event: "set_sex_success",
      data: {
        sex: sexType
      }
    }
  }

  async setTitle(id, titleIndex) {
    let [titles, title] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id}`, '称号列表', '称号')
    titles = JSON.parse(titles || '[]')
    titleIndex = parseInt(titleIndex, 10)
    if (titleIndex < 1 || titleIndex > titles.length) {
      return {
        event: "invalid_title"
      }
    }
    title = titles[titleIndex - 1]?.title || '无'
    Redis.hset(`${PLAYER_INFO_KEY}:${id}`, '称号', titleIndex)
    return {
      event: "set_title_success",
      data: {
        title: title
      }
    }
  }

  async genCdkey(user_id, msg, isMaster) {
    if (!isMaster) {
      return {
        event: "no_permissions"
      }
    }
    const quantities = [...msg.matchAll(/数量:(\d+)/g)].map(m => parseInt(m[1], 10))
    const quantity = quantities.length === 0 ? 1 : quantities.reduce((a, b) => a + b, 0)
    const value = {
      genera: msg.includes("通用"),
      forceSetting: msg.includes("强制设置"),
      cultList: [...msg.matchAll(/修为:(-?\d+)/g)].map(m => parseInt(m[1], 10)),
      lsList: [...msg.matchAll(/灵石:(-?\d+)/g)].map(m => parseInt(m[1], 10))
    }
    const cdkSet = new Set()
    while (cdkSet.size < quantity) {
      cdkSet.add(genCdkString())
    }
    const cdks = [...cdkSet]
    const pipeline = Redis.pipeline()
    for (let cdk of cdks) {
      pipeline.hset(`Mozu:xiuxian:cdk:${cdk}`, 'value', JSON.stringify(value))
    }
    await pipeline.exec()
    return {
      event: "gen_cdk_success",
      data: {
        cdks
      }
    }
  }

  async delCdkey(user_id, msg, isMaster) {
    if (!isMaster) {
      return {
        event: "no_permissions"
      }
    }
    if (msg.includes("全部")) {
      const stream = Redis.scanStream({
        match: "Mozu:xiuxian:cdk:*",
        count: 100
      })
      let cdks = []
      for await (const keys of stream) {
        if (keys.length) {
          keys.forEach(key => cdks.push(key.replace("Mozu:xiuxian:cdk:", "")))
          const pipeline = Redis.pipeline()
          keys.forEach(key => pipeline.del(key))
          await pipeline.exec()
        }
      }
      return {
        event: "del_cdks",
        data: {
          cdkList: cdks
        }
      }
    } else {
      let cdkText = msg.replace(/删除兑换码\s*/i, '').trim()
      if (!cdkText) {
        return {
          event: "invalid_cdks"
        }
      }
      let cdkList = cdkText.split(/\n/).map(cdk => cdk.trim()).filter(cdk => cdk.length > 0)
      if (!cdkList.length) {
        return {
          event: "invalid_cdks"
        }
      }
      cdkList = [...new Set(cdkList)]
      const keysToDelete = cdkList.map(cdk => `Mozu:xiuxian:cdk:${cdk}`)
      const pipeline = Redis.pipeline()
      keysToDelete.forEach(key => pipeline.del(key))
      await pipeline.exec()
      return {
        event: "del_cdks",
        data: {
          cdkList
        }
      }
    }
  }

  async useCdkey(id, user_id, cdk) {
    if ((await Redis.exists(`Mozu:xiuxian:cdk:${cdk}`)) === 0) {
      return {
        event: "invalid_cdk"
      }
    }
    let [value, used, useId, useTime] = await Redis.hmget(`Mozu:xiuxian:cdk:${cdk}`, 'value', '使用状态', '使用ID', '使用时间')
    value = JSON.parse(value)
    used = !!parseInt(used, 10)
    let addcult = value.cultList.reduce((a, b) => a + b, 0)
    let addls = value.lsList.reduce((a, b) => a + b, 0)
    let [cult, ls] = await Redis.hmget(`${PLAYER_INFO_KEY}:${id}`, '修为', '灵石')
    cult = parseInt(cult, 10)
    ls = parseInt(ls, 10)
    if (!value.genera && used) {
      return {
        event: "cdk_used",
        data: {
          useId,
          useTime
        }
      }
    } else if (value.genera) {
      useId = JSON.parse(useId) || []
      useTime = JSON.parse(useTime) || []
      const index = useId.indexOf(user_id)
      if (index !== -1) {
        return {
          event: "cdk_used",
          data: {
            useTime: useTime[index]
          }
        }
      } else {
        useId.push(user_id)
        useTime.push(Math.floor(Date.now() / 1000))
        Redis.hmset(`Mozu:xiuxian:cdk:${cdk}`, {
          使用ID: JSON.stringify(useId),
          使用时间: JSON.stringify(useTime)
        })
        if (value.forceSetting) {
          Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
            修为: addcult || cult,
            灵石: addls || ls
          })
          return {
            event: "cdk_use_force_success",
            data: {
              cult: addcult || cult,
              ls: addls || ls
            }
          }
        } else {
          Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
            修为: addcult + cult,
            灵石: addls + ls
          })
          return {
            event: "cdk_use_success",
            data: {
              cult: value.cultList,
              ls: value.lsList
            }
          }
        }
      }
    } else {
      Redis.hmset(`Mozu:xiuxian:cdk:${cdk}`, {
        使用状态: 1,
        使用ID: user_id,
        使用时间: Math.floor(Date.now() / 1000)
      })
      if (value.forceSetting) {
        Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
          修为: addcult || cult,
          灵石: addls || ls
        })
        return {
          event: "cdk_use_force_success",
          data: {
            cult: addcult || cult,
            ls: addls || ls
          }
        }
      } else {
        Redis.hmset(`${PLAYER_INFO_KEY}:${id}`, {
          修为: addcult + cult,
          灵石: addls + ls
        })
        return {
          event: "cdk_use_success",
          data: {
            cult: value.cultList,
            ls: value.lsList
          }
        }
      }
    }
  }

  async switchId(id, switch_id, isMaster) {
    if (!isMaster) {
      return {
        event: "no_permissions"
      }
    }
    if ((await Redis.exists(`${PLAYER_INFO_KEY}:${switch_id}`)) !== 0) {
      const open_id = await Redis.hget('Mozu:xiuxian:openid:reverse', id)
      const open_switchid = await Redis.hget('Mozu:xiuxian:openid:reverse', switch_id)

      const multi = Redis.multi()
      const tempKey = `Mozu:xiuxian:temp:${Date.now()}`
      multi.rename(`${PLAYER_INFO_KEY}:${id}`, tempKey)
      multi.rename(`${PLAYER_INFO_KEY}:${switch_id}`, `${PLAYER_INFO_KEY}:${id}`)
      multi.rename(tempKey, `${PLAYER_INFO_KEY}:${switch_id}`)

      multi.hset('Mozu:xiuxian:openid:forward', open_id, switch_id)
      multi.hset('Mozu:xiuxian:openid:forward', open_switchid, id)
      multi.hset('Mozu:xiuxian:openid:reverse', switch_id, open_id)
      multi.hset('Mozu:xiuxian:openid:reverse', id, open_switchid)

      await multi.exec()
      return {
        event: "switch_success"
      }
    } else {
      return {
        event: "not_switch_id"
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

function genCdkString(length = 16) {
  const cdk = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  const bytes = crypto.randomBytes(16)
  for (let i = 0; i < length; i++) {
    result += cdk[bytes[i] % cdk.length]
  }
  return result
}