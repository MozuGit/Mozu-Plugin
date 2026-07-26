import Redis from '#Redis'

export const getInfo = async (req, res) => {
  try {
    const token = await Redis.get("Mozu:panel:token")
    const authHeader = req.headers.authorization.substring(7)
    if (token !== authHeader) {
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