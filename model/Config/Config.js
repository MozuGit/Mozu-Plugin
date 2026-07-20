import fs from 'node:fs'
import path from 'node:path'

import chokidar from 'chokidar'
import _ from 'lodash'

import { Version } from './Version.js'
import { YamlReader } from './YamlReader.js'

class Cfg {
  constructor() {
    this.configCache = {}  // 改名为 configCache，避免与 "config" 目录名冲突
    this.watcher = {}

    this.dirCfgNames = ["config", "xiuxian"]

    this.initCfg()
  }

  /** 初始化配置 */
  initCfg() {
    for (const dirCfgName of this.dirCfgNames) {
      const dirCfgPath = path.join(Version.Plugin_Path, 'config', dirCfgName, 'config')
      const defCfgPath = path.join(Version.Plugin_Path, 'config', dirCfgName, 'default')
      
      if (!fs.existsSync(dirCfgPath)) {
        fs.mkdirSync(dirCfgPath, { recursive: true })
      }
      
      if (!fs.existsSync(defCfgPath)) {
        continue
      }
      
      fs.readdirSync(defCfgPath)
        .filter((file) => file.endsWith('.yaml'))
        .forEach((file) => {
          const name = path.basename(file, '.yaml')
          const userCfgPath = path.join(dirCfgPath, file)
          
          if (!fs.existsSync(userCfgPath)) {
            fs.copyFileSync(path.join(defCfgPath, file), userCfgPath)
          }
          
          this.watch(userCfgPath, name, dirCfgName)
        })
    }
  }

  /** 读取默认或用户配置 */
  getDefOrConfig(dirCfgName, name) {
    return { ...this.getDefSet(dirCfgName, name), ...this.getConfig(dirCfgName, name) }
  }

  /** 默认配置 */
  getDefSet(dirCfgName, name) {
    return this.getYaml(dirCfgName, 'default', name)
  }

  /** 用户配置 */
  getConfig(dirCfgName, name) {
    return this.getYaml(dirCfgName, 'config', name)
  }

  /** 获取 YAML 配置 */
  getYaml(dirCfgName, type, name) {
    let filePath = path.join(Version.Plugin_Path, 'config', dirCfgName, type, `${name}.yaml`)
    let key = `${dirCfgName}.${type}.${name}`

    if (this.configCache[key]) return this.configCache[key]

    if (!fs.existsSync(filePath)) {
      this.configCache[key] = {}
      return this.configCache[key]
    }

    try {
      this.configCache[key] = new YamlReader(filePath).jsonData
      this.watch(filePath, name, dirCfgName)
    } catch (error) {
      console.error(`读取配置文件失败: ${filePath}`, error)
      this.configCache[key] = {}
    }

    return this.configCache[key]
  }

  /** 监听配置文件 */
  watch(file, name, dirCfgName) {
    let key = `${dirCfgName}.config.${name}`
    if (this.watcher[key]) return

    const watcher = chokidar.watch(file, { persistent: true })
    this.watcher[key] = watcher

    watcher.on('change', _.debounce(async () => {
      const oldConfig = _.cloneDeep(this.configCache[key] || {})

      delete this.configCache[key]
      this.configCache[key] = new YamlReader(file).jsonData

      const changes = this.findDifference(oldConfig, this.configCache[key])
      
      for (const changeKey in changes) {
        const value = changes[changeKey]
        let changeType = null

        if (_.isObject(value.newValue) && value.oldValue === undefined) {
          changeType = 'add'
        } else if (value.newValue === undefined && _.isObject(value.oldValue)) {
          changeType = 'del'
        } else if (value.newValue === true && !value.oldValue) {
          changeType = 'open'
        } else if (value.newValue === false && value.oldValue) {
          changeType = 'close'
        } else {
          changeType = 'modify'
        }

        if (changeType) {
          logger?.mark?.(`[配置变更] ${key}.${changeKey}: ${changeType}`)
        }
      }
    }, 500))
  }

  /** 获取所有配置 */
  getCfg() {
    let result = {}
    
    for (const dirCfgName of this.dirCfgNames) {
      const defCfgPath = path.join(Version.Plugin_Path, 'config', dirCfgName, 'default')
      const dirCfgPath = path.join(Version.Plugin_Path, 'config', dirCfgName, 'config')
      
      if (!fs.existsSync(defCfgPath)) continue
      
      const files = fs.readdirSync(defCfgPath)
        .filter((file) => file.endsWith('.yaml'))
      
      for (const file of files) {
        const name = path.basename(file, '.yaml')
        const userCfgPath = path.join(dirCfgPath, file)
        
        if (!fs.existsSync(userCfgPath)) {
          fs.copyFileSync(path.join(defCfgPath, file), userCfgPath)
        }
        
        if (!result[dirCfgName]) {
          result[dirCfgName] = {}
        }
        
        result[dirCfgName][name] = this.getDefOrConfig(dirCfgName, name)
      }
    }
    
    return result
  }

  /** 修改配置 */
  modify(dirCfgName, name, key, value) {
    let filePath = path.join(Version.Plugin_Path, 'config', dirCfgName, 'config', `${name}.yaml`)
    
    if (!fs.existsSync(filePath)) {
      const defFilePath = path.join(Version.Plugin_Path, 'config', dirCfgName, 'default', `${name}.yaml`)
      if (fs.existsSync(defFilePath)) {
        const dirPath = path.dirname(filePath)
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true })
        }
        fs.copyFileSync(defFilePath, filePath)
      } else {
        return false
      }
    }
    
    new YamlReader(filePath).set(key, value)
    delete this.configCache[`${dirCfgName}.config.${name}`]
    return true
  }

  /** 对比两个对象的不同值 */
  findDifference(obj1, obj2) {
    return _.reduce(
      obj1,
      (result, value, key) => {
        if (!_.isEqual(value, obj2[key])) {
          result[key] = { oldValue: value, newValue: obj2[key] }
        }
        return result
      },
      _.reduce(
        obj2,
        (result, value, key) => {
          if (!(key in obj1)) {
            result[key] = { oldValue: undefined, newValue: value }
          }
          return result
        },
        {}
      )
    )
  }
}

export default new Proxy(new Cfg(), {
  get(target, prop) {
    // 首先检查是否是 Cfg 实例自身的属性或方法
    if (prop in target) {
      return typeof target[prop] === 'function' 
        ? target[prop].bind(target) 
        : target[prop]
    }
    
    // 检查是否是配置目录名
    if (typeof prop === 'string' && target.dirCfgNames.includes(prop)) {
      const dirCfgName = prop
      return new Proxy({}, {
        get(_, fileName) {
          if (typeof fileName !== 'string') return undefined
          if (fileName === 'then') return undefined // 防止被当作 Promise
          return target.getDefOrConfig(dirCfgName, fileName)
        }
      })
    }
    
    return undefined
  }
})