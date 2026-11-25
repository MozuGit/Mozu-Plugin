let requestQueue = Promise.resolve()
let lastRequestAt = 0

async function waitForRequest() {
  const request = requestQueue.then(async () => {
    const delay = Math.max(0, 1000 - (Date.now() - lastRequestAt))
    if (delay > 0) await Bot.sleep(delay)
    lastRequestAt = Date.now()
  })
  requestQueue = request.catch(() => {})
  await request
}

export default class QQBotApi {
  constructor(e) {
    this.bot = e.bot
    this.group_id = e?.group_id?.replace(this.bot.uin + ':', '')
  }

  /**
   * 获取机器人详情
   * @returns {Promise<Object>} 机器人信息
   */
  async getBotInfo() {
    let result = null
    try {
      result = await this.bot.sdk.request.get('/users/@me')
    } catch (err) {
      logger.error('[魔族陌][Interface] ' + err)
    }
    return result
  }

  /**
   * 获取用户基本信息
   * @param {string} openid - 用户的openid
   * @returns {Promise<Object>} 用户基本信息
   */
  async getUserInfo(user_id) {
    let result = null
    try {
      result = await this.bot.sdk.request.get(`/v2/users/${user_id.replace(this.bot.uin + ':', '')}/info`)
    } catch (err) {
      logger.error('[魔族陌][Interface] ' + err)
    }
    return result
  }

  /**
   * 生成分享链接
   * @param {string} data - 回传给机器人后台的数据
   * @returns {Promise<string>} 分享链接
   */
  async generateUrl(data = 'MozuInterface') {
    let result = null
    try {
      result = await this.bot.sdk.request.post('/v2/generate_url_link', {
        callback_data: data
      })
    } catch (err) {
      logger.error('[魔族陌][Interface] ' + err)
    }
    return result.data.url
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
   * 获取群成员列表
   * @returns {Promise<Object[]>} 群成员列表
   */
  async getGroupMemberList() {
    const members = []
    let nextCursor = ''
    do {
      try {
        await waitForRequest()
        const { members: page, next_cursor: cursor } = await this.bot.sdk.request.get(
          `/v2/groups/${this.group_id}/members?cursor=${encodeURIComponent(nextCursor)}`
        )
        members.push(...page)
        nextCursor = cursor
      } catch (err) {
        logger.error('[魔族陌][Interface] ' + err)
        break
      }
    } while (nextCursor)
    return members
  }

  /**
   * 获取群成员信息
   * @param {string} openid - 用户的openid
   * @returns {Promise<Object>} 群成员信息
   */
  async getGroupMemberInfo(openid) {
    let result = null
    try {
      result = await this.bot.sdk.request.get(
        `/v2/groups/${this.group_id}/members/${openid.replace(this.bot.uin + ':', '')}`
      )
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
   * 入群申请审批
   * @param {string} openid - 用户的openid
   * @param {boolean} op - 操作类型，true表示通过，false表示拒绝
   * @param {string} rejectMsg - 拒绝理由
   * @param {boolean} addBlack - 是否加入黑名单
   * @returns {Promise<boolean>} 返回操作成功或者失败
   */
  async approve(openid, op, rejectMsg = '', addBlack = false) {
    try {
      await this.bot.sdk.request.post(
        `/v2/groups/${this.group_id}/approval_join_request/${openid.replace(this.bot.uin + ':', '')}`,
        {
          op: op ? 'approve' : 'decline',
          ...(!op && {
            reject_msg: rejectMsg,
            add_black: addBlack
          })
        }
      )
    } catch (err) {
      logger.error('[魔族陌][Interface] ' + err)
      return false
    }
    return true
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
