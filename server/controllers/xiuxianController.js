import fs from "node:fs"
import path from "path"
import { readdir, unlink } from "node:fs/promises"

import Redis from '#Redis'
import Config from "#Config"
import { backupKeys, restoreKeys } from "../../scripts/backup.js"
import { Version } from "../../model/Config/Version.js"

export const getInfo = async (req, res) => {
  try {
    const presence = await Redis.sismember("Mozu:panel:token", req.headers.authorization.substring(7))
    if (!presence) {
      return res.status(401).json({
        success: false,
        message: 'token过期或无效'
      })
    }
    const playerCount = parseInt(await Redis.get("Mozu:xiuxian:openid:counter"), 10)
    const sectCount = parseInt(await Redis.get("Mozu:xiuxian:sectid:counter"), 10)
    res.json({
      success: true,
      data: {
        playerCount: playerCount,
        sectCount: sectCount
      }
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const handleCdk = async (req, res) => {
  const presence = await Redis.sismember("Mozu:panel:token", req.headers.authorization.substring(7))
  if (!presence) {
    return res.status(401).json({
      success: false,
      message: 'token过期或无效'
    })
  }
  const { action } = req.query
  try {
    if (action === 'getlist') {
      return await getCdkList(req, res)
    }

    if (action === 'delete') {
      return await deleteCdks(req, res)
    }

    if (action === 'add' || action === 'modify') {
      return await addCdk(req, res)
    }
  } catch (error) {
    res.json({
      success: false,
      message: error.message
    })
  }
}

const getCdkList = async (req, res) => {
  try {
    const cdks = await Redis.smembers("Mozu:xiuxian:cdks")
    const pipeline = Redis.pipeline()
    for (const cdk of cdks) {
      pipeline.hgetall(`Mozu:xiuxian:cdk:${cdk}`)
    }
    const results = await pipeline.exec()
    const cdkInfos = results.map(([err, result], index) => ({
      name: cdks[index].replace("Mozu:xiuxian:cdk:", ""),
      ...result
    }))
    res.json({
      success: true,
      data: {
        cdks: cdkInfos
      }
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const addCdk = async (req, res) => {
  try {
    const { name, genera, forceSetting, cultList, lsList } = req.body
    await Redis.hset(`Mozu:xiuxian:cdk:${name}`, 'value', JSON.stringify({ genera, forceSetting, cultList, lsList }))
    res.json({
      success: true
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const deleteCdks = async (req, res) => {
  try {
    const { list } = req.body
    const pipeline = Redis.pipeline()
    for (const cdk of list) {
      pipeline.del(`Mozu:xiuxian:cdk:${cdk}`)
    }
    await pipeline.exec()
    res.json({
      success: true
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const handlePlayer = async (req, res) => {
  const presence = await Redis.sismember("Mozu:panel:token", req.headers.authorization.substring(7))
  if (!presence) {
    return res.status(401).json({
      success: false,
      message: 'token过期或无效'
    })
  }
  const { action } = req.query
  try {
    if (action === 'getlist') {
      return await getPlayerList(req, res)
    }

    if (action === 'modify') {
      return await modifyPlayer(req, res)
    }

    if (action === 'getrealm') {
      return await getRealm(req, res)
    }
  } catch (error) {
    res.json({
      success: false,
      message: error.message
    })
  }
}

const getPlayerList = async (req, res) => {
  try {
    const { page } = req.query
    const start = page * 10 + 1
    const id = parseInt(await Redis.get('Mozu:xiuxian:openid:counter'), 10)
    if (id < start) {
      return res.json({
        success: true,
        data: {
          players: []
        }
      })
    }
    const end = Math.min(start + 10, id + 1)
    const pipeline = Redis.pipeline()
    for (let i = start; i < end; i++) {
      pipeline.hgetall(`Mozu:xiuxian:playerInfo:${i}`)
    }
    const results = await pipeline.exec()
    const playerInfos = results.map(([err, result], index) => ({
      id: start + index,
      cult: result.修为,
      ls: result.灵石,
      realm: result.境界,
      sex: result.性别,
      titleIndex: result.称号,
      titles: JSON.parse(result.称号列表 || '[]')
    }))
    res.json({
      success: true,
      data: {
        players: playerInfos,
        playerCount: id
      }
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const modifyPlayer = async (req, res) => {
  try {
    const { id } = req.query
    if ((await Redis.exists(`Mozu:xiuxian:playerInfo:${id}`)) === 0) {
      res.json({ success: false, message: "修仙玩家不存在" })
    }
    const { cult, ls, realm, sex, titleIndex, titles } = req.body
    await Redis.hmset(`Mozu:xiuxian:playerInfo:${id}`, {
      修为: cult,
      灵石: ls,
      境界: realm,
      性别: sex,
      称号: titleIndex,
      称号列表: JSON.stringify(titles)
    })
    res.json({ success: true })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const getRealm = async (req, res) => {
  try {
    const data = Config.xiuxian.Realm.Realms.map(realm => realm.name)
    res.json({
      success: true,
      data: ['无', ...data]
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const handleBackup = async (req, res) => {
  const presence = await Redis.sismember("Mozu:panel:token", req.headers.authorization.substring(7))
  if (!presence) {
    return res.status(401).json({
      success: false,
      message: 'token过期或无效'
    })
  }
  const { action } = req.query
  try {
    if (action === 'getlist') {
      return await getBackupList(req, res)
    }

    if (action === 'restore') {
      return await restoreBackup(req, res)
    }

    if (action === 'backup') {
      return await Backup(req, res)
    }

    if (action === 'delete') {
      return await deleteBackup(req, res)
    }
  } catch (error) {
    res.json({
      success: false,
      message: error.message
    })
  }
}

const getBackupList = async (req, res) => {
  try {
    const backupDir = path.join(Version.Plugin_Path, "backup", "xiuxian")
    const files = (await readdir(backupDir)).filter(item => item.endsWith('.json'))
    res.json({
      success: true,
      data: {
        backups: files
      }
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const restoreBackup = async (req, res) => {
  try {
    const { filename } = req.query
    const filePath = path.join(Version.Plugin_Path, "backup", "xiuxian", filename + '.json')
    if (!fs.existsSync(filePath)) {
      return res.json({ success: false, message: "备份文件不存在" })
    }
    await restoreKeys(filePath)
    res.json({ success: true })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const Backup = async (req, res) => {
  try {
    const { filename } = req.query
    const fileTime = formatTime(Date.now())
    const fileName = filename ? filename + '.json' : fileTime + '.json'
    const filePath = path.join(Version.Plugin_Path, "backup", "xiuxian", fileName)
    await backupKeys("Mozu:xiuxian:*", filePath)
    res.json({ success: true })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const deleteBackup = async (req, res) => {
  try {
    const { files } = req.body
    const backupDir = path.join(Version.Plugin_Path, "backup", "xiuxian")
    const removeFiles = files.map(file => path.join(backupDir, file + '.json'))
    await Promise.all(removeFiles.map(file => unlink(file)))
    res.json({ success: true, })
  } catch (error) {
    res.json({ success: false, message: error.message })
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