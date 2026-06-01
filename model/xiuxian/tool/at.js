import { Config } from "./Config/Config.js"

export default function(msg, self_id) {
  const matches = [...msg.matchAll(/<@(.*?)>/g)]
  const ids = matches.map(m => m[1])
  if (ids.length !== 0) {
    if (ids.length === 1) {
      return ids[0]
    } else {
      if (ids[0].replace(`${self_id}:`, '') === Config.setting.BotID) {
        return ids[1]
      } else {
        return ids[0]
      }
    }
  }
  return
}