import { xiuxian } from "../index.js"
import { Config } from "./Config/Config.js"

async function xiuxianText(msg, user_id, self_id) {
  const id = await xiuxian.init(user_id)
  let Text
  if (msg === '修炼') {
    const value = await xiuxian.xiulian(id)
    const userInfo = await xiuxian.getUserInfo(id)
    if (value.cult && value.addcult) {
      Text = [
        '<@' + user_id.replace(`${self_id}:`, '') + '>',
        '***',
        '**ID：' + id + '**',
        '**[切磋](mqqapi://aio/inlinecmd?command=切磋 ' + id + ')' + '**',
        '***',
        '**[修炼完成](mqqapi://aio/inlinecmd?command=修炼)**',
        '>获得修为' + value.addcult + '点',
        '***',
        '>**[称号：' + userInfo.title + '](mqqapi://aio/inlinecmd?command=我的称号)**',
        '>**[性别：' + userInfo.sex + '](mqqapi://aio/inlinecmd?command=设置性别)**',
        '>**[宗门：' + userInfo.sectInfo.sectName + '    ID：' + userInfo.sectInfo.sectId + '](mqqapi://aio/inlinecmd?command=我的宗门)**',
        '***',
        '>[境界：' + userInfo.realm.realmName + '](mqqapi://aio/inlinecmd?command=突破)',
        '当前修为：' + userInfo.cult,
        '下一境界：' + userInfo.realm.realmName2,
        '距离下一境界：' + ((userInfo.realm.realmNeedExp === 0) ? '已满足[突破](mqqapi://aio/inlinecmd?command=突破)条件' : '还需' + userInfo.realm.realmNeedExp + '点修为'),
        '***'
      ].join('\n')
    } else {
      Text = [
        '<@' + user_id.replace(`${self_id}:`, '') + '>',
        '***',
        '**当前正在CD中...**',
        '>剩余：' + value.outTime + '秒',
        '***',
      ].join('\n')
    }
  } else if (msg === '开采') {
    const value = await xiuxian.kaicai(id)
    const userInfo = await xiuxian.getUserInfo(id)
    if (value.ls && value.addls) {
      Text = [
        '<@' + user_id.replace(`${self_id}:`, '') + '>',
        '***',
        '**ID：' + id + '**',
        '**[切磋](mqqapi://aio/inlinecmd?command=切磋 ' + id + ')' + '**',
        '***',
        '**[开采完成](mqqapi://aio/inlinecmd?command=开采)**',
        '>获得' + value.addls + '灵石',
        '***',
        '>**[称号：' + userInfo.title + '](mqqapi://aio/inlinecmd?command=我的称号)**',
        '>**[性别：' + userInfo.sex + '](mqqapi://aio/inlinecmd?command=设置性别)**',
        '>**[宗门：' + userInfo.sectInfo.sectName + '    ID：' + userInfo.sectInfo.sectId + '](mqqapi://aio/inlinecmd?command=我的宗门)**',
        '***'
      ].join('\n')
    } else {
      Text = [
        '<@' + user_id.replace(`${self_id}:`, '') + '>',
        '***',
        '**当前正在CD中...**',
        '>剩余：' + value.outTime + '秒',
        '***',
      ].join('\n')
    }
  } else if (msg === '修仙签到') {
    const value = await xiuxian.sign(id)
    const userInfo = await xiuxian.getUserInfo(id)
    if (value) {
      Text = [
        '<@' + user_id.replace(`${self_id}:`, '') + '>',
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
      ].join('\n')
    } else {
      Text = [
        '<@' + user_id.replace(`${self_id}:`, '') + '>',
        '***',
        '**今天已经签到过了，明天再来吧**',
        '***',
        '**签到情况**',
        '>签到次数：' + userInfo.signNum + '天',
        '***',
      ].join('\n')
    }
  } else if (msg === "突破") {
    const value = await xiuxian.realmUp(id)
    const userInfo = await xiuxian.getUserInfo(id)
    if (value) {
      if (value === true) {
        Text = [
          '<@' + user_id.replace(`${self_id}:`, '') + '>',
          '***',
          '**突破成功**',
          '>成功突破到：**' + userInfo.realm.realmName + '**',
          '***',
          '>[境界：' + userInfo.realm.realmName + '](mqqapi://aio/inlinecmd?command=突破)',
          '当前修为：' + userInfo.cult,
          '下一境界：' + userInfo.realm.realmName2,
          '距离下一境界：' + ((userInfo.realm.realmNeedExp === 0) ? '已满足[突破](mqqapi://aio/inlinecmd?command=突破)条件' : '还需' + userInfo.realm.realmNeedExp + '点修为'),
          '***',
        ].join('\n')
      } else {
        Text = [
          '<@' + user_id.replace(`${self_id}:`, '') + '>',
          '***',
          '**突破失败**',
          '>**修为-' + value + '**',
          '***',
          '>[境界：' + userInfo.realm.realmName + '](mqqapi://aio/inlinecmd?command=突破)',
          '当前修为：' + userInfo.cult,
          '下一境界：' + userInfo.realmName2,
          '距离下一境界：' + '还需' + userInfo.realm.realmNeedExp + '点修为',
          '***',
        ].join('\n')
      }
    } else {
      Text = [
        '<@' + user_id.replace(`${self_id}:`, '') + '>',
        '***',
        '**突破失败**',
        '>**你的修为还不足以突破**',
        '***',
        '>[境界：' + userInfo.realm.realmName + '](mqqapi://aio/inlinecmd?command=突破)',
        '当前修为：' + userInfo.cult,
        '下一境界：' + userInfo.realm.realmName2,
        '距离下一境界：' + '还需' + userInfo.realm.realmNeedExp + '点修为',
        '***',
      ].join('\n')
    }
  } else if (msg === "修仙个人信息") {
    const userInfo = await xiuxian.getUserInfo(id)
    Text = [
      '<@' + user_id.replace(`${self_id}:`, '') + '>',
      '***',
      '**ID：' + id + '**',
      '**[切磋](mqqapi://aio/inlinecmd?command=切磋 ' + id + ')' + '**',
      '***',
      '>**[称号：' + userInfo.title + '](mqqapi://aio/inlinecmd?command=我的称号)**',
      '>**[性别：' + userInfo.sex + '](mqqapi://aio/inlinecmd?command=设置性别)**',
      '>**[宗门：' + userInfo.sectInfo.sectName + '    ID：' + userInfo.sectInfo.sectId + '](mqqapi://aio/inlinecmd?command=我的宗门)**',
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
    ].join('\n')
  } else if (msg === "开始闭关") {
    const userInfo = await xiuxian.getUserInfo(id)
    if (userInfo.retreat.startTime === 0) {
      Text = [
        '<@' + user_id.replace(`${self_id}:`, '') + '>',
        '***',
        '**闭关说明**',
        '>闭关期间无法进行任何操作',
        '每闭关一小时获得' + Config.xiuxian.retreat.cult + '点修为',
        '闭关上限' + Config.xiuxian.retreat.max + '小时',
        '闭关上限后时间仍会累计，但收益不会计算',
        '***'
      ].join('\n')
    } else {
      Text = [
        '<@' + user_id.replace(`${self_id}:`, '') + '>',
        '***',
        '**你当前正在闭关中**',
        '>开始时间：' + formatTime(userInfo.retreat.startTime),
        '闭关时长：' + userInfo.retreat.runTime,
        '***'
      ].join('\n')
    }
  } else if (msg === "结束闭关") {
    const userInfo = await xiuxian.getUserInfo(id)
    if (userInfo.retreat.startTime === 0) {
      Text = [
        '<@' + user_id.replace(`${self_id}:`, '') + '>',
        '***',
        '**你还没开始闭关呢**',
        '>闭关期间无法进行任何操作',
        '每闭关一小时获得' + Config.xiuxian.retreat.cult + '点修为',
        '闭关上限' + Config.xiuxian.retreat.max + '小时',
        '闭关上限后时间仍会累计，但收益不会计算',
        '***'
      ].join('\n')
    } else {
      Text = [
        '<@' + user_id.replace(`${self_id}:`, '') + '>',
        '***',
        '**闭关说明**',
        '>开始时间：' + formatTime(userInfo.retreat.startTime),
        '闭关时长：' + userInfo.retreat.runTime,
        '***',
        '**现在闭关收益**',
        '>修为：' + userInfo.retreat.profit.cult,
        '***'
      ].join('\n')
    }
  } else if (msg === "确认开始闭关") {
    const value = await xiuxian.startRetreat(id)
    const userInfo = await xiuxian.getUserInfo(id)
    if (value) {
      Text = [
        '<@' + user_id.replace(`${self_id}:`, '') + '>',
        '***',
        '**开始闭关**',
        '>开始时间：' + formatTime(userInfo.retreat.startTime),
        '***'
      ].join('\n')
    } else {
      Text = [
        '<@' + user_id.replace(`${self_id}:`, '') + '>',
        '***',
        '**你当前正在闭关中**',
        '>开始时间：' + formatTime(userInfo.retreat.startTime),
        '闭关时长：' + userInfo.retreat.runTime,
        '***'
      ].join('\n')
    }
  } else if (msg === "确认结束闭关") {
    const value = await xiuxian.stopRetreat(id)
    const userInfo = await xiuxian.getUserInfo(id)
    if (value) {
      Text = [
        '<@' + user_id.replace(`${self_id}:`, '') + '>',
        '***',
        '**结束闭关**',
        '>开始时间：' + formatTime(value.retreatStart),
        '结束时间：' + formatTime(Math.floor(Date.now() / 1000)),
        '闭关时长：' + value.retreatRunTime,
        '***',
        '**闭关收益**',
        '>修为：' + value.cult,
        '***'
      ].join('\n')
    } else {
      Text = [
        '<@' + user_id.replace(`${self_id}:`, '') + '>',
        '***',
        '**你还没开始闭关呢**',
        '>闭关期间无法进行任何操作',
        '每闭关一小时获得' + Config.xiuxian.retreat.cult + '点修为',
        '闭关上限' + Config.xiuxian.retreat.max + '小时',
        '闭关上限后时间仍会累计，但收益不会计算',
        '***'
      ].join('\n')
    }
  } else {
    Text = [
      '<@' + user_id.replace(`${self_id}:`, '') + '>',
      '***',
      '**待更新**',
      '>**[聊天群：976719017](mqqapi://aio/inlinecmd?command=976719017)**',
      '***'
    ].join('\n')
  }
  return Text
}

export { xiuxianText }

/**
 * 时间戳转 2026-01-01 08:00:00 格式
 * @param {number} timestamp 秒级/毫秒级时间戳自动兼容
 * @returns {string} 格式化时间
 */
function formatTime(timestamp) {
  const time = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
  const d = new Date(time);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${h}:${m}:${s}`;
}