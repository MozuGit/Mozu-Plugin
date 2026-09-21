import ioredis from 'ioredis'
import Config from "#Config"

const Redis = new ioredis({
  host: Config.config.Redis?.host || '127.0.0.1',
  port: Config.config.Redis?.port || 6379,
  database: Config.config.Redis?.database || 0,
  connectTimeout: Config.config.Redis?.connectTimeout || 10000,
  keepAlive: Config.config.Redis?.keepAlive || 3000,
  noDelay: Config.config.Redis?.noDelay || true
})

export default Redis