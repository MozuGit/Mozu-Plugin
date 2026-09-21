import Redis from "#Redis"
import fs from "node:fs"

async function backupKeys(pattern, outputFile) {
  const writeStream = fs.createWriteStream(outputFile)
  writeStream.write('[\n')

  let firstRecord = true
  let totalExported = 0
  let isEnded = false
  let isWriting = false

  const stream = Redis.scanStream({ match: pattern, count: 100 })

  return new Promise((resolve, reject) => {
    const safeWrite = (data) => {
      if (!isEnded && !writeStream.writableEnded && !writeStream.destroyed) {
        return writeStream.write(data)
      }
      return false
    }

    const finalize = (error) => {
      if (!isEnded) {
        isEnded = true
        if (!writeStream.writableEnded && !writeStream.destroyed) {
          writeStream.write('\n]')
          writeStream.end()
        }
      }
      if (error) {
        reject(error)
      } else {
        resolve(totalExported)
      }
    }

    const getValueByType = async (key, type) => {
      const valueGetters = {
        'string': () => Redis.get(key),
        'hash': () => Redis.hgetall(key),
        'list': () => Redis.lrange(key, 0, -1),
        'set': () => Redis.smembers(key),
        'zset': () => Redis.zrange(key, 0, -1, 'WITHSCORES')
      }
      return valueGetters[type] ? await valueGetters[type]() : null
    }

    stream.on('data', async (keys) => {
      if (isEnded || isWriting) return
      isWriting = true
      stream.pause()

      try {
        const pipeline = Redis.pipeline()
        keys.forEach(key => {
          pipeline.type(key)
          pipeline.ttl(key)
        })
        const typeTtlResults = await pipeline.exec()

        const valuePromises = keys.map(async (key, index) => {
          const type = typeTtlResults[index * 2][1]
          const ttl = typeTtlResults[index * 2 + 1][1]
          const value = await getValueByType(key, type)

          return {
            key,
            type,
            ttl: ttl > 0 ? ttl : null,
            value
          }
        })

        const records = await Promise.all(valuePromises)

        for (const record of records) {
          if (record.value === null || isEnded) continue

          if (!firstRecord) {
            if (!safeWrite(',\n')) break
          }

          if (!safeWrite(JSON.stringify(record, null, 2))) break

          firstRecord = false
          totalExported++
        }
      } catch (error) {
        stream.destroy(error)
      } finally {
        isWriting = false
        if (!isEnded) {
          stream.resume()
        }
      }
    })

    stream.on('end', () => finalize(null))
    stream.on('error', (error) => finalize(error))
    writeStream.on('error', (error) => {
      isEnded = true
      stream.destroy()
      reject(error)
    })
  })
}

async function restoreKeys(backupFile) {
  try {
    let content = fs.readFileSync(backupFile, 'utf8')

    content = content.trim()
    if (!content.startsWith('[')) content = '[' + content
    if (!content.endsWith(']')) content = content + ']'

    content = content.replace(/,\s*([}\]])/g, '$1')
    content = content.replace(/,\s*,/g, ',')

    const data = JSON.parse(content)
    let restoredCount = 0
    const BATCH_SIZE = 100

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE)
      const pipeline = Redis.pipeline()

      batch.forEach(record => {
        const { key, type, ttl, value } = record

        const restoreStrategies = {
          'string': () => pipeline.set(key, value),
          'hash': () => {
            if (Object.keys(value).length > 0) {
              pipeline.hset(key, value)
            }
          },
          'list': () => {
            if (value?.length > 0) {
              pipeline.rpush(key, ...value)
            }
          },
          'set': () => {
            if (value?.length > 0) {
              pipeline.sadd(key, ...value)
            }
          },
          'zset': () => {
            if (value?.length > 0) {
              const args = [key]
              for (let i = 0; i < value.length; i += 2) {
                args.push(value[i + 1], value[i])
              }
              pipeline.zadd(...args)
            }
          }
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
  }
}

export { backupKeys, restoreKeys }