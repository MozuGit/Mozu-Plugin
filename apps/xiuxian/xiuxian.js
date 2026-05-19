import Redis from '#Redis'

import { RegExp, Button } from "../../model/xiuxian/index.js"
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
      },
      {
        reg: '^#?重置修仙数据$',
        fnc: 'clear'
      }
    )
  }

  async xiuxian(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name)) return false
    const message = await xiuxianText(this.e.msg, this.e.user_id, this.e.self_id)
    let lastText = null
    for (let msg of message) {
      if (msg.type && msg.type === "button") {
        if (lastText !== null) {
          await this.e.reply([lastText, msg])
          lastText = null
        }
      } else {
        if (lastText !== null) {
          await this.e.reply(lastText)
        }
        lastText = msg
      }
    }
    if (lastText !== null) {
      await this.e.reply(lastText)
    }
  }

  async clear(e) {
    if (this.e.isMaster && ['QQBot'].includes(e?.bot?.adapter?.name)) {
      const keys = await Redis.keys("Mozu:xiuxian:*")
      if (keys.length) await Redis.del(keys)
      this.e.reply([`**重置成功，清除了${keys.length}个键**`, segment.button([{ text: "重置修仙数据", callback: "重置修仙数据" }])])
    }
  }
}