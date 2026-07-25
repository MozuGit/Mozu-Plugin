import Config from '#Config'
import { mqqapi } from './protocol.js'

export default new class {
  async sectAuditName(sectId, sectName) {
    if (!Config?.masterQQ?.length) return
    let BotList = []
    if (Array.isArray(Bot.uin)) {
      BotList.push(Bot.uin)
    } else {
      for (const id of Bot.uin) {
        if (Bot[id]?.adapter?.name === "QQBot") BotList.push(id)
      }
    }
    const masterQQ = Config.masterQQ.splice(Config.masterQQ.indexOf('stdin'), Config.masterQQ.includes('stdin') ? 1 : 0)
    const message = [
      '***',
      '**宗门名称审核**',
      '>您有一条新的宗门名称审核',
      '宗门ID：' + sectId,
      '申请名称：' + sectName,
      (await mqqapi.command('[审核通过]', '宗门名称审核通过' + sectId, true)) + '      ' + (await mqqapi.command('[驳回审核]', '宗门名称审核通过' + sectId, true)),
      '***'
    ].join('\n')
    for (const botid of BotList) {
      for (const master of Config.masterQQ) {
        try {
          Bot[botid]?.pickFriend(master.replace(botid + ':', '')).sendMsg(message)
        } catch { continue }
      }
    }
  }

  async sectAuditDesc(sectId, sectDesc) {
    if (!Config?.masterQQ?.length) return
    let BotList = []
    if (Array.isArray(Bot.uin)) {
      BotList.push(Bot.uin)
    } else {
      for (const id of Bot.uin) {
        if (Bot[id]?.adapter?.name === "QQBot") BotList.push(id)
      }
    }
    const masterQQ = Config.masterQQ.splice(Config.masterQQ.indexOf('stdin'), Config.masterQQ.includes('stdin') ? 1 : 0)
    const message = [
      '***',
      '**宗门简介审核**',
      '>您有一条新的宗门简介审核',
      '宗门ID：' + sectId,
      '申请简介：' + sectDesc,
      (await mqqapi.command('[审核通过]', '宗门简介审核通过' + sectId, true)) + '      ' + (await mqqapi.command('[驳回审核]', '宗门简介审核通过' + sectId, true)),
      '***'
    ].join('\n')
    for (const botid of BotList) {
      for (const master of Config.masterQQ) {
        try {
          Bot[botid]?.pickFriend(master.replace(botid + ':', '')).sendMsg(message)
        } catch { continue }
      }
    }
  }
}