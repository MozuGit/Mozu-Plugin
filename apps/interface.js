import Redis from "#Redis"
import { Version } from "../model/Config/Version.js"
import { Config } from "../model/Config/Config.js"

global.Mozu = {
  version: Version.Plugin_Version
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