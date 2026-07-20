import Redis from "#Redis"
import Config from "#Config"

if (Config.config.Redis.global) global.Redis = Redis

export class MozuInterface extends plugin {
  constructor() {
    super({
      name: "MozuInterface",
      dsc: '测试接口',
      priority: -Infinity,
    })
  }
}