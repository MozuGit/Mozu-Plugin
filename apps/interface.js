import Redis from '#Redis'
import Config from '#Config'
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
    const self_id = this.e.self_id
    const group_id = this.e.group_id.replace(this.e.self_id + ':', '')

    //获取群基本信息
    let groupInfo = JSON.parse(await Redis.get(`Mozu:groupinfo:${group_id}`))
    if (!groupInfo) {
      ; ({ data: groupInfo } = await bot.sdk.request.get(`/v2/groups/${group_id}/info`))
      Redis.set(`Mozu:groupinfo:${group_id}`, JSON.stringify(groupInfo), 'EX', 3600)
    }

    //获取机器人群内状态
    let groupBotState = JSON.parse(await Redis.get(`Mozu:groupbotstate:${group_id}`))
    if (!groupBotState) {
      ; ({ data: groupBotState } = await bot.sdk.request.get(`/v2/groups/${group_id}/bot_state`))
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
        const extra = Array.isArray(obj) ? obj : []
        const all = [
          { openid, time },
          ...extra.map(item => ({
            openid: item.openid,
            time: item.time === undefined ? time : item.time,
          })),
        ]
        const buildMember = (item) => {
          const t = item.time === undefined ? 0 : item.time
          const expireTime = new Date((Math.floor(Date.now() / 1000) + t + 1 + 8 * 3600) * 1000)
            .toISOString()
            .replace('Z', '+08:00')
          return {
            op: t === 0 ? 'del' : 'add',
            member_openid: item.openid.replace(self_id + ':', ''),
            mute_expire_at: expireTime,
          }
        }
        for (let i = 0; i < all.length; i += 20) {
          const members = all.slice(i, i + 20).map(buildMember)
          try {
            await bot.sdk.request.post(`/v2/groups/${group_id}/restrict_chat_setting`, { members })
          } catch (err) {
            return false
          }
        }
        return true
      }
    }

    //获取入群申请列表
    if (!this.e.group.getJoinList) {
      this.e.group.getJoinList = async () => {
        try {
          const { result } = await bot.sdk.request.get(`/v2/groups/${group_id}/join_request_list`)
          return result
        } catch (err) {
          return false
        }
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
