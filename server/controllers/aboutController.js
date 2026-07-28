import Redis from '#Redis'
import { Version } from '../../model/Config/Version.js'

export const getInfo = async (req, res) => {
  try {
    const presence = await Redis.sismember("Mozu:panel:token", req.headers.authorization.substring(7))
    if (!presence) {
      return res.status(401).json({
        success: false,
        message: 'token过期或无效'
      })
    }
    let data
    const cachedData = await Redis.get("Mozu:panel:package.json")
    if (!cachedData) {
      const response = await fetch("https://api.gitcode.com/api/v5/repos/MozuGit/Mozu-Plugin/contents/package.json")
      if (response.ok) {
        data = await response.json()
        const content = Buffer.from(data.content, 'base64').toString('utf-8')
        data = JSON.parse(content)
        if (data.name) await Redis.set("Mozu:panel:package.json", JSON.stringify(data), 'EX', 3600)
      }
    } else {
      data = JSON.parse(cachedData)
    }
    res.json({
      success: true,
      data: {
        version: Version.Plugin_Version,
        latestVersion: data.version || Version.Plugin_Version,
        author: data.author || Version.Plugin_pkg.author
      }
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}