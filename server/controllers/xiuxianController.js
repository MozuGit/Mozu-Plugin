import Redis from '#Redis'

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
    const stream = Redis.scanStream({
      match: "Mozu:xiuxian:cdk:*",
      count: 100
    })
    let cdks = []
    for await (const keys of stream) {
      if (keys.length) {
        keys.forEach(key => cdks.push(key))
      }
    }
    const pipeline = Redis.pipeline()
    for (const cdk of cdks) {
      pipeline.hgetall(cdk)
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