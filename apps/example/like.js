import Config from '#Config'

export class MozuLike extends plugin {
  constructor() {
    super({
      name: '魔族陌:定时点赞',
      dsc: '定时给目标QQ点赞',
      event: 'message',
      priority: 1145,
      task: [
        {
          cron: Config.example.like.cron || '0 0 8 * * ?',
          name: '魔族陌:定时点赞',
          fnc: () => this.like(),
        },
      ],
    })
  }

  async like() {
    if (!Config.example.like.enable || !Config.example.like.targets.length) return false
    const bots = Object.values(Bot.bots).filter((bot) => bot && (bot.sendApi || bot.sendLike || bot.like))
    if (!bots.length) return false
    const targets = Config.example.like.targets
    for (const bot of bots) {
      for (const target of targets) {
        try {
          for (let i = 0; i < Config.example.like.batchCount; i++) {
            await sendLike(bot, target, Config.example.like.times)
            await new Promise((res) => setTimeout(res, Config.example.like.interval))
          }
        } catch (err) {
          continue
        } // 先静默后面再改
      }
    }
    logger.info('[魔族陌][定时点赞] 执行完成')
  }
}

async function sendLike(bot, target_id, times) {
  if (bot.sendApi) {
    return bot.sendApi('send_like', { user_id: target_id, times: times })
  }
  if (bot.sendLike) {
    return bot.sendLike(target_id, times)
  }
  if (bot.like) {
    return bot.like(target_id, times)
  }
}
