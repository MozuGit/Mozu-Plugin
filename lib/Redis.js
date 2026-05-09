import ioredis from 'ioredis'
import { Config } from '../model/Config/Config.js'

const Redis = new ioredis({
    host: Config.Redis?.host || '127.0.0.1',
    port: Config.Redis?.port || 6379,
    database: Config.Redis?.database || 0,
    connectTimeout: Config.Redis?.connectTimeout || 10000,
    keepAlive: Config.Redis?.keepAlive || 3000,
    noDelay: Config.Redis?.host || true
})

export default Redis