import _ from 'lodash'
import fs from 'fs/promises'
import path from 'node:path'
import { unflatten } from 'flat'

import Redis from '#Redis'
import { Config } from '../../model/Config/Config.js'
import { Version } from '../../model/Config/Version.js'
import { Config as xxConfig } from '../../model/xiuxian/tools/Config/Config.js'

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
    fayan: {
      enable: Config.fayan.enable,
      sendMarkdown: Config.fayan.sendMarkdown,
      count: Config.fayan.count
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
        cronBackup: xxConfig.setting.cronBackup,
        maxBackupFile: xxConfig.setting.maxBackupFile,
        contact: xxConfig.setting.contact
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
      beast: {
        beasts: xxConfig.beast.beasts,
        huntBeastCD: xxConfig.beast.huntBeastCD
      },
      sect: {
        sect_up_reset: xxConfig.sect.sect_up_reset,
        create_sect_ls: xxConfig.sect.create_sect_ls,
        sect_level: xxConfig.sect.sect_level
      },
      title: {
        rankTitle: xxConfig.title.rankTitle,
        cleanTitle: xxConfig.title.cleanTitle
      },
      drop: {
        secretRealm_limit: xxConfig.drop.secretRealm_limit,
        secretRealms: xxConfig.drop.secretRealms,
        pills: xxConfig.drop.pills,
        arts: xxConfig.drop.arts
      },
      tools: {
        title: {
          title: "默认称号",
          id: 1,
          validDay: 0
        }
      }
    }
  }
}

export function setConfigData(data, { Result }) {
  const nested = unflatten(data)
  redisConfig(nested)
  makeMessageConfig(nested)
  fayanConfig(nested)
  const xiuxian = xiuxianConfig(nested)
  if (xiuxian) {
    return Result.error(xiuxian)
  }
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

function fayanConfig(data) {
  Object.keys(data.fayan).forEach(key => {
    Config.modify('fayan', key, data.fayan[key])
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
  Object.keys(data.xiuxian.title).forEach(key => {
    xxConfig.modify('title', key, data.xiuxian.title[key])
  })
  Object.keys(data.xiuxian.beast).forEach(key => {
    xxConfig.modify('beast', key, data.xiuxian.beast[key])
  })
  if (hasRepeatedId(data.xiuxian.drop.pills, data.xiuxian.drop.arts)) {
    return "物品ID重复"
  }
  Object.keys(data.xiuxian.drop).forEach(key => {
    xxConfig.modify('drop', key, data.xiuxian.drop[key])
  })
}

export const actions = {
  resetxxConfig: async (params, { Result }) => {
    await fs.cp(path.join(Version.Plugin_Path, 'config', 'xiuxian', 'default'), path.join(Version.Plugin_Path, 'config', 'xiuxian', 'config'), { recursive: true })
    return Result.ok({}, "重置修仙配置成功喵~")
  },
  removeCdk: async (cdks, { Result }) => {
    if (!cdks[0] || cdks[0] === "[object Object]") return Result.error("未选中兑换码")
    const pipeline = Redis.pipeline()
    for (const cdk of cdks) {
      pipeline.del(`Mozu:xiuxian:cdk:${cdk}`)
    }
    await pipeline.exec()
    return Result.ok({}, "删除兑换码成功")
  },
  addTitle: async (params, { Result }) => {
    let [title, id, validDay] = params
    if (!title || !id || !validDay) return Result.error("参数缺失")
    validDay = parseInt(validDay, 10)
    if ((await Redis.exists(`Mozu:xiuxian:playerInfo:${id}`)) === 0) return Result.error("修仙ID不存在")
    const nowTime = Math.floor(Date.now() / 1000)
    let titleList = JSON.parse(await Redis.hget(`Mozu:xiuxian:playerInfo:${id}`, '称号列表') || '[]')
    const titleIndex = titleList.find(item => item.title === title)
    if (titleIndex) {
      titleIndex.validTime = validDay !== 0 ? nowTime + validDay * 86400 : 0
    } else {
      titleList.push({ title: title, getTime: nowTime, validTime: validDay !== 0 ? nowTime + validDay * 86400 : 0 })
    }
    await Redis.hset(`Mozu:xiuxian:playerInfo:${id}`, '称号列表', JSON.stringify(titleList))
    await Redis.sadd('Mozu:xiuxian:title:owners', id)
    return Result.ok({}, "给予称号成功")
  }
}

function hasRepeatedId(...args) {
  const seen = new Set()
  for (let i = 0; i < args.length; i++) {
    const arr = args[i]
    for (let j = 0; j < arr.length; j++) {
      const id = arr[j].id
      if (seen.has(id)) return true
      seen.add(id)
    }
  }
  return false
}