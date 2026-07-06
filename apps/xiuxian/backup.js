import fs from "node:fs"
import path from "path"
import { readdir, unlink } from "node:fs/promises"

import mqqapi from "../../model/xiuxian/tool/mqqapi.js"
import { backupKeys, restoreKeys } from "../../scripts/backup.js"
import { Config } from "../../model/xiuxian/tool/Config/Config.js"
import { Version } from "../../model/Config/Version.js"
import { Button } from "../../model/xiuxian/index.js"

export class MozuXiuxianBackup extends plugin {
  constructor() {
    super({
      name: "修仙备份",
      event: "message",
      priority: Config.setting.priority,
      rule: [
        {
          reg: "#?(?:魔族陌)?修仙备份(?:还原(.*))?$",
          fnc: "xiuxianBackup"
        }
      ],
      task: [
        {
          cron: Config.setting.cronBackup || "0 0 * * * *",
          name: "修仙定时备份",
          fnc: () => this.cronBackup()
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
    if (this.e.msg.includes("还原")) {
      const match = this.e.msg.match(/#?(?:魔族陌)?修仙备份(?:还原(.*))?$/)
      const raw = match?.[1]?.trim()
      const filename = raw ? (raw.endsWith('.json') ? raw : raw + '.json') : null
      const filePath = path.join(Version.Plugin_Path, "backup", "xiuxian", filename)
      if (fs.existsSync(filePath)) {
        const result = await restoreKeys(filePath)
        const message = [
          '<@' + this.e.user_id.replace(`${this.e.self_id}:`, '') + '>',
          '***',
          '**修仙备份还原成功**',
          '>还原' + result + '个键',
          '来自文件' + Version.Plugin_Name + '/' + filename,
          '***'
        ].join('\n')
        this.e.reply([message, Button.backup])
      } else {
        const backupDir = path.join(Version.Plugin_Path, "backup", "xiuxian")
        const files = (await readdir(backupDir)).filter(item => item.endsWith('.json'))
        const backupItems = await Promise.all(files.map(async (item) => {
          return item + '\n' + (await mqqapi.command('[点击还原]', '修仙备份还原' + item, true))
        }))
        const message = [
          '<@' + this.e.user_id.replace(`${this.e.self_id}:`, '') + '>',
          '***',
          '**文件不存在**',
          '>请确认文件是否存在',
          '***',
          '**还原备份文件**',
          '>**' + backupItems.reverse().slice(0, parseInt(Config.setting.maxBackupFile, 10) || 10).join("**\n>**") + '**',
          '***'
        ].join('\n')
        this.e.reply([message, Button.backup])
      }
    } else {
      const filename = "/backup/xiuxian/" + formatTime(Math.floor(Date.now() / parseInt(Config.setting.maxBackupFile, 10) || 1000)) + ".json"
      const filePath = path.join(Version.Plugin_Path, "backup", "xiuxian", formatTime(Math.floor(Date.now() / parseInt(Config.setting.maxBackupFile, 10) || 1000)) + ".json")
      const result = await backupKeys("Mozu:xiuxian:*", filePath)
      const message = [
        '<@' + this.e.user_id.replace(`${this.e.self_id}:`, '') + '>',
        '***',
        '**修仙备份成功**',
        '>备份' + result + '个键到：',
        Version.Plugin_Name + filename,
        '***'
      ].join('\n')
      this.e.reply([message, Button.backup])
      if (Config.setting.maxBackupFile > 0) {
        const backupDir = path.join(Version.Plugin_Path, "backup", "xiuxian")
        const files = (await readdir(backupDir)).filter(item => item.endsWith('.json')).reverse()
        const removeFiles = files.splice(parseInt(Config.setting.maxBackupFile, 10) || 10, files.length)
        for (let file of removeFiles) {
          unlink(path.join(backupDir, file))
        }
      }
    }
    return true
  }

  async cronBackup() {
    const filename = "/backup/xiuxian/" + formatTime(Math.floor(Date.now() / parseInt(Config.setting.maxBackupFile, 10) || 1000)) + ".json"
    const filePath = path.join(Version.Plugin_Path, "backup", "xiuxian", formatTime(Math.floor(Date.now() / parseInt(Config.setting.maxBackupFile, 10) || 1000)) + ".json")
    const result = await backupKeys("Mozu:xiuxian:*", filePath)
    if (Config.setting.maxBackupFile > 0) {
      const backupDir = path.join(Version.Plugin_Path, "backup", "xiuxian")
      const files = (await readdir(backupDir)).filter(item => item.endsWith('.json')).reverse()
      const removeFiles = files.splice(parseInt(Config.setting.maxBackupFile, 10) || 10, files.length)
      for (let file of removeFiles) {
        unlink(path.join(backupDir, file))
      }
    }
    logger.info("[魔族陌修仙] 定时备份成功")
    logger.info("[魔族陌修仙] 备份" + result + "个键到" + Version.Plugin_Name + filename)
    return false
  }
}

/**
 * 时间戳转 2026-01-01_08:00 格式
 * @param {number} timestamp 秒级/毫秒级时间戳自动兼容
 * @returns {string} 格式化时间
 */
function formatTime(timestamp) {
  const time = timestamp.toString().length === parseInt(Config.setting.maxBackupFile, 10) || 10 ? timestamp * parseInt(Config.setting.maxBackupFile, 10) || 1000 : timestamp
  const d = new Date(time)

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const h = String(d.getHours()).padStart(2, "0")
  const m = String(d.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day}_${h}:${m}`
}