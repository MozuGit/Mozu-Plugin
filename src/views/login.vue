<template>
  <div class="login-container">
    <!-- GitHub 图标 - 右上角 -->
    <a class="github-link" href="https://github.com/MozuGit/Mozu-Plugin" target="_blank">
      <svg height="32" viewBox="0 0 16 16" width="32" fill="white">
        <path
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
    </a>

    <!-- 左侧内容 -->
    <div class="left-content">
      <div class="slogan-wrapper">
        <!-- 图片 -->
        <div class="logo-image">
          <img src="../Mo.png" alt="Mozu Logo" />
        </div>
        <!-- 字幕 -->
        <div class="slogan">
          <div class="main-title">Mozu-Plugin</div>
          <div class="sub-title">
            不知道写什么
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录/重置面板容器 -->
    <div class="right-panel-wrapper">
      <!-- 登录卡片 -->
      <div class="login-box" :class="{ 'fade-out': showResetPanel }">
        <h1>魔族陌登录</h1>
        <a-form :model="form" @finish="handleLogin">
          <a-form-item style="margin-bottom: 0;">
            <a-input-password v-model:value="form.password" placeholder="密码" size="large">
              <template #prefix>
                <LockOutlined />
              </template>
            </a-input-password>
          </a-form-item>
          <div style="text-align: right; margin-bottom: 5px; margin-top: 0; line-height: 1;">
            <a-button type="link" @click="openResetPanel"
              style="padding: 0; height: auto; font-size: 14px;">忘记密码</a-button>
          </div>
          <a-form-item style="margin-bottom: 0;">
            <a-button type="primary" html-type="submit" block size="large" :loading="loading" class="gold-black-btn">
              登 录
            </a-button>
          </a-form-item>
        </a-form>
      </div>

      <!-- 重置密码卡片 -->
      <div class="login-box reset-panel" :class="{ 'slide-in-right': showResetPanel }">
        <!-- 使用相对定位容器，让标题绝对居中 -->
        <div style="position: relative; display: flex; align-items: center; margin-bottom: 20px; height: 32px;">
          <a-button type="text" @click="closeResetPanel" style="padding: 0; position: absolute; left: 0; z-index: 1;">
            <template #icon>
              <ArrowLeftOutlined />
            </template>
          </a-button>
          <h2
            style="margin: 0; width: 100%; text-align: center; font-size: 20px; position: absolute; left: 0; right: 0;">
            忘记密码
          </h2>
        </div>
        <a-form :model="resetForm" @finish="handleResetPassword" size="default">
          <a-form-item style="margin-bottom: 12px;">
            <div style="display: flex; gap: 8px;">
              <a-input v-model:value="resetForm.code" placeholder="验证码" size="default" style="flex: 1;" maxlength="6"
                @input="handleCodeInput">
                <template #prefix>
                  <SafetyOutlined />
                </template>
              </a-input>
              <a-button type="primary" :disabled="countdown > 0 || sendingCode" @click="handleGetCode" size="default"
                class="gold-black-btn" style="min-width: 110px; font-size: 13px;">
                {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
              </a-button>
            </div>
          </a-form-item>
          <a-form-item style="margin-bottom: 16px;">
            <a-input-password v-model:value="resetForm.newPassword" placeholder="新密码" size="default">
              <template #prefix>
                <LockOutlined />
              </template>
            </a-input-password>
          </a-form-item>
          <a-form-item style="margin-bottom: 0;">
            <a-button type="primary" html-type="submit" block size="default" :loading="resetting"
              class="gold-black-btn">
              重置密码
            </a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { LockOutlined, SafetyOutlined, ArrowLeftOutlined } from '@ant-design/icons-vue'

const router = useRouter()

const loading = ref(false)
const showResetPanel = ref(false)
const sendingCode = ref(false)
const resetting = ref(false)
const countdown = ref(0)
let timer = null

const form = reactive({
  password: ''
})

const resetForm = reactive({
  code: '',
  newPassword: ''
})

function handleCodeInput(e) {
  let value = e.target.value
  value = value.replace(/[^\d]/g, '')
  if (value.length > 6) {
    value = value.slice(0, 6)
  }
  resetForm.code = value
}

function startCountdown() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (countdown.value <= 0) return
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
      fetchTTL()
    }
  }, 1000)
}

function openResetPanel() {
  showResetPanel.value = true
  resetForm.code = ''
  resetForm.newPassword = ''
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  countdown.value = 0
  fetchTTL()
}

async function fetchTTL() {
  try {
    const res = await fetch('/api/login?reset=get_code_ttl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    if (data.success && data.ttl > 0) {
      countdown.value = data.ttl
      startCountdown()
    }
  } catch (e) { }
}

function closeResetPanel() {
  showResetPanel.value = false
}

// 登录逻辑
async function handleLogin() {
  loading.value = true
  try {
    if (!form.password) return message.error("密码不能为空")
    const hashedPassword = await hashSHA256(form.password)
    const payload = {
      password: hashedPassword
    }
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()

    if (data.success) {
      localStorage.setItem('token', data.data.token)
      message.success('登录成功')
      router.push('/xiuxian')
    } else {
      message.error(data.message || '登录失败')
    }
  } catch (e) {
    message.error('网络错误，请重试')
  } finally {
    loading.value = false
  }
}

// 获取验证码
async function handleGetCode() {
  if (countdown.value > 0 || sendingCode.value) return
  sendingCode.value = true
  try {
    const res = await fetch('/api/login?reset=get_code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    if (data.success) {
      message.success('验证码已发送')
      await fetchTTL()
    } else {
      message.error(data.message || '获取验证码失败')
    }
  } catch (e) {
    message.error('网络错误，请重试')
  } finally {
    sendingCode.value = false
  }
}

// 重置密码
async function handleResetPassword() {
  if (!resetForm.code) {
    message.error('请输入验证码')
    return
  }
  if (!resetForm.newPassword) {
    message.error('请输入新密码')
    return
  }
  if (resetForm.newPassword.length < 6) {
    message.error('密码不能少于6位')
    return
  }
  resetting.value = true
  try {
    const hashedPassword = await hashSHA256(resetForm.newPassword)
    const res = await fetch('/api/login?reset=reset_password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: resetForm.code,
        newPassword: hashedPassword
      })
    })
    const data = await res.json()
    if (data.success) {
      message.success('密码重置成功，请重新登录')
      closeResetPanel()
    } else {
      message.error(data.message || '重置失败')
    }
  } catch (e) {
    message.error('网络错误，请重试')
  } finally {
    resetting.value = false
  }
}

async function hashSHA256(password) {
  if (!window.crypto?.subtle?.digest) {
    return password
  }
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}
</script>

<style scoped>
.login-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #eaea66 0%, #a936d0 100%);
  padding: 0 10%;
  gap: 60px;
  position: relative;
  overflow: hidden;
}

/* GitHub 图标 - 右上角 */
.github-link {
  position: absolute;
  top: 30px;
  right: 30px;
  z-index: 10;
  transition: transform 0.3s ease;
  opacity: 0.8;
}

.github-link:hover {
  transform: scale(1.1);
  opacity: 1;
}

.github-link svg {
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
}

/* 左侧内容 */
.left-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 20px;
}

.slogan-wrapper {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 图片样式 - 无立体感 */
.logo-image {
  animation: slideUp 0.8s ease-out forwards;
  opacity: 0;
  transform: translateY(80px);
  margin-bottom: 20px;
}

.logo-image img {
  width: 200px;
  height: 200px;
  object-fit: contain;
  border: none;
  box-shadow: none;
  background: transparent;
}

/* 字幕样式 */
.slogan {
  text-align: center;
  animation: slideUp 0.8s ease-out forwards;
  opacity: 0;
  transform: translateY(80px);
}

.slogan .main-title {
  font-size: 48px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  margin-bottom: 24px;
  letter-spacing: 4px;
  animation: fadeIn 0.6s ease-out 0.3s forwards;
  opacity: 0;
}

.slogan .sub-title {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  line-height: 1.6;
  letter-spacing: 2px;
  animation: fadeIn 0.6s ease-out 0.6s forwards;
  opacity: 0;
}

/* 整体上滑动画 */
@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(80px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 淡入动画 */
@keyframes fadeIn {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

/* 右侧面板容器 - 保持位置不变 */
.right-panel-wrapper {
  width: 400px;
  position: relative;
  flex-shrink: 0;
}

/* 登录框与重置面板共用样式 */
.login-box {
  width: 100%;
  padding: 40px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
}

/* 登录卡片保持相对定位，始终占据空间 */
.login-box:not(.reset-panel) {
  position: relative;
  z-index: 1;
}

.login-box:not(.reset-panel).fade-out {
  opacity: 0;
  pointer-events: none;
}

/* 重置卡片绝对定位，覆盖在登录卡片上方，保持相同尺寸 */
.reset-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: translateX(100%);
  opacity: 0;
  pointer-events: none;
  z-index: 2;
  visibility: hidden;
}

.reset-panel.slide-in-right {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
  visibility: visible;
}

.login-box h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

/* 重置面板标题样式 */
.reset-panel h2 {
  color: #333;
  font-weight: 600;
}

/* 黑金渐变按钮样式 */
.gold-black-btn {
  background: linear-gradient(135deg, #1a1a1a 0%, #333333 30%, #ffd700 50%, #ffed4a 70%, #1a1a1a 100%) !important;
  background-size: 200% 200% !important;
  border: none !important;
  color: #fff !important;
  font-weight: 600 !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5) !important;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.3) !important;
  transition: all 0.3s ease !important;
  animation: gradientShift 3s ease infinite;
}

.gold-black-btn:hover {
  background: linear-gradient(135deg, #333333 0%, #1a1a1a 30%, #ffed4a 50%, #ffd700 70%, #333333 100%) !important;
  background-size: 200% 200% !important;
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4) !important;
  transform: translateY(-2px);
}

.gold-black-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(255, 215, 0, 0.2), 0 1px 4px rgba(0, 0, 0, 0.3) !important;
}

.gold-black-btn:disabled {
  background: linear-gradient(135deg, #666666 0%, #888888 50%, #aaaaaa 100%) !important;
  color: #cccccc !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
  animation: none;
}

/* 渐变移动动画 */
@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

/* 响应式适配 */
@media (max-width: 1024px) {
  .login-container {
    padding: 0 5%;
    gap: 40px;
  }

  .right-panel-wrapper {
    width: 360px;
  }

  .logo-image img {
    width: 160px;
    height: 160px;
  }

  .slogan .main-title {
    font-size: 40px;
  }

  .slogan .sub-title {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    justify-content: center;
    padding: 20px;
    gap: 30px;
  }

  .right-panel-wrapper {
    width: 100%;
    max-width: 400px;
  }

  .left-content {
    padding-left: 0;
    justify-content: center;
    width: 100%;
  }

  .logo-image img {
    width: 120px;
    height: 120px;
  }

  .slogan .main-title {
    font-size: 32px;
    margin-bottom: 16px;
  }

  .slogan .sub-title {
    font-size: 20px;
  }

  .github-link {
    top: 15px;
    right: 15px;
  }

  .github-link svg {
    height: 28px;
    width: 28px;
  }
}
</style>