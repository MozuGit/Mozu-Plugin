import Redis from '#Redis'

import { xxRegExp, Button } from "../../model/xiuxian/index.js"
import { Config } from "../../model/xiuxian/tool/Config/Config.js"
import { xiuxianText } from "../../model/xiuxian/tool/xiuxianText.js"

const prefix = Config.setting.forceSharp ? '^#' : '^#?'
const xiuxianRegExp = new RegExp(`${prefix}${await xxRegExp.getRegExp()}$`)

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
        reg: xiuxianRegExp,
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
    return await this.e.reply([await xiuxianText(this.e.msg, this.e.user_id, this.e.self_id), Button.xiuxian])
  }

  async clear(e) {
    if (this.e.isMaster && ['QQBot'].includes(e?.bot?.adapter?.name)) {
      const keys = await Redis.keys("Mozu:xiuxian:*")
      if (keys.length) await Redis.del(keys)
      this.e.reply([`**重置成功，清除了${keys.length}个键**`, segment.button([{ text: "重置修仙数据", callback: "重置修仙数据" }])])
    }
  }
}