import { Button, xiuxian } from "../index.js"
import { Config } from "./Config/Config.js"
import mqqapi from "./mqqapi.js"

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
        '>催一催作者：' + (await mqqapi.qagent('u_KX6qPA4vv-EbmUhf0enyNg', '魔族陌', '3343712589')),
        '***',
      ].join('\n'))
      Text.push(Button.author)
    }
  } catch (err) {
    logger.error(err)
    Text.push([
      '<@' + user_id + '>',
      '***',
      '**系统错误，请稍后重试**',
      '>联系主人：' + (await mqqapi.qagent('u_KX6qPA4vv-EbmUhf0enyNg', '魔族陌', '3343712589')),
      '***',
    ].join('\n'))
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
            ...(await buildRealmInfo(userInfo)),
            '***',
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
          '***',
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
    const value = await xiuxian.getRank(id, "修为")
    Text.push([
      '<@' + user_id + '>',
      '***',
      '**修为榜**',
      '>排行榜仅展示前10名',
      '***',
      ...(await buildRank(value.data.ranks, '修为')),
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
      ...(await buildRank(value.data.ranks, '灵石')),
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
      ...(await buildRank(value.data.ranks, '战力')),
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
      ...(await buildRank(value.data.ranks, '闭关时间')),
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
        '>宗门人数：' + userInfo.sectInfo.member + ' / ' + userInfo.sectInfo.max,
        '宗主ID：' + userInfo.sectInfo.owner,
        '***',
        '>宗门等级：' + userInfo.sectInfo.level + ' / ' + (Config.sect.sect_level.length),
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
          '>宗门等级：' + userInfo.sectInfo.level + ' / ' + Config.sect.sect_level.length,
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
          '>宗门等级：' + userInfo.sectInfo.level + ' / ' + (Config.sect.sect_level.length),
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
    prefix: /^切磋\s*\d*/,
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
    prefix: /^查询修仙者\s*\d*/,
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
    prefix: /^加入宗门\s*\d*/,
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
    prefix: /^(确认)?退出宗门$/,
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
    prefix: /^(确认)?转让宗门\s*\d*/,
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
    prefix: /^(全部)?(同意|拒绝)宗门成员\s*\d*/,
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
    prefix: /生成(通用)?兑换码(.*)/,
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
    prefix: /删除(全部)?兑换码/,
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
    }
  },
  {
    prefix: /^使用兑换码(.*)/,
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
    }
  },
  {
    prefix: /^切换ID/,
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
        ? '已满足' + (await mqqapi.command('突破')) + '条件'
        : '还需' + userInfo.realm.realmNeedExp + '点修为')),
  ]
}

async function buildRank(ranks, index) {
  let rankText = []
  for (let item of ranks) {
    rankText.push([
      '>**' + (await mqqapi.command('No.' + item.rank + ' => ' + 'ID：' + item.id, '查询修仙者' + item.id)) + '**',
      '**' + index + '：' + ((index === "闭关时间") ? secondsToTimeText(item.value) : item.value) + '**',
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