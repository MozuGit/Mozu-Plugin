import QQBotApi from '../QQBot/interface.js'

export default class GroupAdmin {
  constructor(e) {
    this.api = new QQBotApi(e)
  }

  /**
   * 获取群成员禁言列表
   * @param {String} group_id - 群open_id
   * @returns {Promise<Object>} 群成员禁言对象数组
   */
  async getMuteList() {
    const { members: result } = await this.api.getGroupMuteInfo()
    return result
  }

  /**
   * 设置群成员禁言
   * @param {string | (string|number)[] | {key: string|number}[]} members - 禁言群成员对象数组
   * @returns {Promise<boolean>} 表示禁言是否成功
   */
  async muteMembers(members) {
    const list = normalizeMembers(members)
    if (!list) return false
    const [first, ...rest] = list
    return await this.api.muteMember(first.openid, first.time ?? 0, rest)
  }

  /**
   * 群成员批量移除
   * @param {string[]} members - 移除群成员数组
   * @param {boolean} addBlack - 是否同时加入群黑名单，默认：false
   * @returns {Promise<boolean>} 表示移除是否成功
   */
  async kickMembers(members, addBlack = false) {
    return await this.api.kickMember(members[0], addBlack, members.slice(1))
  }
}

function normalizeMembers(members) {
  if (typeof members === 'string') {
    return [{ openid: members, time: 0 }]
  }
  if (!Array.isArray(members) || members.length === 0) return null
  if (isObjectArray(members)) {
    return members.map((m) => ({ openid: m.openid, time: m.time ?? 0 }))
  }
  if (members.length % 2 !== 0) return null
  const result = []
  for (let i = 0; i < members.length; i += 2) {
    result.push({ openid: members[i], time: members[i + 1] ?? 0 })
  }
  return result
}

function isObjectArray(obj) {
  return Array.isArray(obj) && obj.every((item) => item !== null && typeof item === 'object' && !Array.isArray(item))
}
