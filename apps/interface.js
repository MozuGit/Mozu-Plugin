import Redis from "#Redis"
import Config from "#Config"

if (Config.config.Redis.global) global.Redis = Redis

export class MozuInterface extends plugin {
  constructor() {
    super({
      name: "MozuInterface",
      dsc: '测试接口',
      priority: -Infinity,
    })
  }

  async accept(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.config.interface.enable) return false
    const bot = this.e.bot
    if (!this.e.group) return false
    const group_id = this.e.group_id.replace(this.e.self_id + ':', '')
    let groupInfo = JSON.parse(await Redis.get(`Mozu:groupinfo:${group_id}`))
    if (!groupInfo) {
      ({ data: groupInfo } = await bot.sdk.request.get(`/v2/groups/${group_id}/info`))
      Redis.set(`Mozu:groupinfo:${group_id}`, JSON.stringify(groupInfo), 'EX', 300)
    }

    let groupBotState = JSON.parse(await Redis.get(`Mozu:groupbotstate:${group_id}`))
    if (!groupBotState) {
      ({ data: groupBotState } = await bot.sdk.request.get(`/v2/groups/${group_id}/bot_state`))
      Redis.set(`Mozu:groupbotstate:${group_id}`, JSON.stringify(groupBotState), 'EX', 300)
    }

    let groupJoinList = JSON.parse(await Redis.get(`Mozu:groupjoinlist:${group_id}`))
    if (!groupJoinList && groupBotState.member_role === 'admin') {
      ({ data: groupJoinList } = await bot.sdk.request.get(`/v2/groups/${group_id}/join_request_list`))
      Redis.set(`Mozu:groupjoinlist:${group_id}`, JSON.stringify(groupJoinList), 'EX', 300)
    }
    this.e.group.info = {
      ...groupInfo,
      group_bot_state: groupBotState,
      group_join_request_list: groupJoinList,
      async approval_join_request(group_openid, member_openid, op, join_request_id, reject_reason, add_to_member_blacklist = false) {
        //待更新
      }
    }
    return false
  }
}

Bot.on?.("notice.group.member", async (e) => {
  if (!['QQBot'].includes(e?.bot?.adapter?.name)) return false
  const group_id = e.group_id.replace(e.self_id + ':', '')
  let groupInfo = JSON.parse(await Redis.get(`Mozu:groupinfo:${e.group_id}`))
  if (groupInfo) {
    groupInfo.group_member_num += e.sub_type === 'member.increase' ? 1 : -1
    Redis.set(`Mozu:groupinfo:${group_id}`, JSON.stringify(groupInfo))
  }
})