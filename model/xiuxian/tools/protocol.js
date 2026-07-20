import Config from "#Config"

const prefix = Config.xiuxian.setting.forceSharp ? '/' : ''

export const mqqapi = new class {
  /**
   * 
   * @param {string} text 显示文本
   * @param {string} command 点击回复文本
   * @param {boolean} ender 是否直接发送，由于mqqapi限制 该方法可能在未来某一时间失效
   * @returns 返回mqqapi格式文本
   */
  async command(text, command = text, ender = false) {
    command = `${prefix}${command}`
    let result
    if (ender) {
      result = `[](mqqapi://aio/inlinecmd?command=${command}&ender=false)[${text}](mqqapi://aio/inlinecmd?command=${command}&ender=false1)`
    } else {
      result = `[${text}](mqqapi://aio/inlinecmd?command=${command}&ender=false)`
    }
    return result
  }
}

/**
  * 
  * @param {string} peerUid QQ的Uid
  * @param {string} peerName 显示文本
  * @returns 返回qagent格式文本
*/
async function qagent(peerUid = "u_KX6qPA4vv-EbmUhf0enyNg", peerName = "魔族陌") {
  const result = `[${peerName}](qagent://markdown/node?type=quser&peerUid=${peerUid}&peerName=${peerName})`
  return result
}

export { qagent }