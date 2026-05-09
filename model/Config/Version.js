import fs from 'node:fs'
import { fileURLToPath } from 'url'
import { basename, dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const Path = process.cwd().replace(/\\/g, '/')
const Plugin_Path = join(__dirname, '../..').replace(/\\/g, '/')
const pkg = JSON.parse(await fs.promises.readFile(join(__dirname, '../../package.json'), 'utf8'))

export const Version = {
    get Plugin_Path() {
        return Plugin_Path
    },
    get Plugin_Name() {
        return basename(Path)
    },
    get Plugin_Version() {
        return pkg.version
    }
}