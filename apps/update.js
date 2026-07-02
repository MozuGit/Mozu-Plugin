import { Version } from "../model/Config/Version.js"

let Update = null
try {
  Update = (await import("../../other/update.js").catch(e => null))?.update
  Update ||= (await import("../../system/apps/update.ts")).update
} catch (e) {
  logger.error(`[${Version.Plugin_Name}]未获取到更新js ${logger.yellow("更新功能")} 将无法使用`)
}

export class update extends plugin {
  constructor() {
    super({
      name: "魔族陌更新插件",
      event: "message",
      priority: 1145,
      rule: [
        {
          reg: `^#*(魔族陌|${Version.Plugin_Name})(插件)?(强制)?更新$|^#*(强制)?更新(推送|${Version.Plugin_Name})(插件)?$`,
          fnc: "update"
        },
        {
          reg: `^#?(魔族陌|${Version.Plugin_Name})(插件)?更新日志$`,
          fnc: "update_log"
        }
      ]
    })
  }

  async update(e = this.e) {
    if (!e.isMaster) return
    e.msg = `#${e.msg.includes("强制") ? "强制" : ""}更新${Version.Plugin_Name}`
    const up = new Update(e)
    up.e = e
    return up.update()
  }

  async update_log() {
    let Update_Plugin = new Update()
    Update_Plugin.e = this.e
    Update_Plugin.reply = this.reply

    if (Update_Plugin.getPlugin(Version.Plugin_Name)) {
      this.e.reply(await Update_Plugin.getLog(Version.Plugin_Name))
    }
    return true
  }
}
