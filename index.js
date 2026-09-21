import fs, { appendFile } from "fs"
import path from "path"
import { fileURLToPath, pathToFileURL } from 'url'
import { Version } from './model/Config/Version.js'
try {
  await import('./server/index.js')
} catch (err) { logger.error("[魔族陌面版] 服务器启动失败：", err) }

const _filename = fileURLToPath(import.meta.url)
const pluginRoot = path.dirname(_filename)

let ret = []

async function getFiles(dir) {
  const dirs = await fs.promises.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirs.map((each) => {
      const res = path.resolve(dir, each.name)
      return each.isDirectory() ? getFiles(res) : res
    })
  )
  return Array.prototype.concat(...files)
}

const appFiles = await getFiles(path.join(pluginRoot, "apps")).then((files) =>
  files.filter((file) => file.endsWith(".js"))
)

const files = [...appFiles]

files.forEach((file) => {
  file = pathToFileURL(file).href
  ret.push(import(file))
})

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in files) {
  let name = files[i].replace(".js", "")
  const appName = path.basename(name)

  if (ret[i].status !== "fulfilled") {
    logger.error(`载入插件错误：${logger.red(name)}`)
    logger.error(ret[i].reason)
    continue
  }
  const keys = Object.keys(ret[i].value)
  const validKey = keys.find(key => key.toLowerCase() === appName.toLowerCase()) || keys[0]
  apps[name] = ret[i].value[validKey]
}

const RGB = [[255, 107, 107], [255, 165, 107], [255, 231, 107], [107, 255, 150], [107, 200, 255], [180, 107, 255], [255, 107, 200]]

logger.info(buildLoggerRGB("━━━━━━━━━━━━━━━━━━━━━━"))
logger.info(buildLoggerRGB("┃ Mozu-Plugin 载入成功"))
logger.info(buildLoggerRGB("┃ 版本：v" + Version.Plugin_Version))
logger.info(buildLoggerRGB("┃ 陌陌の小窝：976719017"))
logger.info(buildLoggerRGB("━━━━━━━━━━━━━━━━━━━━━━"))

function buildLoggerRGB(message) {
  let index = 0
  let result = ""
  for (const ch of message) {
    result += logger.rgb(...(RGB[index++ % RGB.length]))(ch)
  }
  return result
}

export { apps }