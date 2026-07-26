import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import crypto from 'crypto'

import Redis from '#Redis'
import Config from '#Config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(express.json())

app.post('/api/login', async (req, res) => {
  const { reset } = req.query
  if (reset) {
    if (reset === 'get_code') {
      if (!(await Redis.get("Mozu:panel:code"))) {
        const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0')
        logger.info("[魔族陌面版][验证码] " + code)
        await Redis.set("Mozu:panel:code", code, 'EX', 300)
        res.json({
          success: true
        })
      } else {
        res.json({
          success: false,
          message: '验证码获取频繁'
        })
      }
    } else if (reset === 'get_code_ttl') {
      const ttl = await Redis.ttl("Mozu:panel:code")
      res.json({
        success: true,
        ttl: ttl
      })
    } else if (reset === 'reset_password') {
      const { code, newPassword } = req.body
      if (code === await Redis.get("Mozu:panel:code")) {
        Config.modify('panel', 'login', 'password', newPassword)
        await Redis.del("Mozu:panel:code")
        res.json({
          success: true
        })
      } else {
        res.json({
          success: false,
          message: '验证码错误'
        })
      }
      return
    }
  } else {
    const { password } = req.body
    if (!Config.panel.login.password) {
      res.json({
        success: false,
        message: '未设置密码'
      })
      return
    }
    if (password === Config.panel.login.password) {
      res.json({
        success: true,
        message: '登录成功',
        data: {
          token: 'mock-token-xxxxx'
        }
      })
    } else {
      res.json({
        success: false,
        message: '密码错误'
      })
    }
  }
})

app.use(express.static(path.join(__dirname, 'static')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'))
})

app.listen(11451, () => {
  logger.info(`网站启动成功`)
})