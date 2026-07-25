import util from 'util'
import OpenAI from 'openai'

import Config from '#Config'

export default new class {
  /**
   * AI审核文本
   * @param {string} messgae 
   * @returns 返回true表示内容正常
   */
  async aiAuditText(messgae) {
    try {
      const client = new OpenAI({
        apiKey: Config.config.openai.apiKey,
        baseURL: Config.config.openai.baseURL
      })
      const complettion = await client.chat.completions.create({
        model: Config.config.openai.model,
        messages: [
          { role: 'user', content: "返回是/否\n请只判断以下内容是否违规\n内容：" + messgae }
        ]
      })
      return complettion.choices[0].message.content
    } catch (err) {
      logger.error(logger.cyan("[魔族陌修仙][OpenAI]") + logger.red(util.inspect(err)))
    }
  }
}