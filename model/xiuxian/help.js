import { Config } from "./tool/Config/Config.js"

const prefix = Config.setting.forceSharp ? '/' : ''

const help = {
  get xiuxian() {
    const commands = [
      '修炼',
      '开采',
      '突破',
      '修仙签到',
      '修仙个人信息',
      '开始闭关',
      '结束闭关',
      '切磋',
      '查询修仙者'
    ]
    const result = commands.map(item => `${prefix}${item}`)
    return result
  },
  get sect() {
    const commands = [
      '创建宗门',
      '我的宗门',
      '加入宗门',
      '宗门列表',
      '宗门签到',
      '宗门审核'
    ]
    const result = commands.map(item => `${prefix}${item}`)
    return result
  },
  get rank() {
    const commands = [
      '修为榜',
      '灵石榜',
      '战力榜',
      '闭关榜'
    ]
    const result = commands.map(item => `${prefix}${item}`)
    return result
  },
  get cdk() {
    let commands = [
      '使用兑换码',
      '生成兑换码',
      '删除兑换码'
    ]
    const result = commands.map(item => `${prefix}${item}`)
    return result
  }
}

export default help