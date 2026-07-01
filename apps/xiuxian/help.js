import help from '../../model/xiuxian/help.js'
import mqqapi from "../../model/xiuxian/tool/mqqapi.js"
import { Config } from "../../model/xiuxian/tool/Config/Config.js"
import { Button } from "../../model/xiuxian/index.js"

export class MozuXiuxianHelp extends plugin {
  constructor() {
    super({
      name: "魔族陌修仙帮助",
      event: "message",
      priority: Config.setting.priority,
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
      '##✨修仙帮助',
      '>联系主人：' + (await mqqapi.qagent('u_KX6qPA4vv-EbmUhf0enyNg', '魔族陌', '3343712589')),
      '修仙指令帮助，bug反馈请联系主人',
      '***',
      '**🎉基础指令**',
      (await commands(help.xiuxian)),
      '***',
      '**🎄宗门指令**',
      (await commands(help.sect)),
      '***',
      '**⭐️排行指令**',
      (await commands(help.rank)),
      '***',
      '**🌈兑换指令**',
      (await commands(help.cdk)),
      '***'
    ].join('\n')
    this.e.reply([message, Button.author])
  }
}

async function commands(commands) {
  let result = ''
  let index = 0
  for (const item of commands) {
    const cmd = await mqqapi.command(item)
    if ((index % 2 === 0 && index > 0) || item.length + commands[commands.length >= index ? index : index + 1].length >= 12) {
      result += '\n'
    }
    result += cmd
    index % 2 === 0 && item.length + commands[commands.length >= index ? index : index + 1].length < 12 ? result += '  |  ' : ''
    index++
  }
  return result
}