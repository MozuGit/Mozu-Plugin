import Redis from '#Redis'
import Config from '#Config'

Bot?.on('message', async (e) => {
  if (!['QQBot'].includes(e?.bot?.adapter?.name) || !Config.groupAdmin.setting.enable || !e.group) return false
  await Redis.zadd(
    `Mozu:groupAdmin:${e.group_id}:message_id`,
    new Date().getTime(),
    JSON.stringify({
      msg_idx: e.msg_idx,
      message_id: e.message_id
    })
  )
  await Redis.hset(`Mozu:groupAdmin:${e.group_id}:message_id_map`, e.msg_idx, e.message_id)
})
