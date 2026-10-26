import _ from 'lodash'

import Config from '#Config'

import { mqqapi } from '../../lib/protocol.js'
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

/** 我要自闭正则 */
const Autisticreg = new RegExp(`^#?我要(自闭|禅定)(${Numreg})?个?(${TimeUnitReg})?$`, 'i')

export class MozuGroupAdmin extends plugin {
  constructor() {
    super({
      name: '魔族陌:官机群管',
      dsc: '给QQBot适配器添加群管功能',
      event: 'message',
      priority: Config.groupAdmin.setting.priority || 100,
      rule: [
        {
          reg: `^#禁言\s?(([A-Z0-9]+)\s)?(${Numreg})?(${TimeUnitReg})?`,
          fnc: 'muteMember',
        },
        {
          reg: '^#解禁',
          fnc: 'noMuteMember',
        },
        {
          reg: '^#踢黑?$',
          fnc: 'kickMember',
        },
        {
          reg: '^#解除全部禁言$',
          fnc: 'relieveAllMute',
        },
        {
          reg: Autisticreg,
          fnc: 'Autistic',
        },
      ],
    })
  }

  async muteMember(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.groupAdmin.setting.enable || !this.e.group) return false
    if (!common.checkPermission(e, 'admin', 'admin')) return true
    const Ga = new GroupAdmin(e)
    const ids = [...(e.raw?.content || '').matchAll(/<@!?([^>\s]+)>/g)].map((m) => m[1])
    const ats = e.mentions?.length
      ? e.mentions.filter((member) => member.member_role === 'member' && member.bot !== true)
      : ids.map((member_openid) => ({ member_openid }))
    const unit = e.msg.match(new RegExp(TimeUnitReg))?.[0]
    let _unit = Time_unit[unit?.toUpperCase()] ?? (/^\d+$/.test(unit) ? unit : 60)
    const time = translateChinaNum(e.msg.match(new RegExp(Numreg))?.[0]) ?? 1
    const muteList = ats.map((at) => ({ openid: at.member_openid, time: time * _unit, username: at.username }))
    if (!muteList.length) return this.e.reply('未找到可禁言对象')
    const ok = await Ga.muteMembers(muteList)
    if (ok) {
      const muteText = []
      for (const mute of muteList) {
        muteText.push(['>群员：**' + (await mqqapi.command(mute.username, mute.openid)) + '**'].join('\n'))
      }
      this.e.reply(
        segment.markdown(
          [
            '**禁言成功**',
            '>禁言时长：' + (e.msg.match(new RegExp(Numreg))?.[0] ?? 1) + (unit ?? '分钟'),
            '***',
            '**禁言列表**',
            ...muteText,
            '***',
          ].join('\n')
        )
      )
    }
    return true
  }

  async noMuteMember(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.groupAdmin.setting.enable || !this.e.group) return false
    if (!common.checkPermission(e, 'admin', 'admin')) return true
    const Ga = new GroupAdmin(e)
    const ids = [...(e.raw?.content || '').matchAll(/<@!?([^>\s]+)>/g)].map((m) => m[1])
    const ats = e.mentions?.length
      ? e.mentions.filter((member) => member.member_role === 'member')
      : ids.map((member_openid) => ({ member_openid }))
    if (!ats.length) return this.e.reply('未找到可解除禁言对象')
    const muteMap = new Map(
      (await Ga.getMuteList()).map((item) => [
        item.member_openid,
        { username: item.username, muteTime: item.mute_expire_at },
      ])
    )
    const muteList = ats.map((at) => {
      const info = muteMap.get(at.member_openid)
      return {
        openid: at.member_openid,
        time: 0,
        username: info?.username || at.username,
        muteTime: info?.muteTime,
      }
    })
    const ok = await Ga.muteMembers(muteList)
    if (ok) {
      const muteText = []
      for (const mute of muteList) {
        muteText.push(
          [
            '>群员：**' + (await mqqapi.command(mute.username, mute.openid)) + '**',
            '禁言时间剩余：' + (mute.muteTime ? await mqqapi.command(timeDiff(mute.muteTime), mute.muteTime) : '未知'),
          ].join('\n')
        )
      }
      this.e.reply(segment.markdown(['**解除禁言成功**', '***', '**解除禁言列表**', ...muteText, '***'].join('\n')))
    }
    return true
  }

  async kickMember(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.groupAdmin.setting.enable || !this.e.group) return false
    if (!this.e.group) return false
    if (!common.checkPermission(e, 'admin', 'admin')) return true
    const Ga = new GroupAdmin(e)
    const ids = [...(e.raw?.content || '').matchAll(/<@!?([^>\s]+)>/g)].map((m) => m[1])
    const ats = e.mentions?.length
      ? e.mentions.filter((member) => member.member_role === 'member')
      : ids.map((member_openid) => ({ member_openid }))
    if (!ats.length) return this.e.reply('未找到群成员对象')
    const ok = await Ga.kickMembers(ats, e.msg.includes('黑'))
    if (ok) {
      const kickText = []
      for (const at of ats) {
        kickText.push(
          ['>已踢出：**' + (await mqqapi.command(at?.username ?? at.member_openid, at.member_openid)) + '**'].join('\n')
        )
      }
      this.e.reply(segment.markdown(['**踢出成功**', '***', '**踢出列表**', ...kickText, '***'].join('\n')))
    }
    return true
  }

  async relieveAllMute(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.groupAdmin.setting.enable || !this.e.group) return false
    if (!common.checkPermission(e, 'admin', 'admin')) return true
    const Ga = new GroupAdmin(e)
    const muteList = (await Ga.getMuteList()).map((item) => ({
      openid: item.member_openid,
      time: 0,
      username: item.username,
      muteTime: item.mute_expire_at,
    }))
    if (muteList.length) {
      const ok = await Ga.muteMembers(muteList)
      const muteText = []
      for (const mute of muteList) {
        muteText.push(
          [
            '>群员：**' + (await mqqapi.command(mute.username, mute.openid)) + '**',
            '禁言时间剩余：' + (await mqqapi.command(timeDiff(mute.muteTime), mute.muteTime)),
          ].join('\n')
        )
      }
      if (ok) {
        this.e.reply(
          segment.markdown(['**解除全部禁言成功**', '***', '**解除禁言列表**', ...muteText, '***'].join('\n'))
        )
      }
    }
    return true
  }

  async Autistic(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.groupAdmin.setting.enable || !this.e.group) return false
    if (!common.checkPermission(e, 'member', 'admin', false)) return true
    if (e.isMaster || e.raw.author.member_role !== 'member') return this.e.reply('别自闭啦~~', true)
    const Ga = new GroupAdmin(e)
    const regRet = Autisticreg.exec(e.msg)
    const TabooTime = translateChinaNum(regRet[2] || 5)
    const Company = Time_unit[_.toUpper(regRet[3]) || '分']
    const ok = await Ga.muteMembers([{ openid: this.e.user_id, time: TabooTime * Company }])
    if (ok) await this.e.reply('那我就不手下留情了~', true)
    return true
  }
}

/**
 * 计算目标时间与当前时间的时间差
 * @param {string} dateStr - 目标时间字符串
 * @returns {string} 时间差描述
 */
function timeDiff(dateStr) {
  const target = new Date(dateStr)
  const now = new Date()

  let diff = Math.floor(Math.abs(now - target) / 1000)

  const seconds = diff % 60
  diff = Math.floor(diff / 60)
  const minutes = diff % 60
  diff = Math.floor(diff / 60)
  const hours = diff % 24
  const days = Math.floor(diff / 24)

  const parts = []
  if (days) parts.push(`${days} 天`)
  if (hours) parts.push(`${hours} 小时`)
  if (minutes) parts.push(`${minutes} 分钟`)
  if (seconds) parts.push(`${seconds} 秒`)

  return parts.join(' ') || '0 秒'
}
