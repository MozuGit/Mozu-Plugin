import fs, { appendFile } from "fs"
import path from "path"
import { fileURLToPath, pathToFileURL } from 'url'
import { Version } from './model/Config/Version.js'

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
  const validKey = keys.find(key => key.toLowerCase() === appName.toLowerCase()) || keys[0] // 如果没有同名的键，默认取第一个
  apps[name] = ret[i].value[validKey]
}

const RGB = [
  Math.floor(Math.random() * 155 + 100),
  Math.floor(Math.random() * 155 + 100),
  Math.floor(Math.random() * 155 + 100)
]
RGB.sort(() => Math.random() - 0.5)

logger.info(logger.rgb(...RGB)("━━━━━━━━━━━━━━━━━━━━"))
logger.info(logger.rgb(...RGB)("Mozu-Plugin 载入成功"))
logger.info(logger.rgb(...RGB)("版本：v" + Version.Plugin_Version))
logger.info(logger.rgb(...RGB)("交流群：976719017"))
logger.info(logger.rgb(...RGB)("━━━━━━━━━━━━━━━━━━━━"))

export { apps }
