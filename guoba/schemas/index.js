import _ from 'lodash'
import path from 'node:path'
import { unflatten } from 'flat'

import { Config } from '../../model/Config/Config.js'
import { Version } from '../../model/Config/Version.js'
import { Config as xxConfig } from '../../model/xiuxian/tool/Config/Config.js'

import Redis from './Redis.js'
import xiuxian from './xiuxian.js'
import makeMessage from './makeMessage.js'

export const schemas = [
  ...Redis,
  ...xiuxian,
  ...makeMessage
]

export function getConfigData() {
  return {
    redis: {
      host: Config.Redis.host,
      port: Config.Redis.port,
      database: Config.Redis.database,
      connectTimeout: Config.Redis.connectTimeout,
      keepAlive: Config.Redis.keepAlive,
      noDelay: Config.Redis.noDelay,
      global: Config.Redis.global
    },
    makeMessage: {
      enable: Config.makeMessage.enable,
      onlyMaster: Config.makeMessage.onlyMaster,
      whiteQQList: Config.makeMessage.whiteQQList,
      repeatCount: Config.makeMessage.repeatCount
    },
    xiuxian: {
      setting: {
        enable: xxConfig.setting.enable,
        master_no_cd: xxConfig.setting.master_no_cd,
        forceSharp: xxConfig.setting.forceSharp,
        group: xxConfig.setting.group,
        blackGroup: xxConfig.setting.blackGroup,
        whiteGroup: xxConfig.setting.whiteGroup,
        TextStyle: xxConfig.setting.TextStyle,
        priority: xxConfig.setting.priority,
        cronBackup: xxConfig.setting.cronBackup
      },
      xiuxian: {
        xiulian: xxConfig.xiuxian.xiulian,
        kaicai: xxConfig.xiuxian.kaicai,
        range: {
          maxcult: xxConfig.xiuxian.maxcult,
          mincult: xxConfig.xiuxian.mincult,
          maxls: xxConfig.xiuxian.maxls,
          minls: xxConfig.xiuxian.minls
        },
        retreat: xxConfig.xiuxian.retreat,
        sign: xxConfig.xiuxian.sign,
        pvp: xxConfig.xiuxian.pvp,
        powerFormula: xxConfig.xiuxian.powerFormula
      },
      realm: xxConfig.Realm.Realms,
      sect: {
        sect_up_reset: xxConfig.sect.sect_up_reset,
        create_sect_ls: xxConfig.sect.create_sect_ls,
        sect_level: xxConfig.sect.sect_level
      }
    }
  }
}

export function setConfigData(data, { Result }) {
  const nested = unflatten(data)
  redisConfig(nested)
  makeMessageConfig(nested)
  xiuxianConfig(nested)
  return Result.ok({}, "保存成功喵~")
}

function redisConfig(data) {
  Object.keys(data.redis).forEach(key => {
    Config.modify('Redis', key, data.redis[key])
  })
}

function makeMessageConfig(data) {
  Object.keys(data.makeMessage).forEach(key => {
    Config.modify('makeMessage', key, data.makeMessage[key])
  })
}

function xiuxianConfig(data) {
  Object.keys(data.xiuxian.setting).forEach(key => {
    xxConfig.modify('setting', key, data.xiuxian.setting[key])
  })
  Object.keys(data.xiuxian.xiuxian).forEach(key => {
    if (key === "range") {
      Object.keys(data.xiuxian.xiuxian.range).forEach(key => {
        xxConfig.modify('xiuxian', key, data.xiuxian.xiuxian.range[key])
      })
    } else {
      xxConfig.modify('xiuxian', key, data.xiuxian.xiuxian[key])
    }
  })
  xxConfig.modify('Realm', "Realms", data.xiuxian.realm)
  Object.keys(data.xiuxian.sect).forEach(key => {
    xxConfig.modify('sect', key, data.xiuxian.sect[key])
  })
}