import Redis from "#Redis"
import { Config } from "../model/Config/Config.js"

if (Config.Redis.global) global.Redis = Redis

export class MozuInterface extends plugin {
  constructor() {
    super({
      name: "MozuInterface",
      dsc: '测试接口',
      priority: -Infinity,
    })
  }
}