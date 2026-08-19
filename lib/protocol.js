import Config from "#Config"

const prefix = Config.xiuxian.setting.forceSharp ? '/' : ''

const mqqapi = {
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

const laTex = {
  /**
   * 
   * @param {string} text 需要转换的文本
   * @param {boolean} perLine 是否逐行处理  默认逐字
   * @param {string[]} color 颜色列表  默认：红 橙 黄 绿 青 蓝 紫
   * @returns 返回laTex彩色格式文本
   */
  async colorize(text, perLine = false, color = []) {
    if (!color || color.length === 0) {
      color = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'magenta', 'purple']
    }
    const lines = text.split(/\r?\n/)
    let result = []
    let index = 0
    for (let line of lines) {
      if (perLine) {
        result.push(`$\\textcolor{${color[index++ % color.length]}}{${line}}$`)
      } else {
        let msg = ''
        for (let ch of line) {
          msg += `\\textcolor{${color[index++ % color.length]}}{${ch}}`
        }
        result.push(`$${msg}$`)
        index = 0
      }
    }
    return result.join('\n')
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

export { mqqapi, laTex, qagent }