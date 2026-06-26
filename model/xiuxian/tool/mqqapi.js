import { Config } from "./Config/Config.js"

const prefix = Config.setting.forceSharp ? '/' : ''

export default new class {
  async command(text, command = text, ender = false) {
    command = `${prefix}${command}`
    let message
    if (ender) {    //由于mqqapi限制，该方法可能在未来某一时间失效
      message = `[](mqqapi://aio/inlinecmd?command=${command}&ender=false)[${text}](mqqapi://aio/inlinecmd?command=${command}&ender=false1)`
    } else {
      message = `[${text}](mqqapi://aio/inlinecmd?command=${command}&ender=false)`
    }
    return message
  }
}