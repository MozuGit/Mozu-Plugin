import Config from '#Config'

import GroupAdmin from '../../model/groupAdmin/groupAdmin.js'
import common from '../../model/groupAdmin/common.js'
import translateChinaNum from '../../tools/translateChinaNum.js'

const Numreg = '[零一壹二两三四五六七八九十百千万亿\\d]+'
const Time_unit = {
  毫秒: 0.001,
  秒: 1,
  S: 1,
  SECOND: 1,
  分: 60,
  分钟: 60,
  M: 60,
  MIN: 60,
  MINUTE: 60,
  时: 3600,
  小时: 3600,
  H: 3600,
  HOUR: 3600,
  天: 86400,
  日: 86400,
  D: 86400,
  DAY: 86400,
  周: 604800,
  W: 604800,
  WEEK: 604800,
  月: 2592000,
  MONTH: 2592000,
  年: 31536000,
  Y: 31536000,
  YEAR: 31536000,
}
const TimeUnitReg = Object.keys(Time_unit).join('|')

export class MozuGroupAdmin extends plugin {
  constructor() {
    super({
      name: '魔族陌:官机群管',
      dsc: '给QQBot适配器添加群管功能',
      event: 'message',
      priority: Config.groupAdmin.setting.priority || 100,
      rule: [
        {
          reg: `^#禁言\s?(([A-Z0-9]+)\s)?(${Numreg})?(${TimeUnitReg})?$`,
          fnc: 'muteMember',
        },
        {
          reg: `^#解除全部禁言$`,
          fnc: 'relieveAllMute',
        },
      ],
    })
  }

  async muteMember(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.groupAdmin.setting.enable) return false
    if (!this.e.group) return false
    if (!common.checkPermission(e, 'admin', 'admin')) return true
    const Ga = new GroupAdmin(e)
    const ids = [...(e.raw?.content || '').matchAll(/<@!?([^>\s]+)>/g)].map((m) => m[1])
    const ats = e.mentions?.length
      ? e.mentions.filter((member) => member.member_role === 'member')
      : ids.map((member_openid) => ({ member_openid }))
    const unit = e.msg.match(new RegExp(TimeUnitReg))?.[0]
    let _unit = Time_unit[unit?.toUpperCase()] ?? (/^\d+$/.test(unit) ? unit : 60)
    const time = translateChinaNum(e.msg.match(new RegExp(Numreg))?.[0]) ?? 1
    const muteList = ats.map((at) => ({ openid: at.member_openid, time: time * _unit, username: at.username }))
    if (!muteList.length) return this.e.reply('未找到可禁言对象')
    const ok = Ga.muteMembers(muteList)
    if (ok) {
      this.e.reply(
        [
          '**禁言成功**',
          '>禁言时长：' + (e.msg.match(new RegExp(Numreg))?.[0] ?? 1) + (unit ?? '分钟'),
          '***',
          '**禁言列表**',
          '>' + muteList.map((item) => item.username).join('\n'),
          '***',
        ].join('\n')
      )
    }
    return true
  }

  async relieveAllMute(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.groupAdmin.setting.enable) return false
    if (!this.e.group) return false
    if (!common.checkPermission(e, 'admin', 'admin')) return true
    const Ga = new GroupAdmin(e)
    const muteList = (await Ga.getMuteList())
      .map((item) => ({ openid: item.member_openid, username: item.username }))
      .map((item) => ({ openid: item.openid, time: 0, username: item.username }))
    if (muteList.length) {
      const ok = Ga.muteMembers(muteList)
      if (ok) {
        this.e.reply(
          [
            '**解除全部禁言成功**',
            '***',
            '**解除禁言列表**',
            '>' + muteList.map((item) => item.username).join('\n'),
            '***',
          ].join('\n')
        )
      }
    }
    return true
  }
}
