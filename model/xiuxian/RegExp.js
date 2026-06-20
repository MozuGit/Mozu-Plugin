import { Config } from "./tool/Config/Config.js"

const prefix = Config.setting.forceSharp ? '^#' : '^#?'

const patterns = [
  /(修炼|开采|修仙签到|修仙个人信息|突破|渡劫)/,
  /(确认)?(开始|结束)闭关/,
  /(切磋|查询修仙者|加入宗门)\s*\d*/,
  /(修为|灵石|战力|闭关)榜/,
  /(我的|创建)宗门/,
  /宗门(签到|列表|审核)/,
  /生成(?:通用)?兑换码(.*)/,
  /删除(?:全部)?兑换码([\s\S]*)/,
  /使用兑换码(.*)/
]

const RegExp = {
  get xiuxian() {
    const sources = patterns.map(regex => regex.source)
    const rule = `${prefix}(?:<@.*?>)*(${sources.join('|')})(?:<@.*?>)*$`
    return rule
  }
}

export default RegExp