import Config from "#Config"
import { mqqapi, qagent } from "../../model/xiuxian/tools/protocol.js"
import { help, Button } from "../../model/xiuxian/index.js"

export class MozuXiuxianHelp extends plugin {
  constructor() {
    super({
      name: "魔族陌:修仙帮助",
      event: "message",
      priority: Config.xiuxian.setting.priority,
      rule: [
        {
          reg: "#?(魔族陌)?修仙帮助",
          fnc: "xiuxianHelp"
        }
      ]
    })
  }

  async xiuxianHelp(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.xiuxian.setting.enable) return false
    if (Config.xiuxian.setting.group === 1) {
      if (Config.xiuxian.setting.blackGroup.includes(this.e.group_id)) return false
    } else if (Config.xiuxian.setting.group === 2) {
      if (!Config.xiuxian.setting.whiteGroup.includes(this.e.group_id)) return false
    }
    const message = [
      '##✨修仙帮助',
      '>联系主人：' + (await qagent(Config.xiuxian.setting.contact.peerUid, Config.xiuxian.setting.contact.peerName)),
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