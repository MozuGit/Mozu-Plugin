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
        writeStream.write(data)
        return true
      }
      return false
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

        const backupPromises = keys.map(async (key, index) => {
          const type = typeTtlResults[index * 2][1]
          const ttl = typeTtlResults[index * 2 + 1][1]

          let value
          switch (type) {
            case 'string': value = await Redis.get(key); break
            case 'hash': value = await Redis.hgetall(key); break
            case 'list': value = await Redis.lrange(key, 0, -1); break
            case 'set': value = await Redis.smembers(key); break
            case 'zset': value = await Redis.zrange(key, 0, -1, 'WITHSCORES'); break
            default: value = null
          }

          return { key, type, ttl: ttl > 0 ? ttl : null, value }
        })

        const records = await Promise.all(backupPromises)

        for (const record of records) {
          if (record.value !== null && !isEnded) {
            if (!firstRecord) {
              if (!safeWrite(',\n')) break
            }
            if (!safeWrite(JSON.stringify(record, null, 2))) break
            firstRecord = false
            totalExported++
          }
        }

        isWriting = false
        if (!isEnded) {
          stream.resume()
        }
      } catch (error) {
        isWriting = false
        stream.destroy(error)
        reject(error)
      }
    })

    stream.on('end', () => {
      if (!isEnded) {
        isEnded = true
        if (!writeStream.writableEnded && !writeStream.destroyed) {
          writeStream.write('\n]')
          writeStream.end()
        }
        resolve(totalExported)
      }
    })

    stream.on('error', (error) => {
      if (!isEnded) {
        isEnded = true
        if (!writeStream.writableEnded && !writeStream.destroyed) {
          try {
            writeStream.write('\n]')
            writeStream.end()
          } catch (e) {
          }
        }
      }
      reject(error)
    })

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

    if (!content.startsWith('[')) {
      content = '[' + content
    }
    if (!content.endsWith(']')) {
      content = content + ']'
    }

    content = content.replace(/,\s*}/g, '}')
    content = content.replace(/,\s*]/g, ']')

    const data = JSON.parse(content)
    let restoredCount = 0

    const BATCH_SIZE = 100

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE)
      const pipeline = Redis.pipeline()

      for (const record of batch) {
        const { key, type, ttl, value } = record

        switch (type) {
          case 'string': pipeline.set(key, value); break
          case 'hash':
            if (Object.keys(value).length > 0) {
              pipeline.hset(key, value)
            }
            break
          case 'list':
            if (value && value.length > 0) {
              pipeline.rpush(key, ...value)
            }
            break
          case 'set':
            if (value && value.length > 0) {
              pipeline.sadd(key, ...value)
            }
            break
          case 'zset':
            if (value && value.length > 0) {
              const args = [key]
              for (let i = 0; i < value.length; i += 2) {
                args.push(value[i + 1])
                args.push(value[i])
              }
              pipeline.zadd(...args)
            }
            break
          default: continue
        }

        if (ttl) {
          pipeline.expire(key, ttl)
        }
      }

      await pipeline.exec()
      restoredCount += batch.length
    }

    return restoredCount
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`JSON格式错误: ${error.message}\n提示：备份文件可能缺少 [ 或 ]，已尝试自动修复`)
    }
    throw error
  }
}

export { backupKeys, restoreKeys }