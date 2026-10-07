import _ from 'lodash'
import fs from 'fs/promises'
import path from 'node:path'
import crypto from 'crypto'
import { unflatten } from 'flat'

import Config from '#Config'
import { Version } from '../../model/Config/Version.js'

import RedisConfig from './Redis.js'
import panel from './panel.js'
import xiuxian from './xiuxian.js'
import makeMessage from './makeMessage.js'
import fayan from './fayan.js'
import like from './like.js'
import whois from './whois.js'
import openai from './openai.js'
import _interface from './interface.js'

export const schemas = [
  ...RedisConfig,
  ...panel,
  ...xiuxian,
  ...makeMessage,
  ...fayan,
  ...like,
  ...whois,
  ...openai,
  ..._interface,
]

export function getConfigData() {
  const panel = Config.getCfg().panel
  return {
    ...Config.getCfg(),
    panel: {
      ...panel,
      login: {
        ...panel.login,
        password: '',
        totp: {
          ...panel.login?.totp,
          secret: '',
        },
      },
    },
  }
}

export function setConfigData(data, { Result }) {
  const nested = unflatten(data)
  if (nested.panel.login.password) {
    nested.panel.login.password = crypto.createHash('sha256').update(nested.panel.login.password).digest('hex')
  } else {
    nested.panel.login.password = Config.panel.login.password
  }
  if (!nested.panel.login.totp?.secret) {
    nested.panel.login.totp = {
      ...nested.panel.login.totp,
      secret: Config.panel.login.totp?.secret || '',
    }
  }
  const xiuxianError = validateXiuxianConfig(nested.xiuxian)
  if (xiuxianError) {
    return Result.error(xiuxianError)
  }
  batchModifyConfig([
    { dir: 'config', file: 'Redis', data: nested.config.Redis },
    { dir: 'config', file: 'openai', data: nested.config.openai },
    { dir: 'config', file: 'interface', data: nested.config.interface },
    { dir: 'example', file: 'makeMessage', data: nested.example.makeMessage },
    { dir: 'example', file: 'fayan', data: nested.example.fayan },
    { dir: 'example', file: 'like', data: nested.example.like },
    { dir: 'example', file: 'whois', data: nested.example.whois },
    { dir: 'panel', file: 'login', data: nested.panel.login },
  ])
  handleXiuxianConfig(nested.xiuxian)
  return Result.ok({}, '保存成功喵~')
}

function batchModifyConfig(configs) {
  for (const { dir, file, data } of configs) {
    if (!data || typeof data !== 'object') continue

    Object.keys(data).forEach((key) => {
      Config.modify(dir, file, key, data[key])
    })
  }
}

function validateXiuxianConfig(xiuxianData) {
  if (!xiuxianData) return
  if (xiuxianData.drop) {
    if (hasRepeatedId(xiuxianData.drop.pills, xiuxianData.drop.arts)) {
      return '物品ID重复'
    }
  }
  if (xiuxianData.sroot) {
    if (hasRepeatedId(xiuxianData.sroot.sroot)) {
      return '灵根ID重复'
    }
    if (Object.values(xiuxianData.sroot.root_drop).reduce((a, b) => a + b, 0) !== 100) {
      return '灵根概率总和不等于100'
    }
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
      Object.keys(data).forEach((key) => {
        Config.modify('xiuxian', file, key, data[key])
      })
    }
  }
  if (xiuxianData.xiuxian && typeof xiuxianData.xiuxian === 'object') {
    Object.keys(xiuxianData.xiuxian).forEach((key) => {
      if (key === 'range') {
        const rangeData = xiuxianData.xiuxian.range
        if (rangeData && typeof rangeData === 'object') {
          Config.modify('xiuxian', 'xiuxian', 'range', rangeData)
        }
      } else {
        Config.modify('xiuxian', 'xiuxian', key, xiuxianData.xiuxian[key])
      }
    })
  }
  if (xiuxianData.realm) {
    Config.modify('xiuxian', 'Realm', 'Realms', xiuxianData.realm)
  }
  if (xiuxianData.drop) {
    const cleanRealms = xiuxianData.drop.secretRealms?.map((realm) => {
      const { pills, arts, ...cleanRealm } = realm
      return cleanRealm
    })
    if (cleanRealms) {
      Config.modify('xiuxian', 'drop', 'secretRealms', cleanRealms)
    }
    const keysToSkip = ['secretRealms', 'pills', 'arts']
    Object.keys(xiuxianData.drop).forEach((key) => {
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
    Object.keys(xiuxianData.sroot).forEach((key) => {
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

      return Result.ok({}, '重置修仙配置成功喵~')
    } catch (error) {
      return Result.error('重置配置失败: ' + error.message)
    }
  },
  forceClose: async (params, { Result }) => {
    try {
      Config.modify('panel', 'login', 'totp.enabled', false)
      Config.modify('panel', 'login', 'totp.secret', '')
      return Result.ok({}, '强制关闭TOTP成功喵~')
    } catch (error) {
      return Result.error('强制关闭失败: ' + error.message)
    }
  },
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
