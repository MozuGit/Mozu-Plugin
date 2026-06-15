import Redis from '#Redis'

import { RegExp, Button } from "../../model/xiuxian/index.js"
import { Config } from "../../model/xiuxian/tool/Config/Config.js"
import { xiuxianText } from "../../model/xiuxian/tool/xiuxianText.js"

export class MozuXiuxian extends plugin {
  constructor() {
    super({
      name: '魔族陌修仙',
      dsc: '魔族陌修仙',
      event: 'message',
      priority: -Infinity,
    })
    this.rule.push(
      {
        reg: RegExp.xiuxian,
        fnc: 'xiuxian'
      }
    )
  }

  async xiuxian(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name)) return false
    const user_id = this.e.user_id.replace(`${this.e.self_id}:`, '')
    //const at = (Array.isArray(this.e.at)) ? this.e.at.map(s => s.replaceAll(`${self_id}:`, '')) : this.e.at.replace(`${self_id}:`, '')
    const message = await xiuxianText(this.e.msg, user_id, this.e.at)
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
  }
}