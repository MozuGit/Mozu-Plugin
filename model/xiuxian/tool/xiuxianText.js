import { Button, xiuxian } from "../index.js"
import { Config } from "./Config/Config.js"

async function xiuxianText(msg, user_id) {
  msg = msg.trim()
  let message = msg.replace(`<@${Config.setting.BotID}>`, '').trim()
  msg = msg.replace(/<@[^>]+>/g, '')
  const id = await xiuxian.init(user_id)
  let Text = []
  const handler = commandHandlers[msg] ||
    prefixHandlers.find(h => msg.startsWith(h.prefix))?.handler
  if (handler) {
    await handler(id, user_id, Text, message)
  }
  return Text
}

const commandHandlers = {
  '修炼': async (id, user_id, Text) => {
    const value = await xiuxian.xiulian(id)
    const userInfo = await xiuxian.getUserInfo(id)
    if (value.cult && value.addcult) {
      Text.push([
        ...buildHeader(user_id, id),
        '**[修炼完成](mqqapi://aio/inlinecmd?command=修炼)**',
        '>获得修为' + value.addcult + '点',
        '***',
        ...buildUserInfo(userInfo),
        '***',
        ...buildRealmInfo(userInfo),
        '***'
      ].join('\n'))
    } else if (value.outTime) {
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**当前正在CD中...**',
        '>剩余：' + value.outTime + '秒',
        '***',
      ].join('\n'))
    } else if (value.retreat) {
      Text.push(retreatText)
    }
    Text.push(Button.xiuxian)
  },

  '开采': async (id, user_id, Text) => {
    const value = await xiuxian.kaicai(id)
    const userInfo = await xiuxian.getUserInfo(id)
    if (value.ls && value.addls) {
      Text.push([
        ...buildHeader(user_id, id),
        '**[开采完成](mqqapi://aio/inlinecmd?command=开采)**',
        '>获得' + value.addls + '灵石',
        '***',
        ...buildUserInfo(userInfo),
        '***'
      ].join('\n'))
    } else if (value.outTime) {
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**当前正在CD中...**',
        '>剩余：' + value.outTime + '秒',
        '***',
      ].join('\n'))
    } else if (value.retreat) {
      Text.push(retreatText)
    }
    Text.push(Button.xiuxian)
  },

  '修仙签到': async (id, user_id, Text) => {
    const value = await xiuxian.sign(id)
    const userInfo = await xiuxian.getUserInfo(id)
    if (value) {
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
        '>修为' + value.addcult,
        '灵石' + value.addls,
        '***'
      ].join('\n'))
    } else {
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**今天已经签到过了，明天再来吧**',
        '***',
        '**签到情况**',
        '>签到次数：' + userInfo.signNum + '天',
        '***',
      ].join('\n'))
    }
    Text.push(Button.xiuxian)
  },

  '突破': async (id, user_id, Text) => {
    const value = await xiuxian.realmUp(id)
    const userInfo = await xiuxian.getUserInfo(id)
    if (value) {
      if (value === true) {
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**突破成功**',
          '>成功突破到：**' + userInfo.realm.realmName + '**',
          '***',
          ...buildRealmInfo(userInfo),
          '***',
        ].join('\n'))
      } else if (value.retreat) {
        Text.push(retreatText)
      } else {
        Text.push([
          '<@' + user_id + '>',
          '***',
          '**突破失败**',
          '>**修为-' + value + '**',
          '***',
          ...buildRealmInfo(userInfo),
          '***',
        ].join('\n'))
      }
    } else {
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**突破失败**',
        '>**你的修为还不足以突破**',
        '***',
        ...buildRealmInfo(userInfo),
        '***',
      ].join('\n'))
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
    if (value) {
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**开始闭关**',
        '>开始时间：' + formatTime(userInfo.retreat.startTime),
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

  '确认结束闭关': async (id, user_id, Text) => {
    const value = await xiuxian.stopRetreat(id)
    const userInfo = await xiuxian.getUserInfo(id)
    if (value) {
      Text.push([
        '<@' + user_id + '>',
        '***',
        '**结束闭关**',
        '>开始时间：' + formatTime(value.retreatStart),
        '结束时间：' + formatTime(Math.floor(Date.now() / 1000)),
        '闭关时长：' + value.retreatRunTime,
        '***',
        '**闭关收益**',
        '>修为：' + value.cult,
        '***'
      ].join('\n'))
    } else {
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
    }
    Text.push(Button.stopRetreat)
  }
}

const prefixHandlers = [
  {
    prefix: '切磋',
    handler: async (id, user_id, Text, msg) => {
      let id2
      if (/<@[^>]*>/.test(msg)) {
        const matchs = [...msg.matchAll(/<@([^>]*)>/g)]
        const ids = matchs.map(m => m[1])
        if (await xiuxian.hasPlayer(ids[0])) {
          id2 = await xiuxian.init(ids[0])
        } else {
          id2 = 0
        }
      } else {
        id2 = (msg.match(/\d+/g) || []).join('')
      }
      const value = await xiuxian.pvp(id, id2)
      if (value) {
        if (value.event) {
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
            case 'cult_lack':
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
                value.data.event_id,
                '>请确认该玩家是否存在或注册',
                '***'
              ].join('\n'))
          }
        } else {
          Text.push([
            '<@' + user_id + '>',
            '***',
            '**切磋开始**',
            '>**你对ID: [' + id2 + '](mqqapi://aio/inlinecmd?command=查询修仙者' + id2 + ')发起切磋**',
            '***',
            '**切磋信息**',
            '>你的战力：' + value.powerA,
            '对方战力：' + value.powerB,
            '切磋成功概率：' + (value.finalWinRate * 100).toFixed(2) + '%',
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
            '>你' + (value.winner ? '胜利：+' : '失败：-') + value.cultA + '点修为',
            '对方' + (value.winner ? '失败：-' : '胜利：+') + value.cultB + '点修为',
            '***'
          ].join('\n'))
        }
      }
      Text.push(Button.xiuxian)
    }
  },
  {
    prefix: '查询修仙者',
    handler: async (id, user_id, Text, msg) => {
      let query_id
      if (/<@[^>]*>/.test(msg)) {
        const matchs = [...msg.matchAll(/<@([^>]*)>/g)]
        const ids = matchs.map(m => m[1])
        if (await xiuxian.hasPlayer(ids[0])) {
          query_id = await xiuxian.init(ids[0])
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
    '>**[宗门：' + userInfo.sectInfo.sectName + ((userInfo.sectInfo.sectName === '无') ? '' : '    ID：' + userInfo.sectInfo.sectId) + '](mqqapi://aio/inlinecmd?command=我的宗门)**',
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