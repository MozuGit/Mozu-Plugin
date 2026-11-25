import Redis from '#Redis'
import Config from '#Config'
import QQBotApi from '../model/QQBot/interface.js'
import { mqqapi, laTex, qagent } from '../lib/protocol.js'

function hasValue(target, key) {
  return Boolean(target?.[key])
}

if (Config.config.Redis.global) global.Redis = Redis
if (Config.config.interface.enable)
  global.Mozu = {
    mqqapi: mqqapi,
    laTex: laTex,
    qagent
  }

export class MozuInterface extends plugin {
  constructor() {
    super({
      name: 'MozuInterface',
      dsc: '测试接口',
      priority: -Infinity
    })
  }

  async accept(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.config.interface.enable) return false
    const bot = this.e.bot
    if (!this.e.group) return false
    const api = new QQBotApi(e)
    const group_id = this.e.group_id.replace(bot.uin + ':', '')

    //获取机器人详情
    if (!hasValue(this.e, 'getBotInfo')) {
      this.e.getBotInfo = async () => {
        return await api.getBotInfo()
      }
    }

    //获取用户基本信息
    if (!hasValue(this.e.user, 'info')) {
      this.e.getUserInfo = async (user_id) => {
        return await api.getUserInfo(user_id)
      }
    }

    //生成分享链接
    if (!hasValue(this.e, 'generateUrl')) {
      this.e.generateUrl = async (data) => {
        return await api.generateUrl(data)
      }
    }

    //获取群基本信息
    let groupInfo = JSON.parse(await Redis.get(`Mozu:groupinfo:${group_id}`))
    if (!groupInfo) {
      ;({ data: groupInfo } = await api.getGroupInfo())
      if (groupInfo) Redis.set(`Mozu:groupinfo:${group_id}`, JSON.stringify(groupInfo), 'EX', 3600)
    }

    //获取机器人群内状态
    let groupBotState = JSON.parse((await Redis.get(`Mozu:groupbotstate:${group_id}`)) || null)
    if (!groupBotState) {
      ;({ data: groupBotState } = await api.getGroupBotState())
      Redis.set(`Mozu:groupbotstate:${group_id}`, JSON.stringify(groupBotState), 'EX', 3600)
    }
    if (groupBotState.member_role === 'admin') this.e.group.is_admin = true

    if (!hasValue(this.e.group, 'info')) {
      this.e.group.info = {
        ...groupInfo,
        group_bot_state: groupBotState
      }
    }

    //获取群成员列表
    if (!hasValue(this.e.group, 'getMemberList')) {
      this.e.group.getMemberList = async () => {
        return await api.getGroupMemberList()
      }
    }

    //获取群成员信息
    if (!hasValue(this.e.group, 'getMemberInfo')) {
      this.e.group.getMemberInfo = async (openid) => {
        return await api.getGroupMemberInfo(openid)
      }
    }

    //获取入群申请列表
    if (!hasValue(this.e.group, 'getJoinList')) {
      this.e.group.getJoinList = async () => {
        return await api.getGroupJoinList()
      }
    }

    //入群申请审批
    if (!hasValue(this.e.group, 'approve')) {
      this.e.group.approve = async (openid, op, rejectMsg = '', addBlack = false) => {
        return await api.approve(openid, op, rejectMsg, addBlack)
      }
    }

    //撤回群消息
    if (!hasValue(this.e.group, 'recallMsg')) {
      this.e.group.recallMsg = async (message_id) => {
        return await api.recallMsg(message_id)
      }
    }

    //获取群禁言成员列表
    if (!hasValue(this.e.group, 'getGroupMuteList')) {
      this.e.group.getGroupMuteList = async () => {
        return await api.getGroupMuteInfo()
      }
    }

    //设置群成员禁言
    if (!hasValue(this.e.group, 'muteMember')) {
      this.e.group.muteMember = async (openid, time = 0, obj = []) => {
        return await api.muteMember(openid, time, obj)
      }
    }

    //群成员移除
    if (!hasValue(this.e.group, 'kickMember')) {
      this.e.group.kickMember = async (openid, addBlack = false, openids = []) => {
        return await api.kickMember(openid, addBlack, openids)
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
