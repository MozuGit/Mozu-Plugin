import { Config } from "./tool/Config/Config.js"

const prefix = Config.setting.forceSharp ? '^#' : '^#?'

const patterns = [
  /修炼/,
  /开采/,
  /修仙个人信息/,
  /修仙签到/,
  /突破/,
  /渡劫/,
  /(确认)?(开始|结束)闭关/,
  /切磋\s*\d*/,
  /查询修仙者\s*\d*/,
  /(修为|灵石|战力|闭关)榜/,
  /(我的|创建|加入)宗门/,
  /宗门(签到|列表)/
]

const RegExp = {
  get xiuxian() {
    const sources = patterns.map(regex => regex.source)
    const rule = `${prefix}(?:<@.*?>)*(${sources.join('|')})(?:<@.*?>)*$`
    return rule
  }
}

export default RegExp