import { Config } from "./tools/Config/Config.js"

const prefix = Config.setting.forceSharp ? '/' : ''

const help = {
  get xiuxian() {
    const commands = [
      '修炼',
      '开采',
      '突破',
      '切磋',
      '修仙签到',
      '开始闭关',
      '结束闭关',
      '我的称号',
      '设置称号',
      '查询修仙者',
      '修仙个人信息'
    ]
    const result = commands.map(item => `${prefix}${item}`)
    return result
  },
  get sect() {
    const commands = [
      '创建宗门',
      '我的宗门',
      '加入宗门',
      '查询宗门',
      '宗门列表',
      '宗门签到',
      '宗门审核',
      '宗门成员',
      '宗门供奉',
      '宗门升级',
      '同意宗门成员',
      '拒绝宗门成员',
      '全部同意宗门成员',
      '全部拒绝宗门成员'
    ]
    const result = commands.map(item => `${prefix}${item}`)
    return result
  },
  get rank() {
    const commands = [
      '修为榜',
      '灵石榜',
      '战力榜',
      '闭关榜',
      '修仙排行'
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