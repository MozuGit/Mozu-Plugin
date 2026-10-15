import Redis from '#Redis'
import Config from '#Config'

import QQBot from '../QQBot/interface.js'

export default class GroupAdmin {
  constructor(e) {
    this.e = e
    this.Bot = e.bot ?? Bot
  }

  /**
   * 获取群成员禁言列表
   * @param {String} group_id 群open_id
   * @param {Boolean} info 输出禁言成员详细信息
   */
  async getMuteList(group_id, info = false) {
    //待更新
  }
}
