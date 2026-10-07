import Config from '#Config'

const Numreg = '[零一壹二两三四五六七八九十百千万亿\\d]+'
const TimeUnitReg = Object.keys({
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
}).join('|')

/**
 * 从标准 at 消息段提取适配器用户 ID
 * @param {object} e 消息事件
 * @returns {Array<string|number>} 用户 ID 列表
 */
function getAtUserIds(e) {
  const selfIds = new Set([e.self_id, e.bot?.uin].filter(Boolean).map(String))
  return e.message
    .filter((item) => item.type === 'at' && item.is_you !== true && item.is_you !== 'true')
    .map((item) => item.qq)
    .filter((id) => id !== undefined && id !== null && String(id).trim() !== '')
    .filter((id) => String(id) !== 'all' && !selfIds.has(String(id)))
}

export class MozuGroupAdmin extends plugin {
  constructor() {
    super({
      name: '魔族陌:群管',
      dsc: '给QQBot适配器添加群管功能',
      event: 'message',
      priority: Config.groupAdmin.setting.priority || 100,
      rule: [
        {
          reg: `^#禁言\\s?((\\d+)\\s)?(${Numreg})?(${TimeUnitReg})?$^#禁言\s?(([A-Z0-9]+)\s)?(${Numreg})?(${TimeUnitReg})?$`,
          fnc: 'muteMember',
        },
      ],
    })
  }

  async muteMember(e) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.xiuxian.setting.enable) return false
  }
}
