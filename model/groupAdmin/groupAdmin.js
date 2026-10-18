import QQBotApi from '../QQBot/interface.js'

export default class GroupAdmin {
  constructor(e) {
    this.api = new QQBotApi(e)
  }

  /**
   * 获取群成员禁言列表
   * @param {String} group_id 群open_id
   */
  async getMuteList() {
    const { members: result } = await this.api.getGroupMuteInfo()
    return result
  }

  /**
   * 禁言群成员
   * @param {string | (string|number)[] | {key: string|number}[]} members 禁言群成员对象数组
   * @returns {boolean} 表示禁言是否成功
   */
  async muteMembers(members) {
    const list = normalizeMembers(members)
    if (!list) return false
    const [first, ...rest] = list
    return await this.api.muteMember(first.openid, first.time ?? 0, rest)
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
