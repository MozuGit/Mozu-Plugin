import Redis from '#Redis'
import { Config } from '../model/Config/Config.js'

export class MozuMakeMessage extends plugin {
  constructor() {
    super({
      name: "伪造聊天",
      dsc: "自定义伪造聊天",
      event: "message",
      priority: 1145,
      rule: [
        {
          reg: "^#?伪(造|装)聊天",
          fnc: "forged"
        },
        {
          reg: /^#?伪(造|装)复读\s*(.+?)(?:\s+(\d+))?$/,
          fnc: "repeat"
        }
      ]
    })
  }

  async forged(e) {
    if (['QQBot'].includes(e?.bot?.adapter?.name) || !Config.makeMessage.enable || (Config.makeMessage.onlyMaster && !this.e.isMaster)) return false
    let msgList = [], imgUrls = [], AtQQ = []
    let num = 0
    if (!e.group) return e.reply("私聊暂不支持此操作", true)
    let text = e.msg.replace(/#?伪(造|装)(聊天)?/g, "")
    if (text == "") return e.reply("你要造什么，造空气吗", true)
    for (let msg of e.message) {
      if (msg.type == 'image') {
        imgUrls.push(msg.url)
      }
      if (msg.type == 'at') {
        AtQQ.push(msg.qq)
      }
    }
    imgUrls.reverse()
    let data = text.split("|")
    if (data.length === 1) { data[0] = text }
    for (let i = 0; i < data.length; i++) {
      let msgContent = [], imgs = [], ifmsg = false, msg = data[i].split(/,\s*/), date
      if (msg.length > 2) {
        ifmsg = true
        if (msg[2] && msg[2].trim() !== "") {
          date = new Date(msg[2])
          if (isNaN(date.getTime())) {
            date = new Date(e.time * 1000)
            ifmsg = false
          }
        } else {
          date = new Date(e.time * 1000)
        }
      }
      if (msg.length < 2) {
        if (AtQQ.length !== 0) {
          msg[0] = AtQQ[0]
          if (AtQQ.length >= 2) {
            AtQQ.shift()
          }
          msg[1] = data[data.length - num] || data[0]
          num++
          if (data.length < num) num = num - 1
        } else {
          msg[0] = `${e.user_id}`
          msg[1] = text
        }
      }
      msgContent.push(msg[1].replace(/=img=/g, ""))
      imgs = msg[1].match(/=img=/g)
      if (imgs?.length > 0) {
        for (let j = 0; j < imgs.length; j++) {
          if (imgUrls.length === 0) break
          msgContent.push(segment.image(imgUrls[imgUrls.length - 1]))
          if (imgUrls.length !== 1) imgUrls.pop()
        }
      }
      if (Config.makeMessage.whiteQQList.includes(Number(msg[0])) && !e.isMaster) continue
      msgList.push({
        message: msgContent,
        user_id: Number(msg[0]),
        nickname: await (await Bot.pickUser(Number(msg[0])).getInfo()).nickname,
        time: ifmsg ? Number(date) / 1000 : e.time
      })
      ifmsg = false
    }
    let forwardMsg = await e.group.makeForwardMsg(msgList)
    await e.reply(forwardMsg, false, (e.isMaster) ? { recallMsg: 0 } : { recallMsg: 60 })
    return true
  }

  async repeat(e) {
    if (['QQBot'].includes(e?.bot?.adapter?.name) || !Config.makeMessage.enable || (Config.makeMessage.onlyMaster && !this.e.isMaster)) return false
    let msgList = []
    if (!e.group) return e.reply("私聊暂不支持此操作", true)
    let match = e.msg.match(/^#?伪(造|装)复读\s*(.+?)(?:\s+(\d+))?$/)
    let text = match[2]
    let number = match[3] ? parseInt(match[3]) : Config.makeMessage.repeatCount || 10
    const QQListdata = await this.e.group.getMemberArray()
    let userIds = QQListdata.map(member => member.user_id)
    let userNames = QQListdata.map(member => member.nickname)
    for (let i = 0; i < number; i++) {
      if (userIds.length === 0) break
      const randomIndex = Math.floor(Math.random() * userIds.length)
      const userId = userIds[randomIndex]
      const userName = userNames[randomIndex]
      userIds.splice(randomIndex, 1)
      userNames.splice(randomIndex, 1)
      msgList.push({
        message: text,
        user_id: userId,
        nickname: userName,
        time: e.time
      })
    }
    let forwardMsg = await e.group.makeForwardMsg(msgList)
    await e.reply(forwardMsg, false, (e.isMaster) ? { recallMsg: 0 } : { recallMsg: 60 })
    return true
  }
}