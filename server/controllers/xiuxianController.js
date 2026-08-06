import fs from "node:fs"
import { rm, cp } from 'fs/promises'
import path from "path"
import { readdir, unlink } from "node:fs/promises"

import Redis from '#Redis'
import Config from "#Config"
import { backupKeys, restoreKeys } from "../../scripts/backup.js"
import { Version } from "../../model/Config/Version.js"

import xiuxianElements from "../../guoba/schemas/xiuxian.js"

export const getInfo = async (req, res) => {
  try {
    const auth = await validateToken(req)
    if (!auth.valid) {
      return res.status(401).json({
        success: false,
        message: auth.error
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

export const handleConfig = async (req, res) => {
  const auth = await validateToken(req)
  if (!auth.valid) {
    return res.status(401).json({
      success: false,
      message: auth.error
    })
  }
  const { action } = req.query
  try {
    if (action === 'get_config') {
      return await getConfig(req, res)
    }

    if (action === 'get_config_elements') {
      return await getConfigElements(req, res)
    }

    if (action === 'save_config') {
      return await saveConfig(req, res)
    }

    if (action === 'reset') {
      return await resetConfig(req, res)
    }

    if (action === 'get_groups') {
      return await getGroups(req, res)
    }
  } catch (error) {
    res.json({
      success: false,
      message: error.message
    })
  }
}

const getConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        config: Config.getCfg().xiuxian
      }
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const getConfigElements = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        elements: xiuxianElements
      }
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const saveConfig = async (req, res) => {
  try {
    const xiuxianData = req.body
    if (!xiuxianData) return
    const configMappings = [
      { file: 'setting', data: xiuxianData.setting },
      { file: 'sect', data: xiuxianData.sect },
      { file: 'title', data: xiuxianData.title },
      { file: 'beast', data: xiuxianData.beast },
    ]
    for (const { file, data } of configMappings) {
      if (data && typeof data === 'object') {
        Object.keys(data).forEach(key => {
          Config.modify('xiuxian', file, key, data[key])
        })
      }
    }
    if (xiuxianData.xiuxian && typeof xiuxianData.xiuxian === 'object') {
      Object.keys(xiuxianData.xiuxian).forEach(key => {
        if (key === "range") {
          const rangeData = xiuxianData.xiuxian.range
          if (rangeData && typeof rangeData === 'object') {
            Object.keys(rangeData).forEach(rangeKey => {
              Config.modify('xiuxian', rangeKey, rangeData[rangeKey])
            })
          }
        } else {
          Config.modify('xiuxian', key, xiuxianData.xiuxian[key])
        }
      })
    }
    if (xiuxianData.realm) {
      Config.modify('xiuxian', 'Realm', "Realms", xiuxianData.realm)
    }
    if (xiuxianData.drop) {
      if (hasRepeatedId(xiuxianData.drop.pills, xiuxianData.drop.arts)) {
        return res.json({
          success: false,
          message: "物品ID重复"
        })
      }
      const cleanRealms = xiuxianData.drop.secretRealms?.map(realm => {
        const { pills, arts, ...cleanRealm } = realm
        return cleanRealm
      })
      if (cleanRealms) {
        Config.modify('xiuxian', 'drop', 'secretRealms', cleanRealms)
      }
      const keysToSkip = ['secretRealms', 'pills', 'arts']
      Object.keys(xiuxianData.drop).forEach(key => {
        if (!keysToSkip.includes(key)) {
          Config.modify('xiuxian', 'drop', key, xiuxianData.drop[key])
        }
      })
      if (xiuxianData.drop.pills) {
        Config.modify('xiuxian', 'drop', 'pills', xiuxianData.drop.pills)
      }
      if (xiuxianData.drop.arts) {
        Config.modify('xiuxian', 'drop', 'arts', xiuxianData.drop.arts)
      }
    }
    res.json({
      success: true,
      message: "保存成功喵~"
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const resetConfig = async (req, res) => {
  try {
    const srcPath = path.join(Version.Plugin_Path, 'config', 'xiuxian', 'default')
    const destPath = path.join(Version.Plugin_Path, 'config', 'xiuxian', 'config')

    await rm(destPath, { recursive: true, force: true })
    await cp(srcPath, destPath, { recursive: true })

    res.json({ success: true, message: "重置修仙配置成功喵~" })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const getGroups = async (req, res) => {
  try {
    const result = Array.from(Bot.gl.values())
      .filter(item => item.group_id !== "stdin")
      .map(item => ({
        groupId: item.group_id,
        name: item.group_name || item.nickname || item.group_id
      }))
    res.json({
      success: true,
      data: {
        groups: result
      }
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

function hasRepeatedId(...args) {
  const seen = new Set()
  for (const arr of args) {
    if (!Array.isArray(arr)) continue
    for (const item of arr) {
      if (!item?.id) continue
      if (seen.has(item.id)) {
        return true
      }
      seen.add(item.id)
    }
  }
  return false
}

export const handleCdk = async (req, res) => {
  const auth = await validateToken(req)
  if (!auth.valid) {
    return res.status(401).json({
      success: false,
      message: auth.error
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
    const { name, genera, forceSetting, cultList, lsList, useStatus, useId, useTime } = req.body
    await Redis.hmset(`Mozu:xiuxian:cdk:${name}`, {
      value: JSON.stringify({ genera, forceSetting, cultList, lsList }),
      使用状态: useStatus,
      使用ID: useId,
      使用时间: useTime
    })
    await Redis.sadd("Mozu:xiuxian:cdks", name)
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
      pipeline.srem("Mozu:xiuxian:cdks", cdk)
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
  const auth = await validateToken(req)
  if (!auth.valid) {
    return res.status(401).json({
      success: false,
      message: auth.error
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

export const handleSect = async (req, res) => {
  const auth = await validateToken(req)
  if (!auth.valid) {
    return res.status(401).json({
      success: false,
      message: auth.error
    })
  }
  const { action } = req.query
  try {
    if (action === 'getlist') {
      return await getSectList(req, res)
    }

    if (action === 'modify') {
      return await modifySect(req, res)
    }
  } catch (error) {
    res.json({
      success: false,
      message: error.message
    })
  }
}

const getSectList = async (req, res) => {
  try {
    const { page } = req.query
    const start = page * 10 + 1
    const sectCount = parseInt(await Redis.get('Mozu:xiuxian:sectid:counter'), 10)
    if (sectCount < start) {
      return res.json({
        success: true,
        data: {
          sects: []
        }
      })
    }
    const end = Math.min(start + 10, sectCount + 1)
    const pipeline = Redis.pipeline()
    for (let i = start; i < end; i++) {
      pipeline.hgetall(`Mozu:xiuxian:sectInfo:${i}`)
    }
    const results = await pipeline.exec()
    const sectInfos = results.map(([err, result], index) => ({
      id: start + index,
      name: result.宗门名称,
      level: result.宗门等级,
      desc: result.宗门简介,
      exp: result.宗门经验,
      noAudit: result.无需审核状态
    }))
    res.json({
      success: true,
      data: {
        sects: sectInfos,
        sectCount: sectCount,
        max_level: Config.xiuxian.sect.sect_level.length
      }
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const modifySect = async (req, res) => {
  try {
    const { sectid } = req.query
    const { name, level, desc, exp, noAudit } = req.body
    await Redis.hmset(`Mozu:xiuxian:sectInfo:${sectid}`, {
      宗门名称: name,
      宗门等级: level,
      宗门简介: desc,
      宗门经验: exp,
      无需审核状态: noAudit
    })
    res.json({ success: true })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const handleBackup = async (req, res) => {
  const auth = await validateToken(req)
  if (!auth.valid) {
    return res.status(401).json({
      success: false,
      message: auth.error
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

async function validateToken(req) {
  const authHeader = req?.headers?.authorization
  if (!authHeader) {
    return { valid: false, error: '未登录，请先登录' }
  }
  if (!authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'token 格式错误' }
  }
  const token = authHeader.substring(7);
  if (!token || token.length === 0) {
    return { valid: false, error: 'token 为空' }
  }
  try {
    const presence = await Redis.sismember("Mozu:panel:token", token)
    if (!presence) {
      return { valid: false, error: 'token 无效或已过期' }
    }
    return { valid: true, token }
  } catch (error) {
    return { valid: false, error: '认证服务异常' }
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