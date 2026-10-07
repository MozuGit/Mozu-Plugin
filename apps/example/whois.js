import Redis from '#Redis'
import Config from '#Config'
import QQBot from '../../model/QQBot/interface.js'

export class MozuWhois extends plugin {
  constructor() {
    super({
      name: '天选之人',
      dsc: '随机选择一个人禁言',
      event: 'message',
      priority: 1000,
      rule: [
        {
          reg: '^#?天选之人$',
          fnc: 'whois',
        },
      ],
    })
  }

  async whois(e, i = 0) {
    if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.example.whois.enable) return false
    const is_admin = (await QQBot.getGroupBotState(this.e.bot, this.e.group_id))?.data?.member_role
    if (!this.e.isGroup || !is_admin) return false
    const group_id = this.e.group_id
    const nowMutes = (await Redis.smembers(`Mozu:whois:mute:${group_id}`)).map((item) => ({ openid: item, time: 0 }))
    let mmap = await this.e.group.getMemberMap()
    let arrMember = Array.from(mmap.values())
    let random = arrMember[Math.round(Math.random() * (arrMember.length - 1))]
    let name = random?.nickname ?? random?.user_id ?? '未知'
    let who = random.user_id
    if (Config.example.whois.self_add_rate && Math.round(Math.random() * 100) > 70 && !this.e.isMaster) {
      who = this.e.user_id
      name = this.e.raw.author.username || this.e.sender.nickname
    }
    const time = Math.floor(Math.random() * (60 - 5 + 1)) + 5
    if (!(await QQBot.muteMember(this.e.bot, group_id, who, time, nowMutes)) && i < 5) {
      return this.whois(e, ++i)
    }
    await Redis.del(`Mozu:whois:mute:${group_id}`)
    await Redis.sadd(`Mozu:whois:mute:${group_id}`, who)
    await this.e.reply(
      `<@${this.e.user_id.replace(this.e.self_id + ':', '')}>\n***\n**天选之人**\n>幸运儿：**${name}**\n禁言时间：${time} 秒\n我也要玩喵~ **[](mqqapi://aio/inlinecmd?command=天选之人&ender=false)[天选之人](mqqapi://aio/inlinecmd?command=天选之人&ender=false1)**`
    )
    return true
  }
}
