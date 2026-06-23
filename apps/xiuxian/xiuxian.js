import Redis from '#Redis'

import { RegExp } from "../../model/xiuxian/index.js"
import { Config } from "../../model/xiuxian/tool/Config/Config.js"
import { xiuxianText } from "../../model/xiuxian/tool/xiuxianText.js"

export class MozuXiuxian extends plugin {
  constructor() {
    super({
      name: '魔族陌修仙',
      dsc: '魔族陌修仙',
      event: 'message',
      priority: Config.setting.priority,
    })
    this.rule.push(
      {
        reg: RegExp.xiuxian,
        fnc: 'xiuxian'
      }
    )
  }

  async xiuxian(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.setting.enable) return false
    if (Config.setting.group === 1) {
      if (Config.setting.blackGroup.includes(this.e.group_id)) return false
    } else if (Config.setting.group === 2) {
      if (!Config.setting.whiteGroup.includes(this.e.group_id)) return false
    }
    const user_id = this.e.user_id.replace(`${this.e.self_id}:`, '')
    const message = await xiuxianText(this.e.msg.replace(/^#/, ''), user_id, this.e.at, this.e.isMaster)
    let lastText = null
    for (let msg of message) {
      if (msg.type && msg.type === "button") {
        if (lastText !== null) {
          await this.e.reply([segment.markdown(lastText), msg])
          lastText = null
        }
      } else {
        if (lastText !== null) {
          await this.e.reply(segment.markdown(lastText))
        }
        lastText = msg
      }
    }
    if (lastText !== null) {
      await this.e.reply(segment.markdown(lastText))
    }
    return false
  }
}