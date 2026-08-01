import Redis from '#Redis'
import Config from '#Config'

export const getInfo = async (req, res) => {
  try {
    const presence = await Redis.sismember("Mozu:panel:token", req.headers.authorization.substring(7))
    if (!presence) {
      return res.status(401).json({
        success: false,
        message: 'token过期或无效'
      })
    }
    const playerCount = parseInt(await Redis.get("Mozu:xiuxian:openid:counter"), 10)
    const sectCount = parseInt(await Redis.get("Mozu:xiuxian:sectid:counter"), 10)
    res.json({
      success: true,
      data: {
        playerCount: playerCount,
        sectCount: sectCount
      }
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const handleCdk = async (req, res) => {
  const presence = await Redis.sismember("Mozu:panel:token", req.headers.authorization.substring(7))
  if (!presence) {
    return res.status(401).json({
      success: false,
      message: 'token过期或无效'
    })
  }
  const { action } = req.query
  try {
    if (action === 'getlist') {
      return await getCdkList(req, res)
    }

    if (action === 'delete') {
      return await deleteCdks(req, res)
    }

    if (action === 'add' || action === 'modify') {
      return await addCdk(req, res)
    }
  } catch (error) {
    res.json({
      success: false,
      message: error.message
    })
  }
}

const getCdkList = async (req, res) => {
  try {
    const cdks = await Redis.smembers("Mozu:xiuxian:cdks")
    const pipeline = Redis.pipeline()
    for (const cdk of cdks) {
      pipeline.hgetall(`Mozu:xiuxian:cdk:${cdk}`)
    }
    const results = await pipeline.exec()
    const cdkInfos = results.map(([err, result], index) => ({
      name: cdks[index].replace("Mozu:xiuxian:cdk:", ""),
      ...result
    }))
    res.json({
      success: true,
      data: {
        cdks: cdkInfos
      }
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const addCdk = async (req, res) => {
  try {
    const { name, genera, forceSetting, cultList, lsList } = req.body
    await Redis.hset(`Mozu:xiuxian:cdk:${name}`, 'value', JSON.stringify({ genera, forceSetting, cultList, lsList }))
    res.json({
      success: true
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const deleteCdks = async (req, res) => {
  try {
    const { list } = req.body
    const pipeline = Redis.pipeline()
    for (const cdk of list) {
      pipeline.del(`Mozu:xiuxian:cdk:${cdk}`)
    }
    await pipeline.exec()
    res.json({
      success: true
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const handlePlayer = async (req, res) => {
  const presence = await Redis.sismember("Mozu:panel:token", req.headers.authorization.substring(7))
  if (!presence) {
    return res.status(401).json({
      success: false,
      message: 'token过期或无效'
    })
  }
  const { action } = req.query
  try {
    if (action === 'getlist') {
      return await getPlayerList(req, res)
    }

    if (action === 'modify') {
      return await modifyPlayer(req, res)
    }

    if (action === 'getrealm') {
      return await getRealm(req, res)
    }
  } catch (error) {
    res.json({
      success: false,
      message: error.message
    })
  }
}

const getPlayerList = async (req, res) => {
  try {
    const { page } = req.query
    const start = page * 10 + 1
    const id = parseInt(await Redis.get('Mozu:xiuxian:openid:counter'), 10)
    if (id < start) {
      return res.json({
        success: true,
        data: {
          players: []
        }
      })
    }
    const end = Math.min(start + 10, id + 1)
    const pipeline = Redis.pipeline()
    for (let i = start; i < end; i++) {
      pipeline.hgetall(`Mozu:xiuxian:playerInfo:${i}`)
    }
    const results = await pipeline.exec()
    const playerInfos = results.map(([err, result], index) => ({
      id: start + index,
      cult: result.修为,
      ls: result.灵石,
      realm: result.境界,
      sex: result.性别,
      titleIndex: result.称号,
      titles: JSON.parse(result.称号列表 || '[]')
    }))
    res.json({
      success: true,
      data: {
        players: playerInfos,
        playerCount: id
      }
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const modifyPlayer = async (req, res) => {
  try {
    const { id } = req.query
    if ((await Redis.exists(`Mozu:xiuxian:playerInfo:${id}`)) === 0) {
      res.json({ success: false, message: "修仙玩家不存在" })
    }
    const { cult, ls, realm, sex, titleIndex, titles } = req.body
    await Redis.hmset(`Mozu:xiuxian:playerInfo:${id}`, {
      修为: cult,
      灵石: ls,
      境界: realm,
      性别: sex,
      称号: titleIndex,
      称号列表: JSON.stringify(titles)
    })
    res.json({ success: true })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const getRealm = async (req, res) => {
  try {
    const data = Config.xiuxian.Realm.Realms.map(realm => realm.name)
    res.json({
      success: true,
      data: ['无', ...data]
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}