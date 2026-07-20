import Config from "#Config"
import { Button, xiuxian } from "../index.js"
import { mqqapi, qagent } from "./protocol.js"

async function xiuxianText(msg, user_id, at, isMaster) {
  msg = msg.trim()
  let Text = []
  try {
    const userData = await xiuxian.init(user_id)
    if (userData.event === "user_init") {
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**正在初始化你的修仙信息**',
        '***',
      ].join('\n'))
    }
    const id = userData.data.id
    const handler = commandHandlers[msg] ||
      prefixHandlers.find(h => h.prefix.test(msg))?.handler
    if (handler) {
      await handler(id, user_id, Text, msg, at, isMaster)
    }
    if (Text.length === 0 || (Text.length === 1 && userData.event === "user_init")) {
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**功能开发中，即将上线**',
        '>催一催作者：' + (await qagent(Config.xiuxian.setting.contact.peerUid, Config.xiuxian.setting.contact.peerName)),
        '***',
      ].join('\n'))
      Text.push(Button.author)
    }
  } catch (err) {
    logger.error("[魔族陌修仙] " + logger.red(err))
    Text.push([
      '<@' + user_id + '>',
      '***',
      '**系统错误，请稍后重试**',
      '>联系主人：' + (await qagent(Config.xiuxian.setting.contact.peerUid, Config.xiuxian.setting.contact.peerName)),
      '***',
    ].join('\n'))
    Text.push(Button.author)
  }
  return Text
}

const commandHandlers = {
  '修炼': async (id, user_id, Text, msg, at, isMaster) => {
    const value = await xiuxian.xiulian(id, isMaster)
    const userInfo = await xiuxian.getUserInfo(id)
    switch (value.event) {
      case 'xiulian_end':
        Text.push([
          ...(await buildHeader(user_id, id)),
          '**' + (await mqqapi.command('修炼完成', '修炼', true)) + '**',
          '>获得修为' + value.data.addcult + '点',
          '***',
          ...(await buildUserInfo(userInfo)),
          '***',
          ...(await buildRealmInfo(userInfo)),
          '***'
        ].join('\n'))
        break
      case 'xiulian_cd':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**当前正在CD中...**',
          '>剩余：' + value.data.outTime + '秒',
          '***',
        ].join('\n'))
        break
      case 'in_retreat':
        Text.push(await retreatText())
        break
    }
    Text.push(Button.xiuxian)
  },

  '开采': async (id, user_id, Text, msg, at, isMaster) => {
    const value = await xiuxian.kaicai(id, isMaster)
    const userInfo = await xiuxian.getUserInfo(id)
    switch (value.event) {
      case 'kaicai_end':
        Text.push([
          ...(await buildHeader(user_id, id)),
          '**' + (await mqqapi.command('开采完成', '开采', true)) + '**',
          '>获得' + value.data.addls + '灵石',
          '***',
          ...(await buildUserInfo(userInfo)),
          '***'
        ].join('\n'))
        break
      case 'kaicai_cd':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**当前正在CD中...**',
          '>剩余：' + value.data.outTime + '秒',
          '***',
        ].join('\n'))
        break
      case 'in_retreat':
        Text.push(await retreatText())
        break
    }
    Text.push(Button.xiuxian)
  },

  '修仙签到': async (id, user_id, Text) => {
    const value = await xiuxian.sign(id)
    const userInfo = await xiuxian.getUserInfo(id)
    switch (value.event) {
      case 'sign_in_success':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**ID：' + id + '**',
          '**' + (await mqqapi.command('切磋', '切磋' + id)) + '**',
          '***',
          '**' + (await mqqapi.command('今日签到成功', '修仙签到', true)) + '**',
          '***',
          '**签到情况**',
          '>签到次数：' + userInfo.signNum + '天',
          '***',
          '**每日签到奖励**',
          '>修为' + value.data.addcult,
          '灵石' + value.data.addls,
          '***'
        ].join('\n'))
        break
      case 'is_signed':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**今天已经签到过了，明天再来吧**',
          '***',
          '**签到情况**',
          '>签到次数：' + userInfo.signNum + '天',
          '***',
        ].join('\n'))
        break
    }
    Text.push(Button.xiuxian)
  },

  '修仙个人信息': async (id, user_id, Text) => {
    const userInfo = await xiuxian.getUserInfo(id)
    Text.push([
      ...(await buildHeader(user_id, id)),
      ...(await buildUserInfo(userInfo)),
      '***',
      '**战力：' + userInfo.power + '**',
      '>**' + (await mqqapi.command('境界：' + userInfo.realm.realmName, '突破')) + '**',
      '**' + (await mqqapi.command('修为：' + userInfo.cult, '修炼', true)) + '**',
      '**' + (await mqqapi.command('灵石：' + userInfo.ls, '修炼', true)) + '**',
      '***',
      '>灵根：无',
      '灵根加成：0 %',
      '功法加成：' + userInfo.addition.art + ' %',
      '***'
    ].join('\n'))
    Text.push(Button.xiuxian)
  },

  '开始闭关': async (id, user_id, Text) => {
    const userInfo = await xiuxian.getUserInfo(id)
    if (userInfo.retreat.startTime === 0) {
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**闭关说明**',
        '>闭关期间无法进行任何操作',
        '每闭关一小时获得' + Config.xiuxian.xiuxian.retreat.cult + '点修为',
        '闭关上限' + Config.xiuxian.xiuxian.retreat.max + '小时',
        '闭关上限后时间仍会累计，但收益不会计算',
        '***'
      ].join('\n'))
    } else {
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**你当前正在闭关中**',
        '>开始时间：' + formatTime(userInfo.retreat.startTime),
        '闭关时长：' + userInfo.retreat.runTime,
        '***'
      ].join('\n'))
    }
    Text.push(Button.startRetreat)
  },

  '结束闭关': async (id, user_id, Text) => {
    const userInfo = await xiuxian.getUserInfo(id)
    if (userInfo.retreat.startTime === 0) {
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**你还没开始闭关呢**',
        '>闭关期间无法进行任何操作',
        '每闭关一小时获得' + Config.xiuxian.xiuxian.retreat.cult + '点修为',
        '闭关上限' + Config.xiuxian.xiuxian.retreat.max + '小时',
        '闭关上限后时间仍会累计，但收益不会计算',
        '***'
      ].join('\n'))
    } else {
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**闭关说明**',
        '>开始时间：' + formatTime(userInfo.retreat.startTime),
        '闭关时长：' + userInfo.retreat.runTime,
        '***',
        '**现在闭关收益**',
        '>修为：' + userInfo.retreat.profit.cult,
        '***'
      ].join('\n'))
    }
    Text.push(Button.stopRetreat)
  },

  '确认开始闭关': async (id, user_id, Text) => {
    const value = await xiuxian.startRetreat(id)
    const userInfo = await xiuxian.getUserInfo(id)
    switch (value.event) {
      case 'start_retreat':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**开始闭关**',
          '>开始时间：' + formatTime(userInfo.retreat.startTime),
          '***'
        ].join('\n'))
        break
      case 'in_retreat':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**你当前正在闭关中**',
          '>开始时间：' + formatTime(userInfo.retreat.startTime),
          '闭关时长：' + userInfo.retreat.runTime,
          '***'
        ].join('\n'))
        break
    }
    Text.push(Button.startRetreat)
  },

  '确认结束闭关': async (id, user_id, Text) => {
    const value = await xiuxian.stopRetreat(id)
    const userInfo = await xiuxian.getUserInfo(id)
    switch (value.event) {
      case 'end_retreat':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**结束闭关**',
          '>开始时间：' + formatTime(value.data.retreatStart),
          '结束时间：' + formatTime(Math.floor(Date.now() / 1000)),
          '闭关时长：' + value.data.retreatRunTime,
          '***',
          '**闭关收益**',
          '>修为：' + value.data.addcult,
          '***'
        ].join('\n'))
        break
      case 'not_retreat':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**你还没开始闭关呢**',
          '>闭关期间无法进行任何操作',
          '每闭关一小时获得' + Config.xiuxian.xiuxian.retreat.cult + '点修为',
          '闭关上限' + Config.xiuxian.xiuxian.retreat.max + '小时',
          '闭关上限后时间仍会累计，但收益不会计算',
          '***'
        ].join('\n'))
        break
    }
    Text.push(Button.stopRetreat)
  },

  '修仙排行': async (id, user_id, Text) => {
    Text.push([
      '<@' + user_id + '>',
      '***',
      '**请选择你需要查看的排行榜**',
      '>排行榜仅展示前10名',
      '***'
    ].join('\n'))
    Text.push(Button.rank)
  },

  '修为榜': async (id, user_id, Text) => {
    const value = await xiuxian.getRank("修为", id)
    Text.push([
      '<@' + user_id + '>',
      '***',
      '**修为榜**',
      '>排行榜仅展示前10名',
      '***',
      ...(await buildRank(value.data.ranks, '修为')),
      (value.data.rank ? `**你的排名**\n>排名：第${value.data.rank}名\n修为：${value.data.value}\n***` : ``)
    ].join('\n'))
    Text.push(Button.rank)
  },

  '灵石榜': async (id, user_id, Text) => {
    const value = await xiuxian.getRank("灵石", id)
    Text.push([
      '<@' + user_id + '>',
      '***',
      '**灵石榜**',
      '>排行榜仅展示前10名',
      '***',
      ...(await buildRank(value.data.ranks, '灵石')),
      (value.data.rank ? `**你的排名**\n>排名：第${value.data.rank}名\n灵石：${value.data.value}\n***` : ``)
    ].join('\n'))
    Text.push(Button.rank)
  },

  '战力榜': async (id, user_id, Text) => {
    const value = await xiuxian.getRank("战力", id)
    Text.push([
      '<@' + user_id + '>',
      '***',
      '**战力榜**',
      '>排行榜仅展示前10名',
      '***',
      ...(await buildRank(value.data.ranks, '战力')),
      (value.data.rank ? `**你的排名**\n>排名：第${value.data.rank}名\n战力：${value.data.value}\n***` : ``)
    ].join('\n'))
    Text.push(Button.rank)
  },

  '闭关榜': async (id, user_id, Text) => {
    const value = await xiuxian.getRank("闭关", id)
    Text.push([
      '<@' + user_id + '>',
      '***',
      '**闭关时间榜**',
      '>排行榜仅展示前10名',
      '***',
      ...(await buildRank(value.data.ranks, '闭关时间')),
      (value.data.rank ? `**你的排名**\n>排名：第${value.data.rank}名\n闭关时间：${value.data.value}\n***` : ``)
    ].join('\n'))
    Text.push(Button.rank)
  },

  '我的称号': async (id, user_id, Text) => {
    const userInfo = await xiuxian.getUserInfo(id)
    if (userInfo.titles.length > 0) {
      let titleList = []
      for (let i = 0; i < userInfo.titles.length; i++) {
        const title = userInfo.titles[i]
        const setTitleBtn = await mqqapi.command('[设置称号]', '设置称号 ' + (i + 1), true)
        titleList.push([
          '**称号：' + title.title + '**',
          '>称号ID：' + (i + 1),
          '获得时间：' + formatTime(title.getTime),
          '有效期至：' + ((title.validTime === 0 ? '永久' : (Math.floor(Date.now() / 1000) - title.validTime > 0 ? '已过期' : formatTime(title.validTime)))),
          setTitleBtn,
          '***'
        ].join('\n'))
      }
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**称号列表**',
        '>称号可以通过排行榜等途径获取',
        '***',
        ...titleList
      ].join('\n'))
    } else {
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**你还没有称号呢**',
        '>称号可以通过排行榜等途径获取',
        '***'
      ].join('\n'))
    }
    Text.push(Button.title)
  },

  '妖兽列表': async (id, user_id, Text) => {
    const beasts = Config.xiuxian.beast.beasts
    let beastText = []
    let i = 1
    for (let beast of beasts) {
      beastText.push([
        '>妖兽ID：' + i,
        '名称：' + beast.name,
        '战力：' + beast.power,
        (await mqqapi.command('查看妖兽', '查看妖兽' + i, true)) + '  ' + (await mqqapi.command('猎杀妖兽', '猎杀妖兽' + i, true)),
        '***'
      ].join('\n'))
      i++
    }
    Text.push([
      '<@' + user_id + '>',
      '***',
      '**妖兽列表**',
      ...beastText
    ].join('\n'))
    Text.push(Button.beast)
  },

  '秘境列表': async (id, user_id, Text) => {
    const secretRealms = Config.xiuxian.drop.secretRealms
    const { easy = [], medium = [], hard = [] } = Object.groupBy(secretRealms, item => item.level ?? 'easy')
    const buildTexts = async (items, startIndex = 1) => {
      const promises = items.map(async (item, idx) => {
        const index = startIndex + idx
        const [viewCmd, exploreCmd] = await Promise.all([
          mqqapi.command('查看秘境', '查看秘境' + index, true),
          mqqapi.command('探索秘境', '探索秘境' + index, true)
        ])
        return [
          '**秘境：' + item.name + '**',
          viewCmd + '  ' + exploreCmd
        ].join('\n')
      })
      return Promise.all(promises)
    }
    const easyText = await buildTexts(easy, 1)
    const mediumText = await buildTexts(medium, easy.length + 1)
    const hardText = await buildTexts(hard, easy.length + medium.length + 1)
    Text.push([
      '<@' + user_id + '>',
      '***',
      '**秘境列表**',
      '***',
      '**初级秘境**',
      '>门槛：' + (Config.xiuxian.Realm.Realms[Config.xiuxian.drop.secretRealm_limit.easy - 1]?.name ?? '无') + (((await xiuxian.getUserInfo(id)).realm.realm >= Config.xiuxian.drop.secretRealm_limit.easy) ? ' **「已达成」**' : ''),
      ...easyText,
      '***',
      '**进阶秘境**',
      '>门槛：' + (Config.xiuxian.Realm.Realms[Config.xiuxian.drop.secretRealm_limit.medium - 1]?.name ?? '无') + ((await xiuxian.getUserInfo(id)).realm.realm >= Config.xiuxian.drop.secretRealm_limit.medium ? ' **「已达成」**' : ''),
      ...mediumText,
      '***',
      '**高级秘境**',
      '>门槛：' + (Config.xiuxian.Realm.Realms[Config.xiuxian.drop.secretRealm_limit.hard - 1]?.name ?? '无') + ((await xiuxian.getUserInfo(id)).realm.realm >= Config.xiuxian.drop.secretRealm_limit.hard ? ' **「已达成」**' : ''),
      ...hardText,
      '***'
    ].join('\n'))
    Text.push(Button.secretRealm)
  },

  '储物袋': async (id, user_id, Text) => {
    Text.push([
      '<@' + user_id + '>',
      '***',
      '**请选择你需要查看的背包**',
      '***'
    ].join('\n'))
    Text.push(Button.bag)
  },

  '我的宗门': async (id, user_id, Text) => {
    const userInfo = await xiuxian.getUserInfo(id)
    if (userInfo.sectInfo.id !== 0) {
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**我的宗门信息**',
        '>宗门ID：' + userInfo.sectInfo.id,
        '宗门名称：' + userInfo.sectInfo.name,
        '宗门简介：' + userInfo.sectInfo.desc,
        '***',
        '>宗门人数：' + userInfo.sectInfo.member + ' / ' + userInfo.sectInfo.max,
        '宗主ID：' + userInfo.sectInfo.owner,
        '***',
        '>宗门等级：' + userInfo.sectInfo.level + ' / ' + (Config.xiuxian.sect.sect_level.length),
        '宗门经验：' + userInfo.sectInfo.exp + ' / ' + userInfo.sectInfo.nextExp,
        '>' + ((userInfo.sectInfo.nextExp - userInfo.sectInfo.exp > 0)
          ? '距离下一级还需' + (userInfo.sectInfo.nextExp - userInfo.sectInfo.exp) + '点经验'
          : '已满足' + (await mqqapi.command('升级', '宗门升级')) + '要求'),
        '***'
      ].join('\n'))
    } else {
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**你还没加入宗门呢**',
        '>点击' + (await mqqapi.command('加入宗门')),
        '***'
      ].join('\n'))
    }
    Text.push(Button.sect)
  },

  '宗门列表': async (id, user_id, Text) => {
    const value = await xiuxian.listSect(id)
    switch (value.event) {
      case 'get_list_sect_success':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**宗门列表**',
          '>最多随机显示10个宗门',
          '***',
          ...(await buildSectList(value.data.sectInfos))
        ].join('\n'))
        break
      case 'not_sects':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**当前没有任何宗门**',
          '>' + (await mqqapi.command('点击创建宗门', '创建宗门')) + '',
          '***'
        ].join('\n'))
        break
    }
    Text.push(Button.sect)
  },

  '创建宗门': async (id, user_id, Text) => {
    const value = await xiuxian.createSect(id)
    const userInfo = await xiuxian.getUserInfo(id)
    switch (value.event) {
      case 'in_retreat':
        Text.push(await retreatText())
        break
      case 'lack_ls':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**创建宗门失败**',
          '>创建宗门需要' + Config.xiuxian.sect.create_sect_ls + '灵石',
          '当前灵石：' + value.data.ls,
          '***'
        ].join('\n'))
        break
      case 'create_sect':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**创建宗门成功**',
          '>恭喜，宗门创建成功',
          '***',
          ...(await buildUserInfo(userInfo)),
          '***'
        ].join('\n'))
        break
      case 'in_sect':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**你已经有宗门了**',
          '***'
        ].join('\n'))
        break
    }
    Text.push(Button.sect)
  },

  '宗门升级': async (id, user_id, Text) => {
    const value = await xiuxian.sectUp(id)
    const userInfo = await xiuxian.getUserInfo(id)
    switch (value.event) {
      case 'sect_level_up':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**宗门升级成功**',
          '>宗门等级：' + userInfo.sectInfo.level + ' / ' + Config.xiuxian.sect.sect_level.length,
          '宗门成员上限提升至 ' + userInfo.sectInfo.max + ' 人',
          '***'
        ].join('\n'))
        break
      case 'sect_exp_lack':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**宗门经验不足**',
          '>宗门经验：' + userInfo.sectInfo.exp + ' / ' + userInfo.sectInfo.nextExp,
          '距离下一级还需' + (userInfo.sectInfo.nextExp - userInfo.sectInfo.exp) + '点经验',
          '***'
        ].join('\n'))
        break
      case 'sect_level_max':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**宗门等级已满**',
          '>宗门等级：' + userInfo.sectInfo.level + ' / ' + (Config.xiuxian.sect.sect_level.length),
          '无需再次升级宗门',
          '***'
        ].join('\n'))
        break
      case 'no_permission':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**你的宗门权限不足**',
          '>需长老及以上可操作',
          '***'
        ].join('\n'))
        break
      case 'no_sect':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**你还没加入宗门呢**',
          '>点击' + (await mqqapi.command('加入宗门')),
          '***'
        ].join('\n'))
        break
    }
    Text.push(Button.sectAdmin)
  },

  '宗门成员': async (id, user_id, Text) => {
    const value = await xiuxian.sectMember(id)
    switch (value.event) {
      case 'members_list':
        const members = value.data.members
        const missionMap = new Map([
          [1, '新人'],
          [2, '成员'],
          [3, '精英'],
          [4, '资深'],
          [5, '执事'],
          [6, '未命名'],
          [7, '长老'],
          [8, '大长老'],
          [9, '副宗主'],
          [10, '宗主']
        ])
        let memberList = await Promise.all(members.map(async (item, index) => {
          if (index) {
            return [
              '>**' + await mqqapi.command('成员ID：' + item.id, '查询修仙者' + item.id) + '**',
              '职位：' + missionMap.get(item.permission)
            ].join('\n')
          } else {
            return [
              '**' + await mqqapi.command('宗主ID：' + item.id, '查询修仙者' + item.id) + '**',
              '>职位：' + missionMap.get(item.permission)
            ].join('\n')
          }
        }))
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**宗门成员列表**',
          '***',
          memberList.join('\n'),
          '***'
        ].join('\n'))
        break
      case 'no_sect':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**你还没加入宗门呢**',
          '>点击' + (await mqqapi.command('加入宗门')),
          '***'
        ].join('\n'))
        break
    }
    Text.push(Button.sectMember)
  },

  '宗门签到': async (id, user_id, Text) => {
    const value = await xiuxian.signSect(id)
    switch (value.event) {
      case 'sign_in_success':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**宗门签到成功**',
          '***',
          '**宗门签到奖励**',
          '>获得修为：' + value.data.addcult,
          '获得灵石：' + value.data.addls,
          '获得宗门经验：' + value.data.sectExp,
          '***'
        ].join('\n'))
        break
      case 'is_signed':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**今天已经签到过了，明天再来吧**',
          '***',
        ].join('\n'))
        break
      case 'no_sect':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**你还没加入宗门呢**',
          '>点击' + (await mqqapi.command('加入宗门')),
          '***'
        ].join('\n'))
        break
    }
    Text.push(Button.sect)
  },

  '宗门审核': async (id, user_id, Text) => {
    const value = await xiuxian.auditSect(id)
    switch (value.event) {
      case 'no_permission':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**你的宗门权限不足**',
          '>需长老及以上可操作',
          '***'
        ].join('\n'))
        break
      case 'audit_list':
        if (value.data.membersList.length === 0) {
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**当前没有玩家申请加入宗门**',
            '***'
          ].join('\n'))
        } else {
          let membersList = []
          for (let member of value.data.membersList) {
            membersList.push([
              '>**ID：' + member.id + '     ' + (await mqqapi.command('[同意]', '同意宗门成员' + member.id)) + '     ' + (await mqqapi.command('[拒绝]', '拒绝宗门成员' + member.id)) + '**',
              '**修为：' + member.cult + '**',
              '**境界：' + member.realm + '**',
              '***'
            ].join('\n'))
          }
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**宗门待审核成员列表**',
            '***',
            membersList.join('\n')
          ].join('\n'))
        }
        break
      case 'no_sect':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**你还没加入宗门呢**',
          '>点击' + (await mqqapi.command('加入宗门')),
          '***'
        ].join('\n'))
        break
    }
    Text.push(Button.sectAdmin)
  }
}

const prefixHandlers = [
  {
    prefix: /^#?(一键)?突破/,
    handler: async (id, user_id, Text, msg, at, isMaster) => {
      const value = await xiuxian.realmUp(id, msg.includes("一键"))
      const userInfo = await xiuxian.getUserInfo(id)
      const realmUpInfoText = []
      switch (value.event) {
        case 'realm_up_all':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**准备一键突破**',
            '>**突破成功率：未知**',
            '***',
          ].join('\n'))
          for (const realmUpInfo of value.data.realmUpInfo) {
            switch (realmUpInfo.state) {
              case 'success':
                realmUpInfoText.push('>突破成功  境界提升到：' + realmUpInfo.realm)
                break
              case 'failed':
                realmUpInfoText.push('>突破失败  次数：' + realmUpInfo.count + '  修为：-' + realmUpInfo.failed_cult)
                break
              case 'cult_lack':
                realmUpInfoText.push('>修为不足  还需' + (realmUpInfo.value - userInfo.cult) + '点修为')
                break
              case 'realm_max':
                realmUpInfoText.push('>境界已达世界极限')
                break
            }
          }
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**一键突破结果**',
            '>境界：' + userInfo.realm.realmName,
            '***',
            '**突破过程**',
            ...realmUpInfoText,
            '***',
            ...(await buildRealmInfo(userInfo)),
            '***',
          ].join('\n'))
          break
        case 'realm_up':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**准备突破**',
            '>**突破成功率：' + value.data.rate + '%**',
            '***',
          ].join('\n'))
          if (value.data.state === "success") {
            Text.push([
              '<@' + user_id + '>',
              '***',
              '**突破成功**',
              '>成功突破到：**' + userInfo.realm.realmName + '**',
              '***',
              ...(await buildRealmInfo(userInfo)),
              '***',
              '**' + (await mqqapi.command('突破太慢？试试一键突破', '一键突破', true)) + '**',
              '***'
            ].join('\n'))
          } else if (value.data.state === "failed") {
            Text.push([
              '<@' + user_id + '>',
              '***',
              '**突破失败**',
              '>**修为-' + value.data.cult + '**',
              '***',
              ...(await buildRealmInfo(userInfo)),
              '***',
              '**' + (await mqqapi.command('突破太慢？试试一键突破', '一键突破', true)) + '**',
              '***'
            ].join('\n'))
          }
          break
        case 'cult_lack':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**突破失败**',
            '>**你的修为还不足以突破**',
            '***',
            ...(await buildRealmInfo(userInfo)),
            '***'
          ].join('\n'))
          break
        case 'in_retreat':
          Text.push(await retreatText())
          break
        case 'realm_max':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**你的境界已达世界极限**',
            '>**无法再次突破**',
            '***',
            ...(await buildRealmInfo(userInfo)),
            '***',
          ].join('\n'))
          break
      }
      Text.push(Button.xiuxian)
    }
  },
  {
    prefix: /^#?切磋\s*\d*/,
    handler: async (id, user_id, Text, msg, at, isMaster) => {
      let id2 = 0
      const _id = (msg.match(/\d+/g) || []).join('')
      if (at && !Array.isArray(at) && !_id) {
        if (await xiuxian.hasPlayer(at)) {
          id2 = (await xiuxian.init(at)).data.id
        }
      } else {
        id2 = parseInt(_id, 10)
      }
      const value = await xiuxian.pvp(id, id2, isMaster)
      switch (value.event) {
        case 'in_retreat':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**' + ((value.data.event_id === id) ? '' : '对方') + '当前正在闭关**',
            '>暂时无法切磋',
            '***'
          ].join('\n'))
          break
        case 'lack_cult':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**' + ((value.data.event_id === id) ? '你的' : '对方') + '修为不足5000**',
            '>暂时无法切磋',
            '***'
          ].join('\n'))
          break
        case 'pvp_cd':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**' + ((value.data.event_id === id) ? '当前' : '对方') + '正在CD中...**',
            '>**剩余' + value.data.pvp_cd + '秒**',
            '***'
          ].join('\n'))
          break
        case 'self_pvp':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**不能和自己切磋**',
            '***'
          ].join('\n'))
          break
        case 'not_id':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**未找到该玩家**',
            '>请确认该玩家是否存在或注册',
            '***'
          ].join('\n'))
          break
        case 'pvp_end':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**切磋开始**',
            '>**你对ID: ' + (await mqqapi.command(id2, '查询修仙者' + id2)) + '发起切磋**',
            '***',
            '**切磋信息**',
            '>你的战力：' + value.data.powerA,
            '对方战力：' + value.data.powerB,
            '切磋成功概率：' + (value.data.finalWinRate * 100).toFixed(2) + '%',
            '***'
          ].join('\n'))
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**切磋结果**',
            '>**你的ID：' + (await mqqapi.command(id, '查询修仙者' + id)) + '**',
            '**对方ID：' + (await mqqapi.command(id2, '查询修仙者' + id2)) + '**',
            '***',
            '**切磋结算**',
            '>你' + (value.data.winner ? '胜利：+' : '失败：-') + value.data.cultA + '点修为',
            '对方' + (value.data.winner ? '失败：-' : '胜利：+') + value.data.cultB + '点修为',
            '***'
          ].join('\n'))
      }
      Text.push(Button.xiuxian)
    }
  },
  {
    prefix: /^#?查询修仙者\s*\d*/,
    handler: async (id, user_id, Text, msg, at) => {
      let query_id
      const _id = (msg.match(/\d+/g) || []).join('')
      if (at && !Array.isArray(at) && !_id) {
        if (await xiuxian.hasPlayer(at)) {
          query_id = (await xiuxian.init(at)).data.id
        } else {
          query_id = 0
        }
      } else {
        query_id = parseInt(_id, 10)
      }
      const userInfo = await xiuxian.getUserInfo(query_id)
      if (userInfo) {
        Text.push([
          ...(await buildHeader(user_id, query_id)),
          ...(await buildUserInfo(userInfo)),
          '***',
          '**战力：' + userInfo.power + '**',
          '>**' + (await mqqapi.command('境界：' + userInfo.realm.realmName)) + '**',
          '**' + (await mqqapi.command('修为：' + userInfo.cult, '修炼', true)) + '**',
          '**' + (await mqqapi.command('灵石：' + userInfo.ls, '开采', true)) + '**',
          '***',
          '>灵根：无',
          '灵根加成：0 %',
          '功法加成：' + userInfo.addition.art + ' %',
          '***'
        ].join('\n'))
      } else {
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**未找到该玩家**',
          '>请确认该玩家是否存在或注册',
          '***'
        ].join('\n'))
      }
      Text.push(Button.xiuxian)
    }
  },
  {
    prefix: /^#?查看妖兽\s*\d*/,
    handler: async (id, user_id, Text, msg, at) => {
      const beast_id = parseInt(msg.match(/^#?查看妖兽\s*(\d*)/)?.[1], 10)
      const beastInfo = Config.xiuxian.beast.beasts[beast_id - 1]
      if (!beastInfo) {
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**妖兽ID不存在**',
          '>请确认妖兽ID是否正确',
          '***'
        ].join('\n'))
      } else {
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**妖兽信息**',
          '>妖兽ID：' + beast_id,
          '名称：' + beastInfo.name,
          '战力：' + beastInfo.power,
          (await mqqapi.command('猎杀妖兽', '猎杀妖兽' + beast_id, true)) + '  ' + (await mqqapi.command('妖兽列表', '妖兽列表', true)),
          '***',
          '**奖励**',
          '>胜利奖励：' + beastInfo.reward.cult + '点修为+' + beastInfo.reward.ls + '灵石',
          '***',
          '**惩罚**',
          '>失败惩罚：' + '扣除' + beastInfo.punishment.cult + '点修为',
          '***'
        ].join('\n'))
      }
      Text.push(Button.beast)
    }
  },
  {
    prefix: /^#?猎杀妖兽\s*\d*/,
    handler: async (id, user_id, Text, msg, at, isMaster) => {
      const beast_id = parseInt(msg.match(/^#?猎杀妖兽\s*(\d*)/)?.[1], 10)
      const beastInfo = Config.xiuxian.beast.beasts[beast_id - 1]
      if (!beastInfo) {
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**妖兽ID不存在**',
          '>请确认妖兽ID是否正确',
          '***'
        ].join('\n'))
      } else {
        const value = await xiuxian.huntBeast(id, beastInfo, isMaster)
        const power = await xiuxian.getPower(id)
        switch (value.event) {
          case 'hunt_beast':
            Text.push([
              '<@' + user_id + '>',
              '***',
              '**战斗开始**',
              '>正在前往猎杀妖兽  ' + (await mqqapi.command(beastInfo.name, '查看妖兽' + beast_id, true)),
              '***',
              '**猎杀情况**',
              '>你的战力：' + power,
              '妖兽战力：' + beastInfo.power,
              '猎杀成功概率：' + value.data.winRate + '%',
              '***'
            ].join('\n'))
            switch (value.data.state) {
              case 'success':
                Text.push([
                  '<@' + user_id + '>',
                  '***',
                  '**战斗结束**',
                  '>你成功击杀了妖兽' + (await mqqapi.command(beastInfo.name, '查看妖兽' + beast_id, true)) + '！',
                  '***',
                  '**奖励结算**',
                  '>获得修为：' + beastInfo.reward.cult,
                  '获得灵石：' + beastInfo.reward.ls,
                  '***'
                ].join('\n'))
                break
              case 'failure':
                Text.push([
                  '<@' + user_id + '>',
                  '***',
                  '**战斗结束**',
                  '>你被妖兽' + (await mqqapi.command(beastInfo.name, '查看妖兽' + beast_id, true)) + '击败了！',
                  '***',
                  '**惩罚结算**',
                  '>损失修为：' + beastInfo.punishment.cult,
                  '***'
                ].join('\n'))
                break
            }
            break
          case 'hunt_beast_cd':
            Text.push([
              '<@' + user_id + '>',
              '***',
              '**当前正在CD中...**',
              '>剩余：' + value.data.outTime + '秒',
              '***',
            ].join('\n'))
            break
          case 'in_retreat':
            Text.push(await retreatText())
            break
        }
      }
      Text.push(Button.beast)
    }
  },
  {
    prefix: /^#?查看秘境\s*\d*/,
    handler: async (id, user_id, Text, msg, at) => {
      const secretRealm_id = parseInt(msg.match(/^#?查看秘境\s*(\d*)/)?.[1], 10)
      const secretRealmInfo = Config.xiuxian.drop.secretRealms[secretRealm_id - 1]
      if (!secretRealmInfo) {
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**秘境ID不存在**',
          '>请确认秘境ID是否正确',
          '***'
        ].join('\n'))
      } else {
        const pills = []
        const arts = []
        const { pills: pillData, arts: artData } = Config.xiuxian.drop
        for (let i = 0, len = pillData.length; i < len; i++) {
          if (pillData[i].fromSecretRealmID === secretRealm_id) {
            pills.push('>- ' + pillData[i].name)
          }
        }
        for (let i = 0, len = artData.length; i < len; i++) {
          if (artData[i].fromSecretRealmID === secretRealm_id) {
            arts.push('>- ' + artData[i].name)
          }
        }
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**秘境信息**',
          '>名称：' + secretRealmInfo.name,
          '门槛：' + (Config.xiuxian.Realm.Realms[Config.xiuxian.drop.secretRealm_limit[secretRealmInfo.level] - 1]?.name ?? '无'),
          '消耗：' + secretRealmInfo.cost_ls + '灵石',
          '掉落概率：' + secretRealmInfo.drop_rate + '%',
          '***',
          '**秘境产出**',
          '>##**丹药**',
          ...pills,
          '',
          '>##**功法**',
          ...arts,
          '***'
        ].join('\n'))
      }
      Text.push(Button.secretRealm)
    }
  },
  {
    prefix: /^#?探索秘境(十次|百次)?\s*\d*/,
    handler: async (id, user_id, Text, msg, at) => {
      const matchs = msg.match(/^#?探索秘境(十次|百次)?\s*(\d*)/)
      const count = matchs[1] === "十次" ? 10 : matchs[1] === "百次" ? 100 : 1
      const secretRealm_id = parseInt(matchs[2], 10)
      const secretRealmInfo = Config.xiuxian.drop.secretRealms[secretRealm_id - 1]
      if (!secretRealmInfo) {
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**秘境ID不存在**',
          '>请确认秘境ID是否正确',
          '***'
        ].join('\n'))
      } else {
        const pills = Config.xiuxian.drop.pills.filter(pill => pill.fromSecretRealmID === secretRealm_id)
        const arts = Config.xiuxian.drop.arts.filter(art => art.fromSecretRealmID === secretRealm_id)
        secretRealmInfo.pills = pills
        secretRealmInfo.arts = arts
        const value = await xiuxian.exploreSecretRealm(id, secretRealmInfo, count)
        const userInfo = await xiuxian.getUserInfo(id)
        switch (value.event) {
          case 'explore_secret_realm':
            let dropText = []
            for (const pill of mergeItems(value.data.pills)) {
              dropText.push('>获得丹药：' + pill.name + ' * ' + pill.count)
            }
            for (const art of mergeItems(value.data.arts)) {
              dropText.push('>获得功法：' + art.name + ' * ' + art.count)
            }
            Text.push([
              '<@' + user_id + '>',
              '***',
              '**探索秘境成功**',
              '***',
              '**秘境：' + secretRealmInfo.name + '**',
              '>消耗：' + value.data.need_ls + '灵石',
              '探索次数：' + count + ' 次',
              '***',
              '**探索结果**',
              ...(dropText.length !== 0 ? dropText : ['>什么都没有拿到']),
              '***'
            ].join('\n'))
            break
          case 'lack_ls':
            Text.push([
              '<@' + user_id + '>',
              '***',
              '**探索秘境失败**',
              '>你的灵石不足',
              '需要灵石：' + value.data.need_ls,
              '当前灵石：' + userInfo.ls,
              '***'
            ].join('\n'))
            break
          case 'limit_realm':
            Text.push([
              '<@' + user_id + '>',
              '***',
              '**探索秘境失败**',
              '>未达到秘境所需门槛',
              '需要境界：' + (Config.xiuxian.Realm.Realms[Config.xiuxian.drop.secretRealm_limit[secretRealmInfo.level] - 1].name),
              '当前境界：' + userInfo.realm.realmName,
              '***'
            ].join('\n'))
            break
          case 'in_retreat':
            Text.push(await retreatText())
            break
        }
      }
      Text.push(Button.secretRealm)
    }
  },
  {
    prefix: /^#?丹药背包\s*\d*/,
    handler: async (id, user_id, Text, msg, at) => {
      const count = (parseInt((msg.match(/\d+/g) || []).join(''), 10) || 1) - 1
      const pills = (await xiuxian.getUserBag(id)).pills
      let pillsText = []
      for (const pill of pills) {
        pillsText.push([
          '>名称：' + pill.name + '   ' + '编号：' + pill.id,
          '数量：' + pill.count,
          '使用：' + pill.cult + '修为',
          '出售：' + pill.sell_ls + '灵石',
          (await mqqapi.command('使用丹药', '使用丹药' + pill.id + ' 数量:1')) + '   ' + (await mqqapi.command('出售丹药', '出售丹药' + pill.id + ' 数量:1')),
          '***'
        ].join('\n'))
      }
      const pagePromises = []
      for (let i = 0; i < Math.ceil(pillsText.length / 5); i++) {
        pagePromises.push(mqqapi.command(i + 1, '丹药背包' + (i + 1), true));
      }
      const pageText = await Promise.all(pagePromises)
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**丹药背包**',
        '>当前页数：' + (count + 1),
        pageText.join('  '),
        '***',
        ...(pillsText.length !== 0
          ? pillsText.length >= count * 5
            ? pillsText.slice(count * 5, count * 5 + 5)
            : ['>**没有更多物品了**', '***']
          : ['>**什么丹药都没有**', '***']),
      ].join('\n'))
      Text.push(Button.pill)
    }
  },
  {
    prefix: /^#?功法背包\s*\d*/,
    handler: async (id, user_id, Text, msg, at) => {
      const count = (parseInt((msg.match(/\d+/g) || []).join(''), 10) || 1) - 1
      const arts = (await xiuxian.getUserBag(id)).arts
      let artsText = []
      for (const art of arts) {
        artsText.push([
          '>名称：' + art.name + '   ' + '编号：' + art.id,
          '数量：' + art.count,
          '功法加成：' + art.addition + ' %',
          '出售：' + art.sell_ls + '灵石',
          (await mqqapi.command('学习功法', '学习功法' + art.id, true)) + '   ' + (await mqqapi.command('出售功法', '出售功法' + art.id + ' 数量:1')),
          '***'
        ].join('\n'))
      }
      const pagePromises = []
      for (let i = 0; i < Math.ceil(artsText.length / 5); i++) {
        pagePromises.push(mqqapi.command(i + 1, '功法背包' + (i + 1), true));
      }
      const pageText = await Promise.all(pagePromises)
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**功法背包**',
        '>当前页数：' + (count + 1),
        pageText.join('  '),
        '***',
        ...(artsText.length !== 0
          ? artsText.length >= count * 5
            ? artsText.slice(count * 5, count * 5 + 5)
            : ['>**没有更多物品了**', '***']
          : ['>**什么功法都没有**', '***']),
      ].join('\n'))
      Text.push(Button.art)
    }
  },
  {
    prefix: /^#?(?:一键)?使用丹药\s*(\d*)(?:\s*数量[:：]\s*(\d+))?/,
    handler: async (id, user_id, Text, msg, at) => {
      const match = msg.match(/^#?(?:一键)?使用丹药\s*(\d*)(?:\s*数量[:：]\s*(\d+))?/)
      const pillId = parseInt(match[1], 10)
      const count = parseInt(match[2], 10) || 1
      const value = await xiuxian.usePill(id, pillId, count, msg.includes('一键'))
      switch (value.event) {
        case 'use_pill_all':
          let useCount = 0
          let usePillsText = []
          for (const pill of value.data.usePills) {
            usePillsText.push([
              '>使用丹药：' + pill.name + ' * ' + pill.count,
              '获得修为：' + pill.cultAll,
              '***'
            ].join('\n'))
            useCount += pill.count
          }
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**一键使用丹药**',
            '>使用数量：' + useCount,
            '增加修为：' + value.data.addcult,
            '***',
            ...(usePillsText.length ? usePillsText : ['>什么丹药也没有'])
          ].join('\n'))
          break
        case 'use_pill':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**使用丹药成功**',
            '>使用丹药：' + value.data.pill.name,
            '使用数量：' + count,
            '增加修为：' + value.data.addcult,
            '***'
          ].join('\n'))
          break
        case 'lack_pill_count':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**背包丹药不足**',
            '>丹药：' + value.data.pill.name,
            '使用数量：' + count,
            '丹药数量：' + value.data.pill.count,
            '***'
          ].join('\n'))
          break
        case 'no_pill':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**丹药不存在**',
            '>请确认丹药是否存在',
            '***'
          ].join('\n'))
          break
        case 'in_retreat':
          Text.push(await retreatText())
          break
      }
      Text.push(Button.pill)
    }
  },
  {
    prefix: /^#?(?:一键)?出售丹药\s*(\d*)(?:\s*数量[:：]\s*(\d+))?/,
    handler: async (id, user_id, Text, msg, at) => {
      const match = msg.match(/^#?(?:一键)?出售丹药\s*(\d*)(?:\s*数量[:：]\s*(\d+))?/)
      const pillId = parseInt(match[1], 10)
      const count = parseInt(match[2], 10) || 1
      const value = await xiuxian.sellPill(id, pillId, count, msg.includes('一键'))
      switch (value.event) {
        case 'sell_pill_all':
          let sellCount = 0
          let sellPillsText = []
          for (const pill of value.data.sellPills) {
            sellPillsText.push([
              '>出售丹药：' + pill.name + ' * ' + pill.count,
              '获得灵石：' + pill.lsAll,
              '***'
            ].join('\n'))
            sellCount += pill.count
          }
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**一键出售丹药**',
            '>出售数量：' + sellCount,
            '获得灵石：' + value.data.addls,
            '***',
            ...(sellPillsText.length ? sellPillsText : ['>什么丹药也没有']),
          ].join('\n'))
          break
        case 'sell_pill':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**出售丹药成功**',
            '>出售丹药：' + value.data.pill.name,
            '出售数量：' + count,
            '获得灵石：' + value.data.addls,
            '***'
          ].join('\n'))
          break
        case 'lack_pill_count':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**背包丹药不足**',
            '>丹药：' + value.data.pill.name,
            '出售数量：' + count,
            '丹药数量：' + value.data.pill.count,
            '***'
          ].join('\n'))
          break
        case 'no_pill':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**丹药不存在**',
            '>请确认丹药是否存在',
            '***'
          ].join('\n'))
          break
        case 'in_retreat':
          Text.push(await retreatText())
          break
      }
      Text.push(Button.pill)
    }
  },
  {
    prefix: /^#?(?:一键)?学习功法\s*\d*/,
    handler: async (id, user_id, Text, msg, at) => {
      const match = msg.match(/^#?(?:一键)?学习功法\s*\d*/)
      const artId = parseInt(match[1], 10)
      const value = await xiuxian.learnArt(id, artId, msg.includes('一键'))
      const userInfo = await xiuxian.getUserInfo(id)
      switch (value.event) {
        case 'learn_art_all':
          const arts = Config.xiuxian.drop.arts
          const haslearnArtsText = []
          const learnArtsText = []
          const learnArtsInsText = []
          for (const haslearnArt of value.data.haslearnArts) {
            const art = arts.find(a => a.id === haslearnArt)
            haslearnArtsText.push('>已学习过功法：' + art.name + '  跳过学习')
          }
          for (const learnArt of value.data.learnArts) {
            const art = arts.find(a => a.id === learnArt.id)
            learnArtsText.push('>功法：' + art.name + '  成功  加成：' + art.addition + ' %')
          }
          for (const learnArtIns of value.data.learnArtsIns) {
            const art = arts.find(a => a.id === learnArtIns.id)
            learnArtsInsText.push('>功法：' + art.name + '  失败  修为：-' + learnArtIns.deduct_cult)
          }
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**一键学习功法**',
            '>功法加成：' + userInfo.addition.art + ' %',
            '***',
            ...haslearnArtsText,
            ...learnArtsInsText,
            ...learnArtsText,
            ...((haslearnArtsText.length || learnArtsInsText.length || learnArtsText.length) ? [''] : ['>什么功法也没有']),
            '***'
          ].join('\n'))
          break
        case 'learn_art':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**学习功法**',
            '>功法加成：' + userInfo.addition.art + ' %',
            '***',
            '**功法：' + value.data.artInfo.name + '**',
            '>功法学习' + (value.data.state ? '成功' : '失败'),
            (value.data.state ? '功法加成：' + value.data.artInfo.addition + ' %' : '修为：-' + value.data.artInfo.deduct_cult)
          ].join('\n'))
          break
        case 'learned_art':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**功法已学习**',
            '>这个功法你学习过了',
            '***'
          ].join('\n'))
          break
        case 'no_art':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**功法不存在**',
            '>请确认功法是否存在',
            '***'
          ].join('\n'))
          break
        case 'in_retreat':
          Text.push(await retreatText())
          break
      }
      Text.push(Button.art)
    }
  },
  {
    prefix: /^#?(?:一键)?出售功法\s*(\d*)(?:\s*数量[:：]\s*(\d+))?/,
    handler: async (id, user_id, Text, msg, at) => {
      const match = msg.match(/^#?(?:一键)?出售功法\s*(\d*)(?:\s*数量[:：]\s*(\d+))?/)
      const artId = parseInt(match[1], 10)
      const count = parseInt(match[2], 10) || 1
      const value = await xiuxian.sellArt(id, artId, count, msg.includes('一键'))
      switch (value.event) {
        case 'sell_art_all':
          let sellCount = 0
          let sellArtsText = []
          for (const art of value.data.sellArts) {
            sellArtsText.push([
              '>出售功法：' + art.name + ' * ' + art.count,
              '获得功法：' + art.lsAll,
              '***'
            ].join('\n'))
            sellCount += art.count
          }
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**一键出售功法**',
            '>出售数量：' + sellCount,
            '获得灵石：' + value.data.addls,
            '***',
            ...(sellArtsText.length ? sellArtsText : ['>什么功法也没有'])
          ].join('\n'))
          break
        case 'sell_art':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**出售功法成功**',
            '>出售功法：' + value.data.art.name,
            '出售数量：' + count,
            '获得灵石：' + value.data.addls,
            '***'
          ].join('\n'))
          break
        case 'lack_art_count':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**背包功法不足**',
            '>功法：' + value.data.art.name,
            '出售数量：' + count,
            '功法数量：' + value.data.art.count,
            '***'
          ].join('\n'))
          break
        case 'no_art':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**功法不存在**',
            '>请确认功法是否存在',
            '***'
          ].join('\n'))
          break
        case 'in_retreat':
          Text.push(await retreatText())
          break
      }
      Text.push(Button.art)
    }
  },
  {
    prefix: /^#?查询宗门\s*\d*/,
    handler: async (id, user_id, Text, msg, at) => {
      let query_id
      let userInfo
      const _id = (msg.match(/\d+/g) || []).join('')
      if (at && !Array.isArray(at) && !_id) {
        const atID = (await xiuxian.init(at)).data.id
        userInfo = await xiuxian.getUserInfo(atID)
      } else {
        query_id = parseInt(_id, 10)
      }
      const sectInfo = query_id ? await xiuxian.getSectInfo(query_id) : userInfo.sectInfo
      if (sectInfo.id !== 0) {
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**宗门信息**',
          '>宗门ID：' + sectInfo.id,
          '宗门名称：' + sectInfo.name,
          '宗门简介：' + sectInfo.desc,
          '***',
          '>宗门人数：' + sectInfo.member + ' / ' + sectInfo.max,
          '宗主ID：' + sectInfo.owner,
          '***',
          '>宗门等级：' + sectInfo.level + ' / ' + (Config.xiuxian.sect.sect_level.length),
          '宗门经验：' + sectInfo.exp + ' / ' + sectInfo.nextExp,
          '>' + ((sectInfo.nextExp - sectInfo.exp > 0)
            ? '距离下一级还需' + (sectInfo.nextExp - sectInfo.exp) + '点经验'
            : '已满足' + (await mqqapi.command('升级', '宗门升级')) + '要求'),
          '***'
        ].join('\n'))
      } else {
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**未找到该宗门**',
          '>请确认该宗门是否存在或创建',
          '***'
        ].join('\n'))
      }
      Text.push(Button.sect)
    }
  },
  {
    prefix: /^#?加入宗门\s*\d*/,
    handler: async (id, user_id, Text, msg, at) => {
      let join_id
      const _id = (msg.match(/\d+/g) || []).join('')
      if (at && !Array.isArray(at) && !_id) {
        if (await xiuxian.hasPlayer(at)) {
          const atID = (await xiuxian.init(at)).data.id
          const userInfo = await xiuxian.getUserInfo(atID)
          join_id = userInfo.sectInfo.id
        } else {
          join_id = 0
        }
      } else {
        join_id = parseInt(_id, 10)
      }
      const value = await xiuxian.joinSect(id, join_id)
      const userInfo = await xiuxian.getUserInfo(id)
      switch (value.event) {
        case 'in_sect':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**你已经加入宗门了**',
            '***'
          ].join('\n'))
          break
        case 'member_full':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**你要加入的宗门人数已满**',
            '>**宗门人数：' + value.data.memberNum + ' / ' + value.data.memberMax + '**',
            '***'
          ].join('\n'))
          break
        case 'join_sect_audit':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**已向宗门发起加入宗门申请**',
            '>请等待宗门审核',
            '***'
          ].join('\n'))
          break
        case 'join_sect_success':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**加入宗门成功**',
            '>宗门开启了无需宗门审核',
            '已直接加入宗门',
            '***'
          ].join('\n'))
          break
        case 'not_sectid':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**找不到该宗门**',
            '>请确认该宗门是否存在或创建',
            '***'
          ].join('\n'))
          break
      }
      Text.push(Button.sect)
    }
  },
  {
    prefix: /^#?(确认)?退出宗门$/,
    handler: async (id, user_id, Text, msg, at) => {
      if (msg.includes("确认")) {
        const value = await xiuxian.exitSect(id)
        switch (value.event) {
          case 'sect_exit':
            Text.push([
              '<@' + user_id + '>',
              '***',
              '**退出宗门成功**',
              '***'
            ].join('\n'))
            break
          case 'sect_owner':
            Text.push([
              '<@' + user_id + '>',
              '***',
              '**退出宗门失败**',
              '>宗主无法退出宗门',
              '请先' + (await mqqapi.command('转让宗门')),
              '***'
            ].join('\n'))
            break
          case 'no_sect':
            Text.push([
              '<@' + user_id + '>',
              '***',
              '**你还没加入宗门呢**',
              '>点击' + (await mqqapi.command('加入宗门')),
              '***'
            ].join('\n'))
            break
        }
        Text.push(Button.sect)
      } else {
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**请再次确认退出宗门**',
          '>退出宗门后将失去宗门所有权益',
          '***'
        ].join('\n'))
        Text.push(Button.sectExit)
      }
    }
  },
  {
    prefix: /^#?(确认)?转让宗门\s*\d*/,
    handler: async (id, user_id, Text, msg, at) => {
      let transfer_id
      const _id = (msg.match(/\d+/g) || []).join('')
      if (at && !Array.isArray(at) && !_id) {
        if (await xiuxian.hasPlayer(at)) {
          const atID = (await xiuxian.init(at)).data.id
          transfer_id = atID
        } else {
          transfer_id = 0
        }
      } else {
        transfer_id = parseInt(_id, 10)
      }
      const value = await xiuxian.transferSect(id, transfer_id, msg.includes("确认"))
      switch (value.event) {
        case 'sect_transfer':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**宗门转让成功**',
            '>转让ID：' + (await mqqapi.command(transfer_id, '查询修仙者' + transfer_id, true)),
            '***'
          ].join('\n'))
          break
        case 'no_confirmed':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**请再次确认转让宗门给ID：' + transfer_id + '**',
            '>点击' + (await mqqapi.command('确认转让宗门', '确认转让宗门' + transfer_id)),
            '***'
          ].join('\n'))
          break
        case 'not_transfer_id':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**找不到该玩家**',
            '>请确认该玩家是否在宗门内',
            '***'
          ].join('\n'))
          break
        case 'no_permission':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**你的宗门权限不足**',
            '>需宗主才可操作',
            '***'
          ].join('\n'))
          break
        case 'no_sect':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**你还没加入宗门呢**',
            '>点击' + (await mqqapi.command('加入宗门')),
            '***'
          ].join('\n'))
          break
      }
      Text.push(Button.sectAdmin)
    }
  },
  {
    prefix: /^#?(全部)?(同意|拒绝)宗门成员\s*\d*/,
    handler: async (id, user_id, Text, msg, at) => {
      let audit_id
      const _id = (msg.match(/\d+/g) || []).join('')
      if (at && !Array.isArray(at) && !_id) {
        if (await xiuxian.hasPlayer(at)) {
          const atID = (await xiuxian.init(at)).data.id
          const userInfo = await xiuxian.getUserInfo(atID)
          audit_id = userInfo.sectInfo.id
        } else {
          audit_id = 0
        }
      } else {
        audit_id = parseInt(_id, 10)
      }
      const value = await xiuxian.auditSectMember(id, audit_id, msg.includes('同意'), msg.includes('全部'))
      switch (value.event) {
        case 'sect_audit_all_agreed':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**同意全部待审核成员完成**',
            '>详细信息如下',
            '***',
            '\`\`\` 同意成员列表',
            '同意玩家ID：' + value.data.addMembers.join('\n同意玩家ID：'),
            '\`\`\`',
            '***'
          ].join('\n'))
          break
        case 'sect_audit_all_refused':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**拒绝全部待审核成员完成**',
            '>详细信息如下',
            '***',
            '\`\`\` 拒绝成员列表',
            '拒绝玩家ID：' + value.data.refusedMembers.join('\n拒绝玩家ID：'),
            '\`\`\`',
            '***'
          ].join('\n'))
          break
        case 'member_has_sect':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**同意宗门成员失败**',
            '>对方已加入其他宗门',
            '***'
          ].join('\n'))
          break
        case 'member_agreed':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**同意宗门成员成功**',
            '>玩家加入宗门成功',
            '***'
          ].join('\n'))
          break
        case 'member_refused':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**拒绝宗门成员成功**',
            '>已拒绝玩家加入宗门',
            '***'
          ].join('\n'))
          break
        case 'not_member':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**待审核列表没有该玩家**',
            '>请确认玩家是否申请加入宗门或存在',
            '***',
          ].join('\n'))
          break
        case 'no_member_audit':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**当前没有玩家申请加入宗门**',
            '***',
          ].join('\n'))
          break
        case 'member_max':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**宗门人数已满**',
            '>请先' + (await mqqapi.command('升级宗门')) + '或' + (await mqqapi.command('移除玩家', '踢出宗门')),
            '***',
          ].join('\n'))
          break
        case 'no_permission':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**你的宗门权限不足**',
            '>需长老及以上可操作',
            '***'
          ].join('\n'))
          break
        case 'no_sect':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**你还没加入宗门呢**',
            '>点击' + (await mqqapi.command('加入宗门')),
            '***'
          ].join('\n'))
          break
      }
      Text.push(Button.sectMember)
    }
  },
  {
    prefix: /^#?宗门供奉\s*\d*/,
    handler: async (id, user_id, Text, msg) => {
      const value = await xiuxian.sectEnshrined(id, msg.replace(/#?宗门供奉/, '').trim())
      const userInfo = await xiuxian.getUserInfo(id)
      switch (value.event) {
        case 'sect_enshrined':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**宗门供奉成功**',
            '>灵石：-' + value.data.addContribution,
            '宗门经验：+' + value.data.addExp,
            '宗门贡献：+' + value.data.addContribution,
            '***'
          ].join('\n'))
          break
        case 'lack_ls':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**宗门供奉失败**',
            '>你的灵石不足',
            '供奉灵石数量：' + value.data.ls,
            '当前灵石：' + userInfo.ls,
            '***'
          ].join('\n'))
          break
        case 'invalid_lsNum':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**宗门供奉失败**',
            '>供奉灵石数量格式错误',
            '供奉灵石需10的倍数且大于0',
            '正确格式：宗门供奉1000',
            '***'
          ].join('\n'))
          break
        case 'no_sect':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**你还没加入宗门呢**',
            '>点击' + (await mqqapi.command('加入宗门')),
            '***'
          ].join('\n'))
          break
      }
      Text.push(Button.sect)
    }
  },
  {
    prefix: /^#?设置性别\s*(男|女)/,
    handler: async (id, user_id, Text, msg) => {
      const value = await xiuxian.setSex(id, msg.replace(/#?设置性别/, '').trim())
      switch (value.event) {
        case 'set_sex_success':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**性别设置成功**',
            '>性别：' + value.data.sex,
            '***'
          ].join('\n'))
          break
        case 'invalid_sex':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**性别设置失败**',
            '>请确认性别是否正确',
            '***'
          ].join('\n'))
          break
        case 'in_is_sex':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**性别已设置**',
            '>无法再次设置性别',
            '***'
          ].join('\n'))
          break
      }
      Text.push(Button.xiuxian)
    }
  },
  {
    prefix: /^#?设置称号\s*\d*/,
    handler: async (id, user_id, Text, msg) => {
      const value = await xiuxian.setTitle(id, msg.replace(/#?设置称号/, '').trim())
      switch (value.event) {
        case 'set_title_success':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**称号设置成功**',
            '>当前称号：' + value.data.title,
            '***'
          ].join('\n'))
          break
        case 'invalid_title':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**称号设置失败**',
            '>请确认称号ID是否存在',
            '***'
          ].join('\n'))
          break
      }
      Text.push(Button.title)
    }
  },
  {
    prefix: /^#?生成(通用)?兑换码(.*)/,
    handler: async (id, user_id, Text, msg, at, isMaster) => {
      const value = await xiuxian.genCdkey(user_id, msg, isMaster)
      switch (value.event) {
        case 'gen_cdk_success':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**兑换码生成成功**',
            '***',
            '\`\`\` 兑换码列表',
            value.data.cdks.join('\n'),
            '\`\`\`',
            '***'
          ].join('\n'))
          break
        case 'no_permissions':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**权限不足**',
            '>请确认你是否有足够的权限',
            '***'
          ].join('\n'))
          break
      }
      Text.push(Button.cdk)
    }
  },
  {
    prefix: /^#?删除(全部)?兑换码/,
    handler: async (id, user_id, Text, msg, at, isMaster) => {
      const value = await xiuxian.delCdkey(user_id, msg.replace(/#?使用兑换码/, '').trim(), isMaster)
      switch (value.event) {
        case 'del_cdks':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**删除成功**',
            '***',
            '\`\`\` 兑换码列表',
            value.data.cdkList.join('\n'),
            '\`\`\`',
            '***'
          ].join('\n'))
          break
        case 'no_permissions':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**权限不足**',
            '>请确认你是否有足够的权限',
            '***'
          ].join('\n'))
          break
        case 'invalid_cdks':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**删除失败**',
            '>格式错误',
            '正确格式：删除兑换码xxx',
            '***'
          ].join('\n'))
          break
      }
      Text.push(Button.cdk)
    }
  },
  {
    prefix: /^#?使用兑换码(.*)/,
    handler: async (id, user_id, Text, msg, at) => {
      const value = await xiuxian.useCdkey(id, user_id, msg.replace(/#?使用兑换码/, '').trim())
      switch (value.event) {
        case 'cdk_use_force_success':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**兑换码使用成功**',
            '>兑换码：' + msg.replace(/#?使用兑换码/, '').trim(),
            '***',
            '**使用结果**',
            '>**已被强制设置为以下数值**',
            '修为：' + value.data.cult,
            '灵石：' + value.data.ls,
            '***'
          ].join('\n'))
          break
        case 'cdk_use_success':
          const cultList = value.data.cult.map(item => item < 0 ? `${item}` : `+${item}`)
          const lsList = value.data.ls.map(item => item < 0 ? `${item}` : `+${item}`)
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**兑换码使用成功**',
            '>兑换码：' + msg.replace(/#?使用兑换码/, '').trim(),
            '***',
            '\`\`\` 使用结果',
            ...(cultList.length !== 0 ? ['修为' + cultList.join('\n修为')] : []),
            ...(lsList.length !== 0 ? ['灵石' + lsList.join('\n灵石')] : []),
            ((cultList.length === 0 && lsList.length === 0) ? '奖励被小草神吃掉了喵~' : []),
            '\`\`\`',
            '***'
          ].join('\n'))
          break
        case 'cdk_used':
          Text.push([
            '<@' + user_id + '>',
            '***',
            value.data.useId ? '**兑换码已被使用**' : '**兑换码不可重复使用**',
            ...(value.data.useId ? ['>使用ID：' + (await xiuxian.init(value.data.useId)).data.id] : []),
            (value.data.useId ? '' : '>') + '使用时间：' + formatTime(value.data.useTime),
            '***',
          ].join('\n'))
          break
        case 'invalid_cdk':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**兑换码不存在**',
            '>请确认兑换码是否存在',
            '***',
          ].join('\n'))
          break
      }
      Text.push(Button.xiuxian)
    }
  },
  {
    prefix: /^#?切换ID/,
    handler: async (id, user_id, Text, msg, at, isMaster) => {
      let switch_id
      const _id = (msg.match(/\d+/g) || []).join('')
      if (at && !Array.isArray(at) && !_id) {
        if (await xiuxian.hasPlayer(at)) {
          switch_id = (await xiuxian.init(at)).data.id
        } else {
          switch_id = 0
        }
      } else {
        switch_id = parseInt(_id, 10)
      }
      const value = await xiuxian.switchId(id, switch_id, isMaster)
      switch (value.event) {
        case 'switch_success':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**切换ID成功**',
            '>**ID：' + (await mqqapi.command(id, "查询修仙者" + id)) + '  <==>  ' + (await mqqapi.command(switch_id, "查询修仙者" + switch_id)) + '**',
            '***'
          ].join('\n'))
          break
        case 'not_switch_id':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**未找到该玩家**',
            '>请确认该玩家是否存在或注册',
            '***'
          ].join('\n'))
          break
        case 'no_permissions':
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**权限不足**',
            '>请确认你是否有足够的权限',
            '***'
          ].join('\n'))
          break
      }
    }
  }
]

export { xiuxianText }

async function buildHeader(user_id, id) {
  return [
    '<@' + user_id + '>',
    '***',
    '**ID：' + id + '**',
    '**' + (await mqqapi.command('切磋', '切磋' + id)) + '**',
    '***'
  ]
}

async function buildUserInfo(userInfo) {
  return [
    '>**' + (await mqqapi.command('称号：' + userInfo.title, '我的称号', true)) + '**',
    '>**' + (await mqqapi.command('性别：' + userInfo.sex, '设置性别')) + '**',
    '>**' + ((userInfo.sectInfo.id !== 0) ? (await mqqapi.command('宗门：' + userInfo.sectInfo.name + '    ID：' + userInfo.sectInfo.id, '我的宗门', true)) : (await mqqapi.command('未加入宗门', '加入宗门'))) + '**'
  ]
}

async function buildRealmInfo(userInfo) {
  return [
    '>' + (await mqqapi.command('境界：' + userInfo.realm.realmName, '突破')),
    '当前修为：' + userInfo.cult,
    (userInfo.realm.realmName2 ? '下一境界：' + userInfo.realm.realmName2 : null),
    (userInfo.realm.realmNeedExp === -1
      ? '>你的境界已达世界极限'
      : '距离下一境界：' + (userInfo.realm.realmNeedExp === 0
        ? '已满足' + (await mqqapi.command('突破', '突破', true)) + '条件'
        : '还需' + userInfo.realm.realmNeedExp + '点修为')),
  ]
}

async function buildRank(ranks, index) {
  let rankText = []
  for (let item of ranks) {
    rankText.push([
      '>**' + (await mqqapi.command('No.' + item.rank + ' => ' + 'ID：' + item.id, '查询修仙者' + item.id)) + '**',
      '**' + index + '：' + ((index === "闭关时间") ? secondsToTimeText(item.value) : item.value) + '**',
      '**称号：' + item.title + '**',
      '**' + (await mqqapi.command('切磋', '切磋' + item.id)) + '**',
      '***'
    ].join('\n'))
  }
  return rankText
}

async function buildSectList(sectInfos) {
  let sectList = []
  for (let item of sectInfos) {
    sectList.push([
      '**宗门：' + item.name + '  ID：' + item.id + '**',
      '>宗主：' + item.owner + '  等级：' + item.level,
      '人数：' + item.memberNum + ' / ' + item.memberMax,
      '简介：' + item.desc,
      (await mqqapi.command('点击加入宗门', '加入宗门' + item.id)),
      '***'
    ].join('\n'))
  }
  return sectList
}

async function retreatText() {
  return [
    '***',
    '**当前正在闭关中...**',
    '>如需取消闭关请点击',
    '**' + (await mqqapi.command('结束闭关', '结束闭关', true)) + '**',
    '***',
  ].join('\n')
}

function mergeItems(arr) {
  const map = new Map()
  arr.forEach(item => {
    if (map.has(item.id)) {
      map.get(item.id).count += 1
    } else {
      map.set(item.id, {
        id: item.id,
        name: item.name,
        count: 1
      })
    }
  })
  return Array.from(map.values())
}

/**
 * 时间戳转 2026-01-01 08:00:00 格式
 * @param {number} timestamp 秒级/毫秒级时间戳自动兼容
 * @returns {string} 格式化时间
 */
function formatTime(timestamp) {
  const time = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp
  const d = new Date(time)

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const h = String(d.getHours()).padStart(2, "0")
  const m = String(d.getMinutes()).padStart(2, "0")
  const s = String(d.getSeconds()).padStart(2, "0")

  return `${year}-${month}-${day} ${h}:${m}:${s}`
}

/**
 * 示例：11天45小时14分钟0秒
 * @param {number} seconds 仅支持秒级时间
 * @returns {string} 格式化时间
 */
function secondsToTimeText(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0 || days > 0) parts.push(`${hours}小时`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}分钟`);
  if (days < 1) parts.push(`${secs}秒`);

  return parts.join('');
}