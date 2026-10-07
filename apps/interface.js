import Redis from '#Redis'
import Config from '#Config'
import QQBot from '../model/QQBot/interface.js'
import { mqqapi, laTex, qagent } from '../lib/protocol.js'

if (Config.config.Redis.global) global.Redis = Redis
if (Config.config.interface.enable)
  global.Mozu = {
    mqqapi: mqqapi,
    laTex: laTex,
    qagent,
  }

export class MozuInterface extends plugin {
  constructor() {
    super({
      name: 'MozuInterface',
      dsc: '测试接口',
      priority: -Infinity,
    })
  }

  async accept(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.config.interface.enable) return false
    const bot = this.e.bot
    if (!this.e.group) return false
    const group_id = this.e.group_id.replace(bot.uin + ':', '')

    //获取群基本信息
    let groupInfo = JSON.parse(await Redis.get(`Mozu:groupinfo:${group_id}`))
    if (!groupInfo) {
      ;({ data: groupInfo } = await QQBot.groupInfo(bot, group_id))
      if (groupInfo) Redis.set(`Mozu:groupinfo:${group_id}`, JSON.stringify(groupInfo), 'EX', 3600)
    }

    //获取机器人群内状态
    let groupBotState = JSON.parse(await Redis.get(`Mozu:groupbotstate:${group_id}`))
    if (!groupBotState) {
      ;({ data: groupBotState } = await QQBot.getGroupBotState(bot, group_id))
      Redis.set(`Mozu:groupbotstate:${group_id}`, JSON.stringify(groupBotState), 'EX', 3600)
    }
    if (groupBotState.member_role === 'admin') this.e.group.is_admin = true

    if (!this.e.group.info) {
      this.e.group.info = {
        ...groupInfo,
        group_bot_state: groupBotState,
      }
    }

    //设置群成员禁言
    if (!this.e.group.muteMember) {
      this.e.group.muteMember = async (openid, time = 0, obj = []) => {
        return await QQBot.muteMember(bot, group_id, openid, (time = 0), (obj = []))
      }
    }

    //获取入群申请列表
    if (!this.e.group.getJoinList) {
      this.e.group.getJoinList = async () => {
        return await QQBot.getGroupJoinList(bot, group_id)
      }
    }
    return false
  }
}

Bot.on?.('notice.group.member', async (e) => {
  if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.config.interface.enable) return false
  const group_id = e.group_id.replace(e.self_id + ':', '')
  let groupInfo = JSON.parse(await Redis.get(`Mozu:groupinfo:${e.group_id}`))
  if (groupInfo) {
    groupInfo.group_member_num += e.sub_type === 'member.increase' ? 1 : -1
    Redis.set(`Mozu:groupinfo:${group_id}`, JSON.stringify(groupInfo), 'EX', 3600)
  }
})
