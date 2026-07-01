import { Config } from "./tool/Config/Config.js"

const prefix = Config.setting.forceSharp ? '^#' : '^#?'

const patterns = [
  /(修炼|开采|修仙签到|修仙个人信息|突破|渡劫|修仙排行|妖兽列表|秘境列表|修仙更多|撤回加入宗门申请)/,
  /(确认)?(开始|结束)闭关/,
  /(切磋|查询修仙者|加入宗门|切换ID|(全部)?(同意|拒绝)宗门成员)\s*\d*/,
  /(修为|灵石|战力|闭关|切磋|签到)榜/,
  /(我的|创建|退出|查询|转让|解散)宗门/,
  /宗门(签到|列表|审核|成员|商店|管理|供奉|排行|设置(名称|简介|副宗主|长老|成员|精英))/,
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