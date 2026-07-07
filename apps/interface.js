import Redis from "#Redis"
import { Version } from "../model/Config/Version.js"
import { Config } from "../model/Config/Config.js"
import { mqqapi, qagent } from "../model/xiuxian/tool/protocol.js"

global.Mozu = {
  pluginInfo: {
    Plugin_Name: Version.Plugin_Name,
    Plugin_Path: Version.Plugin_Path,
    Version: Version.Plugin_Version
  },
  protocol: {
    mqqapi: mqqapi,
    qagent: qagent
  }
}
if (Config.Redis.global) global.Redis = Redis

export class MozuInterface extends plugin {
  constructor() {
    super({
      name: "MozuInterface",
      dsc: '测试接口',
      priority: -Infinity,
    })
  }

  async accept(e) {
    e.Mozu = global.Mozu
  }
}