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
}
