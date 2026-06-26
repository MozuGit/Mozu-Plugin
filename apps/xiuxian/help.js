import help from '../../model/xiuxian/help.js'
import { Config } from "../../model/xiuxian/tool/Config/Config.js"

export class MozuXiuxianHelp extends plugin {
  constructor() {
    super({
      name: "魔族陌修仙帮助",
      event: "message",
      priority: 2000,
      rule: [
        {
          reg: "#?(魔族陌)?修仙帮助",
          fnc: "xiuxianHelp"
        }
      ]
    })
  }

  async xiuxianHelp(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.setting.enable) return false
    if (Config.setting.group === 1) {
      if (Config.setting.blackGroup.includes(this.e.group_id)) return false
    } else if (Config.setting.group === 2) {
      if (!Config.setting.whiteGroup.includes(this.e.group_id)) return false
    }
    const message = [
      '#✨修仙帮助',
      '***',
      '**🎉基础指令**',
      commands(help.xiuxian),
      '***',
      '**🎄宗门指令**',
      commands(help.sect),
      '***',
      '**⭐️排行指令**',
      commands(help.rank),
      '***',
      '**🌈兑换指令**',
      commands(help.cdk),
      '***'
    ].join('\n')
    this.e.reply(message)
  }
}

function commands(commands) {
  const result = commands.map(item => `[${item.replace('/', '')}](mqqapi://aio/inlinecmd?command=${item})`)
  return result.join('  |  ')
}