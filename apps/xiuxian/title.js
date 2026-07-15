import { Config } from "../../model/xiuxian/tools/Config/Config.js"
import { xiuxian } from "../../model/xiuxian/index.js"
import Redis from "#Redis"

export class MozuXiuxianTitle extends plugin {
  constructor() {
    super({
      name: '修仙称号',
      dsc: '修仙定时称号',
      event: 'message',
      priority: Config.setting.priority,
      task: [
        {
          cron: Config.title.rankTitle.cron || "0 0 0 ? * 1",
          name: "修仙排行榜定时发放称号",
          fnc: () => this.cronTitle()
        },
        {
          cron: Config.title.cleanTitle.cron || "0 0 0 * * *",
          name: "定时清理过期称号",
          fnc: () => this.cleanTitle()
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
      const updatePipeline = Redis.pipeline()
      for (let title of titles) {
        let titleList = titleLists[index]
        const titleIndex = titleList.find(item => item.title === title)
        if (!titleIndex) {
          titleList.push({ title: title, getTime: nowTime, validTime: Config.title.rankTitle.validDays !== 0 ? nowTime + Config.title.rankTitle.validDays * 86400 : 0 })
        } else {
          titleIndex.validTime = Config.title.rankTitle.validDays !== 0 ? nowTime + Config.title.rankTitle.validDays * 86400 : 0
        }
        updatePipeline.hset(`Mozu:xiuxian:playerInfo:${rankList[index].id}`, '称号列表', JSON.stringify(titleList))
        updatePipeline.sadd('Mozu:xiuxian:title:owners', rankList[index].id)
        index++
      }
      await updatePipeline.exec()
    }
  }

  async cleanTitle(e) {
    if (!Config.setting.enable) return false
    const nowTime = Math.floor(Date.now() / 1000)
    const ids = await Redis.smembers('Mozu:xiuxian:title:owners')
    if (ids.length === 0) return
    const pipeline = Redis.pipeline()
    for (const id of ids) {
      pipeline.hmget(`Mozu:xiuxian:playerInfo:${id}`, '称号', '称号列表')
    }
    const results = await pipeline.exec()
    const updatePipeline = Redis.pipeline()
    results.forEach(([err, data], index) => {
      const id = ids[index]
      let titleIndex = parseInt(data[0], 10)
      if (isNaN(titleIndex) || titleIndex < 0) titleIndex = -1
      const titleLists = JSON.parse(data[1] || '[]')
      const indexes = titleLists.reduce((acc, title, index) => {
        if (title.validTime !== 0 && title.validTime <= nowTime) acc.push(index)
        return acc
      }, [])
      if (indexes.includes(titleIndex - 1)) titleIndex = -1
      for (let i = indexes.length - 1; i >= 0; i--) {
        titleLists.splice(indexes[i], 1)
      }
      updatePipeline.hmset(`Mozu:xiuxian:playerInfo:${id}`, {
        称号: titleIndex,
        称号列表: JSON.stringify(titleLists)
      })
      if (titleLists.length === 0) {
        updatePipeline.srem('Mozu:xiuxian:title:owners', id)
      }
    })
    await updatePipeline.exec()
  }
}