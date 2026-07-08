import { Config } from "../../model/xiuxian/tool/Config/Config.js"
import { xiuxian } from "../../model/xiuxian/index.js"

export class MozuXiuxianTitle extends plugin {
  constructor() {
    super({
      name: '修仙排行榜定时称号',
      dsc: '根据修仙排行榜排名定时发放称号',
      event: 'message',
      priority: Config.setting.priority,
      task: [
        {
          cron: Config.title.rankTitle.cron || "0 0 0 ? * 1",
          name: "修仙排行榜定时发放称号",
          fnc: () => this.cronTitle()
        }
      ]
    })
  }

  async cronTitle() {
    if (!Config.setting.enable) return false
    const nowTime = Math.floor(Date.now() / 1000)
    const rankType = ['修为', '灵石', '战力', '闭关']
    for (const type of rankType) {
      const rankList = (await xiuxian.getRank(type)).data.ranks
      if (!rankList || rankList.length <= 0) continue
      let titles = []
      switch (type) {
        case '修为':
          titles = Config.title.rankTitle.cult.slice(0, rankList.length)
          break
        case '灵石':
          titles = Config.title.rankTitle.ls.slice(0, rankList.length)
          break
        case '战力':
          titles = Config.title.rankTitle.power.slice(0, rankList.length)
          break
        case '闭关':
          titles = Config.title.rankTitle.retreat.slice(0, rankList.length)
          break
      }
      let index = 0
      if (titles.length <= 0) continue
      const pipeline = Redis.pipeline()
      for (let rank of rankList) {
        pipeline.hget(`Mozu:xiuxian:playerInfo:${rank.id}`, '称号列表')
      }
      const result = await pipeline.exec()
      let titleLists = []
      for (let titleList of result) {
        titleList = JSON.parse(titleList[1] || '[]')
        titleLists.push(titleList)
      }
      for (let title of titles) {
        let titleList = titleLists[index]
        const titleIndex = titleList.find(item => item.title === title)
        if (!titleIndex) {
          titleList.push({ title: title, getTime: nowTime, validTime: Config.title.rankTitle.validDays !== 0 ? nowTime + Config.title.rankTitle.validDays * 86400 : 0 })
        } else {
          titleIndex.validTime = Config.title.rankTitle.validDays !== 0 ? nowTime + Config.title.rankTitle.validDays * 86400 : 0
        }
        Redis.hset(`Mozu:xiuxian:playerInfo:${rankList[index].id}`, '称号列表', JSON.stringify(titleList))
        index++
      }
    }
  }
}