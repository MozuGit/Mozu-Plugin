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
        time: item.time === undefined ? time : item.time
      }))
    ]
    const buildMember = (item) => {
      const t = Number(item.time) || 0
      const expireTime = new Date((Math.floor(Date.now() / 1000) + t + 1 + 8 * 3600) * 1000)
        .toISOString()
        .replace('Z', '+08:00')
      return {
        op: t === 0 ? 'del' : 'add',
        member_openid: item.openid.replace(this.bot.uin + ':', ''),
        mute_expire_at: t === 0 ? '' : expireTime
      }
    }
    const members = all.map(buildMember)
    const groups = [members.filter((item) => item.op === 'del'), members.filter((item) => item.op === 'add')]
    for (const group of groups) {
      for (let i = 0; i < group.length; i += 20) {
        try {
          await this.bot.sdk.request.post(`/v2/groups/${this.group_id}/restrict_chat_setting`, {
            members: group.slice(i, i + 20)
          })
        } catch (err) {
          logger.error('[魔族陌][Interface] ' + err)
          return false
        }
      }
    }
    return true
  }

  /**
   * 撤回群消息
   * @param  {...any} message_id - 消息 ID
   * @returns {Promise<boolean>} 返回操作成功或者失败
   */
  async recallMsg(...message_id) {
    const ids = message_id.flat(Infinity).filter((id) => id !== null && id !== undefined && id !== '')
    const failedIds = []
    const batchSize = 10
    const maxRetries = 3
    const isRateLimitError = (err) => {
      const status = err?.status ?? err?.statusCode ?? err?.code ?? err?.response?.status
      return Number(status) === 429
    }
    for (let batchStart = 0; batchStart < ids.length; batchStart += batchSize) {
      const batch = ids.slice(batchStart, batchStart + batchSize)
      for (const id of batch) {
        let recalled = false
        for (let retry = 0; retry <= maxRetries; retry++) {
          try {
            await this.bot.sdk.request.delete(`/v2/groups/${this.group_id}/messages/${id}`)
            recalled = true
            break
          } catch (err) {
            if (!isRateLimitError(err) || retry === maxRetries) {
              break
            }
            const retryAfter = err?.response?.headers?.['retry-after'] ?? err?.headers?.['retry-after']
            const retryDelay = Number(retryAfter) ? Number(retryAfter) * 1000 : 1000 * 2 ** retry
            await Bot.sleep(retryDelay)
          }
        }
        if (!recalled) failedIds.push(id)
      }
      if (batchStart + batchSize < ids.length) {
        await Bot.sleep(1000)
      }
    }
    return failedIds.length === 0
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
          addBlack
        })
      } catch (err) {
        return false
      }
    }
    return true
  }
}
