import Config from '#Config'

export default new (class {
  async groupInfo(bot, group_id) {
    let result = null
    try {
      result = await bot.sdk.request.get(`/v2/groups/${group_id.replace(bot.uin + ':', '')}/info`)
    } catch (err) {
      logger.error('[魔族陌][Interface] ' + err)
    }
    return result
  }

  async getGroupBotState(bot, group_id) {
    let result = null
    try {
      result = await bot.sdk.request.get(`/v2/groups/${group_id.replace(bot.uin + ':', '')}/bot_state`)
    } catch (err) {
      logger.error('[魔族陌][Interface] ' + err)
    }
    return result
  }

  async getGroupJoinList(bot, group_id) {
    try {
      const { result } = await bot.sdk.request.get(`/v2/groups/${group_id.replace(bot.uin + ':', '')}/join_request_list`)
      return result
    } catch (err) {
      return { list: [], next_cursor: '' }
    }
  }

  async muteMember(bot, group_id, openid, time = 0, obj = []) {
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
        member_openid: item.openid.replace(bot.uin + ':', ''),
        mute_expire_at: expireTime,
      }
    }
    for (let i = 0; i < all.length; i += 20) {
      const members = all.slice(i, i + 20).map(buildMember)
      try {
        await bot.sdk.request.post(`/v2/groups/${group_id.replace(bot.uin + ':', '')}/restrict_chat_setting`, {
          members,
        })
      } catch (err) {
        return false
      }
    }
    return true
  }
})()
