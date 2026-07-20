import Redis from '#Redis'
import Config from "#Config"

export class MozuFayan extends plugin {
  constructor() {
    super({
      name: '发言次数统计',
      dsc: '发言次数统计',
      event: 'message',
      priority: -1,
      rule: [
        {
          reg: '^#?发言榜(日榜|月榜|周榜|昨日|上周)?$',
          fnc: 'fayan'
        },
        {
          reg: '^#?(清空|清除)(本群|群聊)发言(记录|榜)?$',
          fnc: 'clearAll'
        },
        {
          reg: '^#?清除发言(记录|榜)?',
          fnc: 'clearAt'
        }
      ]
    })
  }

  async accept(e) {
    if (!Config.config.fayan.enable || !this.e.group) return false
    let date = await gettoday()
    let month = await getmonth()
    let week = await getweek()
    const pipeline = Redis.pipeline()
    pipeline.zincrby(`Mozu:msg:${date}:group:${this.e.group_id}`, 1, this.e.user_id)
    pipeline.zincrby(`Mozu:msg:${month}:group:${this.e.group_id}`, 1, this.e.user_id)
    pipeline.zincrby(`Mozu:msg:${week}:group:${this.e.group_id}`, 1, this.e.user_id)
    pipeline.hset(`Mozu:username`, this.e.user_id, this.e?.nickname || this.e?.sender?.nickname)
    await pipeline.exec()
  }

  async fayan(e) {
    if (!Config.config.fayan.enable || !this.e.group) return false
    const type = this.e.msg.match(/^#?发言榜(日榜|月榜|周榜|昨日|上周)?$/)?.[1] || "日榜"
    let date
    switch (type) {
      case '日榜':
        date = await gettoday()
        break
      case '月榜':
        date = await getmonth()
        break
      case '周榜':
        date = await getweek()
        break
      case '昨日':
        date = await gettoday(1)
        break
      case '上周':
        date = await getweek(1)
        break
    }
    const key = `Mozu:msg:${date}:group:${this.e.group_id}`
    let list = await Redis.zrevrange(key, 0, Config.config.fayan.count - 1, 'WITHSCORES')
    let [score, rank] = await Promise.all([
      Redis.zscore(key, this.e.user_id),
      Redis.zrevrank(key, this.e.user_id)
    ])
    const userIds = list.filter((_, i) => i % 2 === 0)
    if (userIds.length === 0) return false
    const names = await Redis.hmget(`Mozu:username`, ...userIds)
    let message
    let msg = []
    if (['QQBot'].includes(e?.bot?.adapter?.name) && Config.config.fayan.sendMarkdown) {
      msg.push([
        '<@' + this.e.user_id.replace(this.e.self_id + ':', '') + '>',
        '***',
        '**本群发言榜' + type + '**',
        '>数据仅供参考  请以实际发言为准',
        '***'
      ].join('\n'))
      for (let i = 0; i < list.length; i += 2) {
        msg.push([
          '**No.' + (i / 2 + 1) + '  ' + names[i / 2] + '**',
          '>发言次数：' + list[i + 1] + '次'
        ].join('\n'))
      }
      msg.push([
        '***',
        '**你的发言**',
        '>排名：第' + (rank + 1) + '名',
        '发言次数：' + score + '次',
        '***'
      ].join('\n'))
      const Button = segment.button(
        [
          { text: "日榜", input: "发言榜日榜" },
          { text: "月榜", input: "发言榜月榜" },
          { text: "周榜", input: "发言榜周榜" },
        ],
        [
          { text: "昨日", input: "发言榜昨日" },
          { text: "上周", input: "发言榜上周" },
        ]
      )
      message = [segment.markdown(msg.join('\n')), Button]
    } else {
      msg.push([
        '本群发言榜' + type,
        '--------',
        '数据仅供参考  请以实际发言为准',
        '--------'
      ].join('\n'))
      for (let i = 0; i < list.length; i += 2) {
        msg.push([
          '第' + (i / 2 + 1) + '名：' + names[i / 2] + '•' + list[i + 1] + '次',
        ].join('\n'))
      }
      msg.push([
        '--------',
        '你的排名：第' + (rank + 1) + '名•' + score + '次',
      ].join('\n'))
      message = msg.join('\n')
    }
    await this.e.reply(message)
  }

  async clearAll(e) {
    if (!Config.config.fayan.enable || !this.e.group || !this.e.isMaster) return false
    let date = await gettoday()
    let month = await getmonth()
    let week = await getweek()
    const pipeline = Redis.pipeline()
    pipeline.del(`Mozu:msg:${date}:group:${this.e.group_id}`)
    pipeline.del(`Mozu:msg:${month}:group:${this.e.group_id}`)
    pipeline.del(`Mozu:msg:${week}:group:${this.e.group_id}`)
    await pipeline.exec()
    if (['QQBot'].includes(e?.bot?.adapter?.name) && Config.config.fayan.sendMarkdown) {
      const message = segment.markdown([
        '<@' + this.e.user_id.replace(`${this.e.self_id}:`, '') + '>',
        '***',
        '**已清除本群所有发言**',
        '***'
      ].join('\n'))
      const Button = segment.button(
        [
          { text: "清除本群发言", input: "清除本群发言" }
        ],
        [
          { text: "日榜", input: "发言榜日榜" },
          { text: "月榜", input: "发言榜月榜" },
          { text: "周榜", input: "发言榜周榜" },
        ]
      )
      await this.e.reply([message, Button])
    } else {
      await this.e.reply("已清除本群所有发言")
    }
  }

  async clearAt(e) {
    if (!Config.config.fayan.enable || !this.e.group || !this.e.isMaster) return false
    let date = await gettoday()
    let month = await getmonth()
    let week = await getweek()
    const pipeline = Redis.pipeline()
    const AtQQ = this.e?.at
    if (!AtQQ) {
      if (['QQBot'].includes(e?.bot?.adapter?.name) && Config.config.fayan.sendMarkdown) {
        const message = segment.markdown([
          '<@' + this.e.user_id.replace(`${this.e.self_id}:`, '') + '>',
          '***',
          '**未获取到艾特数据**',
          '>正确格式：清除发言 @123',
          '***'
        ].join('\n'))
        const Button = segment.button(
          [
            { text: "清除发言", input: "清除发言" }
          ],
          [
            { text: "日榜", input: "发言榜日榜" },
            { text: "月榜", input: "发言榜月榜" },
            { text: "周榜", input: "发言榜周榜" },
          ]
        )
        await this.e.reply([message, Button])
      } else {
        await this.e.reply("未获取到艾特数据", true)
      }
      return true
    }
    pipeline.zrem(`Mozu:msg:${date}:group:${this.e.group_id}`, AtQQ)
    pipeline.zrem(`Mozu:msg:${month}:group:${this.e.group_id}`, AtQQ)
    pipeline.zrem(`Mozu:msg:${week}:group:${this.e.group_id}`, AtQQ)
    await pipeline.exec()
    if (['QQBot'].includes(e?.bot?.adapter?.name) && Config.config.fayan.sendMarkdown) {
      const message = segment.markdown([
        '<@' + this.e.user_id.replace(`${this.e.self_id}:`, '') + '>',
        '***',
        '**清除发言成功**',
        '>已清除 <@' + AtQQ.replace(`${this.e.self_id}:`, '') + '> 的发言记录',
        '***'
      ].join('\n'))
      const Button = segment.button(
        [
          { text: "清除发言", input: "清除发言" }
        ],
        [
          { text: "日榜", input: "发言榜日榜" },
          { text: "月榜", input: "发言榜月榜" },
          { text: "周榜", input: "发言榜周榜" },
        ]
      )
      await this.e.reply([message, Button])
    } else {
      await this.e.reply("已清除 " + segment.at(AtQQ) + " 的发言记录")
    }
  }
}

async function gettoday(num = 0) {
  const currentDate = new Date()
  if (num !== 0) {
    currentDate.setDate(currentDate.getDate() - num)
  }
  const year = currentDate.getFullYear()
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  const day = currentDate.getDate().toString().padStart(2, '0')
  const date_time = `${year}-${month}-${day}`
  return date_time
}

async function getmonth() {
  const currentDate = new Date()
  const year = currentDate.getFullYear()
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  const date_time = `${year}-${month}`
  return date_time
}

async function getweek(num = 0) {
  const d = new Date()
  d.setDate(d.getDate() - num * 7)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  const year = d.getFullYear()
  const firstDay = new Date(year, 0, 1)
  const week = Math.ceil(((d - firstDay) / 86400000 + firstDay.getDay() + 1) / 7)
  return `${year}-Week${week.toString().padStart(2, '0')}`
}