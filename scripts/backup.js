import Redis from "#Redis"
import fs from "node:fs"
import { Writable } from "node:stream"

class JsonArrayFileWritable extends Writable {
  constructor(filePath) {
    super({ objectMode: true })
    this.filePath = filePath
    this.fileStream = null
    this.firstRecord = true
    this.totalExported = 0
  }

  _construct(callback) {
    this.fileStream = fs.createWriteStream(this.filePath)
    this.fileStream.on("error", (err) => this.destroy(err))
    this.fileStream.write("[\n", callback)
  }

  _write(record, _enc, callback) {
    const prefix = this.firstRecord ? "" : ",\n"
    const text = prefix + JSON.stringify(record, null, 2)
    this.firstRecord = false
    this.totalExported += 1

    if (this.fileStream.write(text)) {
      callback()
    } else {
      this.fileStream.once("drain", callback)
    }
  }

  _final(callback) {
    this.fileStream.end("\n]", callback)
  }

  _destroy(err, callback) {
    if (
      this.fileStream &&
      !this.fileStream.destroyed &&
      !this.fileStream.writableEnded
    ) {
      this.fileStream.destroy()
    }
    callback(err)
  }
}

function writeAsync(writable, chunk) {
  return new Promise((resolve, reject) => {
    if (writable.destroyed) {
      return reject(new Error("writable destroyed"))
    }
    const ok = writable.write(chunk, (err) => {
      if (err) reject(err)
    })
    if (ok) {
      resolve()
    } else {
      writable.once("drain", resolve)
      writable.once("error", reject)
    }
  })
}

function endAsync(writable) {
  return new Promise((resolve, reject) => {
    writable.end((err) => (err ? reject(err) : resolve()))
  })
}

async function backupKeys(pattern, outputFile) {
  const target = new JsonArrayFileWritable(outputFile)

  const getValueByType = async (key, type) => {
    const valueGetters = {
      string: () => Redis.get(key),
      hash: () => Redis.hgetall(key),
      list: () => Redis.lrange(key, 0, -1),
      set: () => Redis.smembers(key),
      zset: () => Redis.zrange(key, 0, -1, "WITHSCORES"),
    }
    return valueGetters[type] ? await valueGetters[type]() : null
  }

  try {
    for await (const keys of Redis.scanStream({ match: pattern, count: 100 })) {
      const pipeline = Redis.pipeline()
      keys.forEach((key) => {
        pipeline.type(key)
        pipeline.ttl(key)
      })
      const typeTtlResults = await pipeline.exec()

      const valuePromises = keys.map(async (key, index) => {
        const type = typeTtlResults[index * 2][1]
        const ttl = typeTtlResults[index * 2 + 1][1]
        const value = await getValueByType(key, type)
        return { key, type, ttl: ttl > 0 ? ttl : null, value }
      })

      const records = await Promise.all(valuePromises)

      for (const record of records) {
        if (record.value === null) continue
        await writeAsync(target, record)
      }
    }

    await endAsync(target)

    return target.totalExported
  } catch (error) {
    if (!target.destroyed) target.destroy(error)
    throw error
  }
}

async function scanAllKeys(pattern = "*") {
  return new Promise((resolve, reject) => {
    const keys = []
    const stream = Redis.scanStream({ match: pattern, count: 100 })
    stream.on("data", (batch) => keys.push(...batch))
    stream.on("end", () => resolve(keys))
    stream.on("error", reject)
  })
}

async function restoreKeys(backupFile, options = {}) {
  const { purge = true, pattern = "*" } = options

  try {
    let content = fs.readFileSync(backupFile, "utf8").trim()
    if (!content.startsWith("[")) content = "[" + content
    if (!content.endsWith("]")) content = content + "]"
    content = content.replace(/,\s*([}\]])/g, "$1").replace(/,\s*,/g, ",")

    const data = JSON.parse(content)
    let restoredCount = 0
    const BATCH_SIZE = 100

    const backupKeySet = new Set(data.map((r) => r.key))

    let deletedCount = 0
    if (purge) {
      const existingKeys = await scanAllKeys(pattern)
      const keysToDelete = existingKeys.filter((k) => !backupKeySet.has(k))

      for (let i = 0; i < keysToDelete.length; i += BATCH_SIZE) {
        const batch = keysToDelete.slice(i, i + BATCH_SIZE)
        if (batch.length > 0) {
          await Redis.unlink(...batch)
          deletedCount += batch.length
        }
      }
    }

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE)

      const keysInBatch = batch.map((r) => r.key)
      if (keysInBatch.length > 0) {
        await Redis.del(...keysInBatch)
      }

      const pipeline = Redis.pipeline()

      batch.forEach((record) => {
        const { key, type, ttl, value } = record

        const restoreStrategies = {
          string: () => pipeline.set(key, value),
          hash: () => {
            if (value && Object.keys(value).length > 0) {
              pipeline.hset(key, value)
            }
          },
          list: () => {
            if (value?.length > 0) {
              pipeline.rpush(key, ...value)
            }
          },
          set: () => {
            if (value?.length > 0) {
              pipeline.sadd(key, ...value)
            }
          },
          zset: () => {
            if (value?.length > 0) {
              const args = [key]
              for (let j = 0; j < value.length; j += 2) {
                args.push(value[j + 1], value[j])
              }
              pipeline.zadd(...args)
            }
          },
        }

        restoreStrategies[type]?.()

        if (ttl) {
          pipeline.expire(key, ttl)
        }
      })

      await pipeline.exec()
      restoredCount += batch.length
    }

    return restoredCount
  } catch (error) {
    logger.error(error)
    throw error
  }
}

export { backupKeys, restoreKeys }