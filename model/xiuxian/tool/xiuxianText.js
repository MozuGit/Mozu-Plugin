import { Button, xiuxian } from "../index.js"
import { Config } from "./Config/Config.js"

async function xiuxianText(msg, user_id, at) {
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
      prefixHandlers.find(h => msg.startsWith(h.prefix))?.handler
    if (handler) {
      await handler(id, user_id, Text, msg, at)
    }
  } catch (err) {
    logger.error(err)
    Text.push([
      '<@' + user_id + '>',
      '***',
      '**系统错误，请稍后重试**',
      '***',
    ].join('\n'))
  }
  return Text
}

const commandHandlers = {
  '修炼': async (id, user_id, Text) => {
    const value = await xiuxian.xiulian(id)
    const userInfo = await xiuxian.getUserInfo(id)
    switch (value.event) {
      case 'xiulian_end':
        Text.push([
          ...buildHeader(user_id, id),
          '**[修炼完成](mqqapi://aio/inlinecmd?command=修炼)**',
          '>获得修为' + value.data.addcult + '点',
          '***',
          ...buildUserInfo(userInfo),
          '***',
          ...buildRealmInfo(userInfo),
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
        Text.push(retreatText)
        break
    }
    Text.push(Button.xiuxian)
  },

  '开采': async (id, user_id, Text) => {
    const value = await xiuxian.kaicai(id)
    const userInfo = await xiuxian.getUserInfo(id)
    switch (value.event) {
      case 'kaicai_end':
        Text.push([
          ...buildHeader(user_id, id),
          '**[开采完成](mqqapi://aio/inlinecmd?command=开采)**',
          '>获得' + value.data.addls + '灵石',
          '***',
          ...buildUserInfo(userInfo),
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
        Text.push(retreatText)
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
          '**[切磋](mqqapi://aio/inlinecmd?command=切磋 ' + id + ')' + '**',
          '***',
          '**[今日签到成功](mqqapi://aio/inlinecmd?command=修仙签到)**',
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

  '突破': async (id, user_id, Text) => {
    const value = await xiuxian.realmUp(id)
    const userInfo = await xiuxian.getUserInfo(id)
    switch (value.event) {
      case 'realm_up':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**准备突破**',
          '>**当前突破成功率：' + value.data.rate + '%**',
          '***',
        ].join('\n'))
        if (value.data.state === "success") {
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**突破成功**',
            '>成功突破到：**' + userInfo.realm.realmName + '**',
            '***',
            ...buildRealmInfo(userInfo),
            '***',
          ].join('\n'))
        } else if (value.data.state === "failed") {
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**突破失败**',
            '>**修为-' + value.data.cult + '**',
            '***',
            ...buildRealmInfo(userInfo),
            '***',
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
          ...buildRealmInfo(userInfo),
          '***',
        ].join('\n'))
        break
      case 'in_retreat':
        Text.push(retreatText)
        break
    }
    Text.push(Button.xiuxian)
  },

  '修仙个人信息': async (id, user_id, Text) => {
    const userInfo = await xiuxian.getUserInfo(id)
    Text.push([
      ...buildHeader(user_id, id),
      ...buildUserInfo(userInfo),
      '***',
      '**战力：' + userInfo.power + '**',
      '>**[境界：' + userInfo.realm.realmName + '](mqqapi://aio/inlinecmd?command=突破)**',
      '**[修为：' + userInfo.cult + '](mqqapi://aio/inlinecmd?command=修炼)**',
      '**[灵石：' + userInfo.ls + '](mqqapi://aio/inlinecmd?command=开采)**',
      '***',
      '>灵根：无',
      '灵根加成：0%',
      '功法加成：0%',
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
        '每闭关一小时获得' + Config.xiuxian.retreat.cult + '点修为',
        '闭关上限' + Config.xiuxian.retreat.max + '小时',
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
        '每闭关一小时获得' + Config.xiuxian.retreat.cult + '点修为',
        '闭关上限' + Config.xiuxian.retreat.max + '小时',
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
          '每闭关一小时获得' + Config.xiuxian.retreat.cult + '点修为',
          '闭关上限' + Config.xiuxian.retreat.max + '小时',
          '闭关上限后时间仍会累计，但收益不会计算',
          '***'
        ].join('\n'))
        break
    }
    Text.push(Button.stopRetreat)
  },

  '修为榜': async (id, user_id, Text) => {
    const value = await xiuxian.getRank(id, "修为")
    Text.push([
      '<@' + user_id + '>',
      '***',
      '**修为榜**',
      '>排行榜仅展示前10名',
      '***',
      ...buildRank(value.data.ranks, '修为'),
      (value.data.rank ? `**你的排名**\n>排名：第${value.data.rank}名\n修为：${value.data.cult}\n***` : ``)
    ].join('\n'))
    Text.push(Button.rank)
  },

  '灵石榜': async (id, user_id, Text) => {
    const value = await xiuxian.getRank(id, "灵石")
    Text.push([
      '<@' + user_id + '>',
      '***',
      '**灵石榜**',
      '>排行榜仅展示前10名',
      '***',
      ...buildRank(value.data.ranks, '灵石'),
      (value.data.rank ? `**你的排名**\n>排名：第${value.data.rank}名\n灵石：${value.data.cult}\n***` : ``)
    ].join('\n'))
    Text.push(Button.rank)
  },

  '战力榜': async (id, user_id, Text) => {
    const value = await xiuxian.getRank(id, "战力")
    Text.push([
      '<@' + user_id + '>',
      '***',
      '**战力榜**',
      '>排行榜仅展示前10名',
      '***',
      ...buildRank(value.data.ranks, '战力'),
      (value.data.rank ? `**你的排名**\n>排名：第${value.data.rank}名\n战力：${value.data.cult}\n***` : ``)
    ].join('\n'))
    Text.push(Button.rank)
  },

  '闭关榜': async (id, user_id, Text) => {
    const value = await xiuxian.getRank(id, "闭关")
    Text.push([
      '<@' + user_id + '>',
      '***',
      '**闭关时间榜**',
      '>排行榜仅展示前10名',
      '***',
      ...buildRank(value.data.ranks, '闭关时间'),
      (value.data.rank ? `**你的排名**\n>排名：第${value.data.rank}名\n闭关时间：${value.data.cult}\n***` : ``)
    ].join('\n'))
    Text.push(Button.rank)
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
        '>宗门人数：' + userInfo.sectInfo.member + '/' + userInfo.sectInfo.max,
        '宗主ID：' + userInfo.sectInfo.owner,
        '***',
        '>宗门等级：' + userInfo.sectInfo.level + '/' + (Config.sect.sect_up_exp.length + 1),
        '宗门经验：' + userInfo.sectInfo.exp + '/' + userInfo.sectInfo.nextExp,
        '>' + ((userInfo.sectInfo.nextExp - userInfo.sectInfo.exp > 0)
          ? '距离下一级还需' + (userInfo.sectInfo.nextExp - userInfo.sectInfo.exp) + '点经验'
          : '已满足[升级](mqqapi://aio/inlinecmd?command=宗门升级)要求'),
        '***'
      ].join('\n'))
    } else {
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**你还没加入宗门呢**',
        '>点击[加入宗门](mqqapi://aio/inlinecmd?command=加入宗门)',
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
          ...buildSectList(value.data.sectInfos)
        ].join('\n'))
        break
      case 'not_sects':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**当前没有任何宗门**',
          '>[点击创建宗门](mqqapi://aio/inlinecmd?command=创建宗门)',
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
        Text.push(retreatText)
        break
      case 'lack_ls':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**创建宗门失败**',
          '>创建宗门需要' + Config.sect.create_sect_ls + '灵石',
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
          ...buildUserInfo(userInfo),
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
          '获得宗门经验：' + value.data.exp,
          '***'
        ].join('\n'))
      case 'in_signed':
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**今天已经签到过了，明天再来吧**',
          '***',
        ].join('\n'))
        break
    }
    Text.push(Button.sect)
  }
}

const prefixHandlers = [
  {
    prefix: '切磋',
    handler: async (id, user_id, Text, msg, at) => {
      let id2 = 0
      if (at) {
        if (await xiuxian.hasPlayer(at)) {
          id2 = await xiuxian.init(at)
        }
      } else {
        id2 = (msg.match(/\d+/g) || []).join('')
      }
      const value = await xiuxian.pvp(id, id2)
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
            '>**你对ID: [' + id2 + '](mqqapi://aio/inlinecmd?command=查询修仙者' + id2 + ')发起切磋**',
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
            '>**你的ID：[' + id + '](mqqapi://aio/inlinecmd?command=查询修仙者' + id + ')**',
            '**对方ID：[' + id2 + '](mqqapi://aio/inlinecmd?command=查询修仙者' + id2 + ')**',
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
    prefix: '查询修仙者',
    handler: async (id, user_id, Text, msg, at) => {
      let query_id
      if (at) {
        if (await xiuxian.hasPlayer(at)) {
          query_id = await xiuxian.init(at)
        } else {
          query_id = 0
        }
      } else {
        query_id = (msg.match(/\d+/g) || []).join('')
      }
      const userInfo = await xiuxian.getUserInfo(query_id)
      if (userInfo) {
        Text.push([
          ...buildHeader(user_id, query_id),
          ...buildUserInfo(userInfo),
          '***',
          '**战力：' + userInfo.power + '**',
          '>**[境界：' + userInfo.realm.realmName + '](mqqapi://aio/inlinecmd?command=突破)**',
          '**[修为：' + userInfo.cult + '](mqqapi://aio/inlinecmd?command=修炼)**',
          '**[灵石：' + userInfo.ls + '](mqqapi://aio/inlinecmd?command=开采)**',
          '***',
          '>灵根：无',
          '灵根加成：0%',
          '功法加成：0%',
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
    prefix: '加入宗门',
    handler: async (id, user_id, Text, msg, at) => {
      let join_id
      if (at) {
        if (await xiuxian.hasPlayer(at)) {
          const atID = await xiuxian.init(at)
          const userInfo = await xiuxian.getUserInfo(atID)
          join_id = userInfo.sectInfo.id
        } else {
          join_id = 0
        }
      } else {
        join_id = (msg.match(/\d+/g) || []).join('')
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
            '>**宗门人数：' + value.data.memberNum + '/' + value.data.memberMax + '**',
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
    }
  }
]

export { xiuxianText }

function buildHeader(user_id, id) {
  return [
    '<@' + user_id + '>',
    '***',
    '**ID：' + id + '**',
    '**[切磋](mqqapi://aio/inlinecmd?command=切磋 ' + id + ')' + '**',
    '***'
  ]
}

function buildUserInfo(userInfo) {
  return [
    '>**[称号：' + userInfo.title + '](mqqapi://aio/inlinecmd?command=我的称号)**',
    '>**[性别：' + userInfo.sex + '](mqqapi://aio/inlinecmd?command=设置性别)**',
    '>**' + ((userInfo.sectInfo.id !== 0) ? '[宗门：' + userInfo.sectInfo.name + '    ID：' + userInfo.sectInfo.id + '](mqqapi://aio/inlinecmd?command=我的宗门)' : '未加入宗门') + '**'
  ]
}

function buildRealmInfo(userInfo) {
  return [
    '>[境界：' + userInfo.realm.realmName + '](mqqapi://aio/inlinecmd?command=突破)',
    '当前修为：' + userInfo.cult,
    '下一境界：' + userInfo.realm.realmName2,
    '距离下一境界：' + ((userInfo.realm.realmNeedExp === 0)
      ? '已满足[突破](mqqapi://aio/inlinecmd?command=突破)条件'
      : '还需' + userInfo.realm.realmNeedExp + '点修为'),
  ]
}

function buildRank(ranks, index) {
  let rankText = []
  for (let item of ranks) {
    rankText.push([
      '>**[No.' + item.rank + ' => ' + 'ID：' + item.id + '](mqqapi://aio/inlinecmd?command=查询修仙者' + item.id + ')**',
      '**' + index + '：' + ((index === "闭关时间") ? secondsToTimeText(item.value) : item.value) + '**',
      '**[切磋](mqqapi://aio/inlinecmd?command=切磋' + item.id + ')**',
      '***'
    ].join('\n'))
  }
  return rankText
}

function buildSectList(sectInfos) {
  let sectList = []
  for (let item of sectInfos) {
    sectList.push([
      '**宗门：' + item.name + '  ID：' + item.id + '**',
      '>宗主：' + item.owner + '  等级：' + item.level,
      '人数：' + item.memberNum + '/' + item.memberMax,
      '简介：' + item.desc,
      '***'
    ].join('\n'))
  }
  return sectList
}

const retreatText = [
  '***',
  '**当前正在闭关中...**',
  '>如需取消闭关请点击',
  '**[结束闭关](mqqapi://aio/inlinecmd?command=结束闭关)**',
  '***',
].join('\n')

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