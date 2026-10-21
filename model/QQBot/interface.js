export default class QQBotApi {
  constructor(e) {
    this.bot = e.bot
    this.group_id = e.group_id.replace(this.bot.uin + ':', '')
  }

  /**
   * 获取群信息
   * @returns {Promise<Object>} 群信息
   */
  async getGroupInfo() {
    let result = null
    try {
      result = await this.bot.sdk.request.get(`/v2/groups/${this.group_id}/info`)
    } catch (err) {
      logger.error('[魔族陌][Interface] ' + err)
    }
    return result
  }

  /**
   * 获取群内机器人状态
   * @returns {Promise<Object>} 群内机器人状态
   */
  async getGroupBotState() {
    let result = null
    try {
      result = await this.bot.sdk.request.get(`/v2/groups/${this.group_id}/bot_state`)
    } catch (err) {
      logger.error('[魔族陌][Interface] ' + err)
    }
    return result
  }

  /**
   * 获取群成员申请加入列表
   * @returns {Promise<Object>} 群成员申请加入列表
   */
  async getGroupJoinList() {
    try {
      const { result } = await this.bot.sdk.request.get(`/v2/groups/${this.group_id}/join_request_list`)
      return result
    } catch (err) {
      return { list: [], next_cursor: '' }
    }
  }

  /**
   * 获取群禁言信息
   * @returns {Promise<Object[]>} 群禁言信息
   */
  async getGroupMuteInfo() {
    try {
      const { data: result } = await this.bot.sdk.request.get(`/v2/groups/${this.group_id}/restrict_chat_setting`)
      return result
    } catch (err) {
      return []
    }
  }

  /**
   * 设置群成员禁言
   * @param {string} openid - 需操作的openid
   * @param {number} time - 禁言时间（单位：秒，0表示解除禁言）
   * @param {Object[]} [obj] - 可选，额外的操作openid和禁言列表
   * @param {string} obj[].openid - 需操作的openid
   * @param {number} obj[].time - 禁言时间（单位：秒，0表示解除禁言）
   * @returns {Promise<boolean>} 返回操作成功或者失败
   */
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

  /**
   * 群成员批量移除
   * @param {string} openid - 需操作的openid
   * @param {boolean} addBlack - 是否同时加入群黑名单，默认：false
   * @param {string[]} openids - 额外的操作openid
   * @returns {Promise<boolean>} 返回操作成功或者失败
   */
  async kickMember(openid, addBlack = false, openids = []) {
    const normalize = (v) => {
      return v == null ? [] : Array.isArray(v) ? v : [v]
    }
    const members = [...normalize(openid), ...normalize(openids)].map((item) => item.replace(this.bot.uin + ':', ''))
    for (let i = 0; i < members.length; i += 20) {
      const member_openids = members.slice(i, i + 20)
      try {
        await this.bot.sdk.request.post(`/v2/groups/${this.group_id}/batch_remove_members`, {
          member_openids,
          addBlack,
        })
      } catch (err) {
        return false
      }
    }
    return true
  }
}
