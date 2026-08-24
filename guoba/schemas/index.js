import _ from 'lodash'
import fs from 'fs/promises'
import path from 'node:path'
import crypto from 'crypto'
import { unflatten } from 'flat'

import Redis from '#Redis'
import Config from "#Config"
import { Version } from '../../model/Config/Version.js'

import RedisConfig from './Redis.js'
import panel from './panel.js'
import xiuxian from './xiuxian.js'
import makeMessage from './makeMessage.js'
import fayan from './fayan.js'
import openai from './openai.js'
import _interface from './interface.js'

export const schemas = [
  ...RedisConfig,
  ...panel,
  ...xiuxian,
  ...makeMessage,
  ...fayan,
  ...openai,
  ..._interface
]

export function getConfigData() {
  return {
    ...Config.getCfg(),
    panel: {
      ...Config.getCfg().panel,
      login: {
        ...Config.getCfg().panel.login,
        password: ''
      }
    }
  }
}

export function setConfigData(data, { Result }) {
  const nested = unflatten(data)
  if (nested.panel.login.password) {
    nested.panel.login.password = crypto.createHash('sha256').update(nested.panel.login.password).digest('hex')
  } else {
    nested.panel.login.password = Config.panel.login.password
  }
  batchModifyConfig([
    { dir: 'config', file: 'Redis', data: nested.config.Redis },
    { dir: 'config', file: 'makeMessage', data: nested.config.makeMessage },
    { dir: 'config', file: 'fayan', data: nested.config.fayan },
    { dir: 'config', file: 'openai', data: nested.config.openai },
    { dir: 'config', file: 'interface', data: nested.config.interface },
    { dir: 'panel', file: 'login', data: nested.panel.login },
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
  if (xiuxianData.sroot) {
    if (hasRepeatedId(xiuxianData.sroot.sroot)) {
      return "灵根ID重复"
    }
    if (Object.values(xiuxianData.sroot.root_drop).reduce((a, b) => a + b, 0) !== 100) {
      return "灵根概率总和不等于100"
    }
    Object.keys(xiuxianData.sroot).forEach(key => {
      Config.modify('xiuxian', 'sroot', key, xiuxianData.sroot[key])
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