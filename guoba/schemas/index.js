import _ from 'lodash'
import fs from 'fs/promises'
import path from 'node:path'
import { unflatten } from 'flat'

import Redis from '#Redis'
import Config from "#Config"
import { Version } from '../../model/Config/Version.js'

import RedisConfig from './Redis.js'
import xiuxian from './xiuxian.js'
import makeMessage from './makeMessage.js'
import xiuxianTools from './xiuxian-tools.js'
import fayan from './fayan.js'

export const schemas = [
  ...RedisConfig,
  ...xiuxian,
  ...xiuxianTools,
  ...makeMessage,
  ...fayan
]

export function getConfigData() {
  return {
    ...Config.getCfg(),
    tools: {
      title: {
        id: 1,
        title: "默认文本",
        validDay: 0
      }
    }
  }
}

export function setConfigData(data, { Result }) {
  const nested = unflatten(data)

  batchModifyConfig([
    { dir: 'config', file: 'Redis', data: nested.config.Redis },
    { dir: 'config', file: 'makeMessage', data: nested.config.makeMessage },
    { dir: 'config', file: 'fayan', data: nested.config.fayan },
    { dir: 'xiuxian', file: 'setting', data: nested.xiuxian.setting },
  ])
  const xiuxianError = handleXiuxianConfig(nested.xiuxian)
  if (xiuxianError) {
    return Result.error(xiuxianError)
  }
  return Result.ok({}, "保存成功喵~")
}

function batchModifyConfig(configs) {
  for (const { dir, file, data } of configs) {
    if (!data || typeof data !== 'object') continue

    Object.keys(data).forEach(key => {
      Config.modify(dir, file, key, data[key])
    })
  }
}

function handleXiuxianConfig(xiuxianData) {
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
      return "物品ID重复"
    }
    Object.keys(xiuxianData.drop).forEach(key => {
      Config.modify('xiuxian', 'drop', key, xiuxianData.drop[key])
    })
  }
}

export const actions = {
  resetxxConfig: async (params, { Result }) => {
    try {
      const srcPath = path.join(Version.Plugin_Path, 'config', 'xiuxian', 'default')
      const destPath = path.join(Version.Plugin_Path, 'config', 'xiuxian', 'config')

      await fs.rm(destPath, { recursive: true, force: true })
      await fs.cp(srcPath, destPath, { recursive: true })

      return Result.ok({}, "重置修仙配置成功喵~")
    } catch (error) {
      return Result.error('重置配置失败: ' + error.message)
    }
  },
  removeCdk: async (cdks, { Result }) => {
    if (!cdks?.length || (cdks.length === 1 && cdks[0] === "[object Object]")) {
      return Result.error("未选中兑换码")
    }
    const pipeline = Redis.pipeline()
    for (const cdk of cdks) {
      pipeline.del(`Mozu:xiuxian:cdk:${cdk}`)
    }
    await pipeline.exec()
    return Result.ok({}, "删除兑换码成功")
  },
  addTitle: async (params, { Result }) => {
    const [title, id, validDay] = params
    if (!title || !id || !validDay) {
      return Result.error("参数缺失")
    }
    const days = parseInt(validDay, 10)
    if (isNaN(days)) {
      return Result.error("有效天数必须是数字")
    }
    const playerKey = `Mozu:xiuxian:playerInfo:${id}`
    const exists = await Redis.exists(playerKey)
    if (exists === 0) {
      return Result.error("修仙ID不存在")
    }
    const nowTime = Math.floor(Date.now() / 1000)
    const titleList = JSON.parse(await Redis.hget(playerKey, '称号列表') || '[]')
    const existingTitle = titleList.find(item => item.title === title)
    const validTime = days !== 0 ? nowTime + days * 86400 : 0
    if (existingTitle) {
      existingTitle.validTime = validTime
    } else {
      titleList.push({
        title,
        getTime: nowTime,
        validTime
      })
    }
    await Promise.all([
      Redis.hset(playerKey, '称号列表', JSON.stringify(titleList)),
      Redis.sadd('Mozu:xiuxian:title:owners', id)
    ])
    return Result.ok({}, "给予称号成功")
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