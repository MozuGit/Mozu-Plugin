import { backupKeys, restoreKeys } from "../../scripts/backup.js"
import { Config } from "../../model/xiuxian/tool/Config/Config.js"
import { Version } from "../../model/Config/Version.js"
import { Button } from "../../model/xiuxian/index.js"

export class MozuXiuxianHelp extends plugin {
  constructor() {
    super({
      name: "魔族陌修仙备份",
      event: "message",
      priority: 2000,
      rule: [
        {
          reg: "#?(魔族陌)?修仙备份",
          fnc: "xiuxianBackup"
        }
      ],
      task: [
        {
          cron: Config.setting.backupCron || "0 0 * * * *",
          name: "修仙定时备份",
          fnc: "cronBackup"
        }
      ]
    })
  }

  async xiuxianBackup(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.setting.enable || !this.e.isMaster) return false
    if (Config.setting.group === 1) {
      if (Config.setting.blackGroup.includes(this.e.group_id)) return false
    } else if (Config.setting.group === 2) {
      if (!Config.setting.whiteGroup.includes(this.e.group_id)) return false
    }
    const filename = "/backup/xiuxian/" + formatTime(Math.floor(Date.now() / 1000)) + ".json"
    const data = await backupKeys("Mozu:xiuxian:*", Version.Plugin_Path + filename)
    const message = [
      '<@' + this.e.user_id.replace(`${this.e.self_id}:`, '') + '>',
      '***',
      '**修仙备份成功**',
      '>备份' + data + '个键到：',
      Version.Plugin_Name + filename,
      '***'
    ].join('\n')
    this.e.reply([message, Button.backup])
    return true
  }

  async cronBackup() {
    const filename = "/backup/xiuxian/" + formatTime(Math.floor(Date.now() / 1000)) + ".json"
    const data = await backupKeys("Mozu:xiuxian:*", Version.Plugin_Path + filename)
    logger.info("[魔族陌修仙] 定时备份成功")
    logger.info("[魔族陌修仙] 备份" + data + "个键到" + Version.Plugin_Name + filename)
    return false
  }
}

/**
 * 时间戳转 2026-01-01_08:00 格式
 * @param {number} timestamp 秒级/毫秒级时间戳自动兼容
 * @returns {string} 格式化时间
 */
function formatTime(timestamp) {
  const time = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp
  const d = new Date(time)

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const h = String(d.getHours()).padStart(2, "0")
  const m = String(d.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day}_${h}:${m}`
}