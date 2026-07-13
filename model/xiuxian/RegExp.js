import { Config } from "./tools/Config/Config.js"

const XIUXIAN_COMMANDS = [
  // 基本操作
  '修炼',
  '开采',
  '修仙签到',
  '修仙个人信息',
  '我的称号',
  '突破',
  '修仙排行',
  '妖兽列表',
  '秘境列表',
  '修仙更多',
  '撤回加入宗门申请',
  
  // 闭关相关
  '(确认)?(开始|结束)闭关',
  
  // 设置相关
  '设置性别\\s*(男|女)?',
  '设置称号\\s*\\d*',
  
  // 交互操作
  '(切磋|查询修仙者|(查看|猎杀)妖兽|加入宗门|切换ID|(全部)?(同意|拒绝)宗门成员)\\s*\\d*',
  
  // 排行榜
  '(修为|灵石|战力|闭关|切磋|签到)榜',
  
  // 宗门管理
  '(我的|创建|查询|(确认)?(退出|转让|解散))宗门\\s*\\d*',
  '宗门(签到|列表|审核|成员|商店|升级|管理|供奉|排行|设置(名称|简介|副宗主|长老|成员|精英))\\s*\\d*',
  
  // 兑换码相关
  '生成(?:通用)?兑换码(.*)',
  '删除(?:全部)?兑换码([\\s\\S]*)',
  '使用兑换码(.*)'
]

const buildXiuxianPattern = () => {
  const prefix = Config.setting.forceSharp ? '^#' : '^#?'
  const commandPattern = XIUXIAN_COMMANDS.map(cmd => `(${cmd})`).join('|')
  return `${prefix}(?:<@.*?>)*${commandPattern}(?:<@.*?>)*$`
}

const RegExp = {
  get xiuxian() {
    return buildXiuxianPattern()
  }
}

export default RegExp