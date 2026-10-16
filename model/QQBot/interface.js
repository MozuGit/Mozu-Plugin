export default class QQBotApi {
  constructor(e) {
    this.bot = e.bot
    this.group_id = e.group_id.replace(this.bot.uin + ':', '')
  }

  //获取群信息
  async getGroupInfo() {
    let result = null
    try {
      result = await this.bot.sdk.request.get(`/v2/groups/${this.group_id}/info`)
    } catch (err) {
      logger.error('[魔族陌][Interface] ' + err)
    }
    return result
  }

  //获取群内机器人状态
  async getGroupBotState() {
    let result = null
    try {
      result = await this.bot.sdk.request.get(`/v2/groups/${this.group_id}/bot_state`)
    } catch (err) {
      logger.error('[魔族陌][Interface] ' + err)
    }
    return result
  }

  //获取群成员申请加入列表
  async getGroupJoinList() {
    try {
      const { result } = await this.bot.sdk.request.get(`/v2/groups/${this.group_id}/join_request_list`)
      return result
    } catch (err) {
      return { list: [], next_cursor: '' }
    }
  }

  //获取群禁言信息
  async getGroupMuteInfo() {
    try {
      const { data: result } = await this.bot.sdk.request.get(`/v2/groups/${this.group_id}/restrict_chat_setting`)
      return result
    } catch (err) {
      return []
    }
  }

  //禁言群成员
  async muteMember(openid, time = 0, obj = []) {
    const extra = Array.isArray(obj) ? obj : []
    const all = [
      { openid, time },
      ...extra.map((item) => ({
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
        member_openid: item.openid.replace(this.bot.uin + ':', ''),
        mute_expire_at: t === 0 ? '' : expireTime,
      }
    }
    for (let i = 0; i < all.length; i += 20) {
      const members = all.slice(i, i + 20).map(buildMember)
      try {
        await this.bot.sdk.request.post(`/v2/groups/${this.group_id}/restrict_chat_setting`, {
          members,
        })
      } catch (err) {
        return false
      }
    }
    return true
  }
}
