import Config from '#Config'
import Button from '../button.js'
import { mqqapi } from './protocol.js'

const prefix = Config.xiuxian.setting.forceSharp ? '/' : ''

export default new class {
  async sectAuditName(sectId, sectName, isAI = false) {
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
    let message
    if (isAI) {
      message = [
        '***',
        '**宗门名称AI审核通过**',
        '>AI已自动通过宗门名称审核',
        '宗门ID：' + sectId,
        '申请名称：' + sectName,
        '若内容违规可执行 ' + (await mqqapi.command('重置宗门名称', '重置宗门名称' + sectId, true)),
        '***'
      ].join('\n')
    } else {
      message = [
        '***',
        '**宗门名称审核**',
        '>您有一条新的宗门名称审核',
        '宗门ID：' + sectId,
        '申请名称：' + sectName,
        (await mqqapi.command('[审核通过]', '宗门名称审核通过' + sectId, true)) + '      ' + (await mqqapi.command('[驳回审核]', '宗门名称审核拒绝' + sectId, true)),
        '***'
      ].join('\n')
    }
    for (const botid of BotList) {
      for (const master of Config.masterQQ) {
        try {
          Bot[botid]?.pickFriend(master.replace(botid + ':', '')).sendMsg([message, segment.button(
            [
              { text: "通过", input: prefix + "宗门名称审核通过" + sectId },
              { text: "重置", input: prefix + "重置宗门名称" + sectId },
              { text: "驳回", input: prefix + "宗门名称审核拒绝" + sectId }
            ]
          )])
        } catch { continue }
      }
    }
  }

  async sectAuditDesc(sectId, sectDesc, isAI = false) {
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
    let message
    if (isAI) {
      message = [
        '***',
        '**宗门简介AI审核通过**',
        '>AI已自动通过宗门简介审核',
        '宗门ID：' + sectId,
        '申请简介：' + sectDesc,
        '若内容违规可执行 ' + (await mqqapi.command('重置宗门简介', '重置宗门简介' + sectId, true)),
        '***'
      ].join('\n')
    } else {
      message = [
        '***',
        '**宗门简介审核**',
        '>您有一条新的宗门简介审核',
        '宗门ID：' + sectId,
        '申请简介：' + sectDesc,
        (await mqqapi.command('[审核通过]', '宗门简介审核通过' + sectId, true)) + '      ' + (await mqqapi.command('[驳回审核]', '宗门简介审核通过' + sectId, true)),
        '***'
      ].join('\n')
    }
    for (const botid of BotList) {
      for (const master of Config.masterQQ) {
        try {
          Bot[botid]?.pickFriend(master.replace(botid + ':', '')).sendMsg([message, segment.button(
            [
              { text: "通过", input: prefix + "宗门简介审核通过" + sectId },
              { text: "重置", input: prefix + "重置宗门简介" + sectId },
              { text: "驳回", input: prefix + "宗门简介审核拒绝" + sectId }
            ]
          )])
        } catch { continue }
      }
    }
  }
}