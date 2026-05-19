import { Config } from "./tool/Config/Config.js"

const prefix = Config.setting.forceSharp ? '^#' : '^#?'

const patterns = [
  /^修炼/,
  /^开采/,
  /^修仙个人信息/,
  /^修仙签到/,
  /^突破/,
  /^渡劫/,
  /^开始闭关/,
  /^结束闭关/,
  /^确认开始闭关/,
  /^确认结束闭关/,
  /^切磋\s*\d*/,
  /^查询修仙者\s*\d*/,
]

const RegExp = {
  get xiuxian() {
    const sources = patterns.map(regex => regex.source)
    const rule = `${prefix}(${sources.join('|')})$`
    return rule
  }
}

export default RegExp