<template>
  <div class="settings-container">
    <a-card title="插件设置" :bordered="false" class="settings-card fade-in-card">
      <div class="setting-item">
        <div class="setting-header">
          <div class="setting-title">
            <SafetyCertificateOutlined class="setting-icon" />
            <span>双因素认证（TOTP）</span>
            <a-tag v-if="!loading && enabled" color="success" class="status-tag">已启用</a-tag>
            <a-tag v-else-if="!loading" class="status-tag">未启用</a-tag>
            <a-spin v-else size="small" class="status-tag" />
          </div>
          <div class="setting-desc">开启后登录除密码外，还需输入验证器 App 中的 6 位动态验证码。</div>
        </div>

        <!-- 未启用 -->
        <div v-if="!loading && !enabled" class="setting-body">
          <a-alert
            type="warning"
            show-icon
            class="tip-alert"
            message="请勿删除或更换验证器，密钥丢失将无法登录面版"
            description="密钥丢失后只能通过服务器终端获取验证码后重置密码，请务必妥善备份密钥。"
          />

          <div v-if="!pendingSecret" class="idle-area">
            <a-button type="primary" class="gold-black-btn" :loading="creating" @click="handleCreate">
              <template #icon>
                <QrcodeOutlined />
              </template>
              生成密钥
            </a-button>
          </div>

          <div v-else class="pending-area">
            <a-alert
              type="info"
              show-icon
              class="tip-alert"
              :message="countdown > 0 ? `密钥有效期剩余 ${countdown} 秒，超时后请重新生成` : '密钥已过期，请重新生成'"
            />

            <div class="qr-area">
              <div class="qr-box">
                <img v-if="qrcode" :src="qrcode" alt="TOTP 二维码" class="qr-image" />
                <a-spin v-else class="qr-loading" />
              </div>
              <div class="qr-steps">
                <div class="qr-step">
                  <span class="step-index">1</span>
                  <span>使用验证器 App（Google Authenticator、Microsoft Authenticator、2FA 等）扫描左侧二维码</span>
                </div>
                <div class="qr-step">
                  <span class="step-index">2</span>
                  <span>无法扫码时，手动添加以下密钥</span>
                </div>
                <div class="secret-box">
                  <span class="secret-text">{{ pendingSecret }}</span>
                  <a-button type="link" size="small" class="copy-btn" @click="copySecret">复制</a-button>
                </div>
                <div class="qr-step">
                  <span class="step-index">3</span>
                  <span>确认 App 已能正常生成验证码后，输入下方验证码完成启用</span>
                </div>
              </div>
            </div>

            <div class="enable-area">
              <a-form layout="inline" :model="enableForm" @finish="handleEnable">
                <a-form-item>
                  <a-input
                    v-model:value="enableForm.token"
                    placeholder="6 位验证码"
                    maxlength="6"
                    size="large"
                    class="token-input"
                  >
                    <template #prefix>
                      <SafetyOutlined />
                    </template>
                  </a-input>
                </a-form-item>
                <a-form-item>
                  <a-button type="primary" html-type="submit" size="large" class="gold-black-btn" :loading="enabling">
                    验证并启用
                  </a-button>
                </a-form-item>
                <a-form-item>
                  <a-button size="large" :disabled="enabling" @click="resetPending">取消</a-button>
                </a-form-item>
              </a-form>
            </div>
          </div>
        </div>

        <!-- 已启用 -->
        <div v-else-if="!loading" class="setting-body">
          <a-alert type="success" show-icon class="tip-alert" message="双因素认证已开启，登录面版时需要输入动态验证码">
            <template #description>
              <span>关闭前请确认验证器仍可正常使用，否则将无法关闭。</span>
            </template>
          </a-alert>

          <div class="enable-area">
            <a-button danger class="danger-btn" @click="openDisableModal">
              <template #icon>
                <StopOutlined />
              </template>
              关闭双因素认证
            </a-button>
          </div>
        </div>
      </div>
    </a-card>

    <a-modal
      v-model:visible="disableVisible"
      title="关闭双因素认证"
      ok-text="确认关闭"
      cancel-text="取消"
      :confirm-loading="disabling"
      :width="isMobile ? '95%' : '440px'"
      @ok="handleDelete"
      @cancel="resetDisableModal"
    >
      <a-alert
        type="error"
        show-icon
        class="tip-alert"
        message="关闭后登录仅需密码，安全等级会降低"
        description="请输入验证器 App 中当前的 6 位验证码以确认身份。"
      />
      <a-input
        v-model:value="disableToken"
        placeholder="6 位验证码"
        maxlength="6"
        size="large"
        class="disable-input"
        @press-enter="handleDelete"
      >
        <template #prefix>
          <SafetyOutlined />
        </template>
      </a-input>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import QRCode from 'qrcode'
import { SafetyOutlined, SafetyCertificateOutlined, QrcodeOutlined, StopOutlined } from '@ant-design/icons-vue'

const router = useRouter()

const loading = ref(true)
const enabled = ref(false)

const creating = ref(false)
const enabling = ref(false)
const disabling = ref(false)

const enableForm = reactive({
  token: '',
})

const pendingSecret = ref('')
const qrcode = ref('')
const countdown = ref(0)
let timer = null

const disableVisible = ref(false)
const disableToken = ref('')

const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const apiRequest = async (url, options = {}) => {
  const authToken = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  const config = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  }

  try {
    const res = await fetch(url, config)

    if (res.status === 401) {
      message.error('token过期或无效')
      localStorage.removeItem('token')
      router.push('/login')
      throw new Error('未授权')
    }

    const data = await res.json()
    return data
  } catch (error) {
    if (error.message !== '未授权') {
      message.error('网络错误，请重试')
    }
    throw error
  }
}

const fetchStatus = async () => {
  loading.value = true
  try {
    const response = await apiRequest('/api/login/tfa?action=status')
    if (response.success) {
      enabled.value = response.data?.enabled === true
    } else {
      message.error(response.message || '获取双因素认证状态失败')
    }
  } catch (error) {
  } finally {
    loading.value = false
  }
}

const fetchQrcode = (otpauthUrl) => {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(
      otpauthUrl,
      {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 220,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      },
      (error, url) => {
        if (error) return reject(error)
        resolve(url)
      }
    )
  })
}

const clearCountdown = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const startCountdown = () => {
  clearCountdown()
  countdown.value = 300
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearCountdown()
      pendingSecret.value = ''
      qrcode.value = ''
      enableForm.token = ''
      message.warning('密钥已过期，请重新生成')
    }
  }, 1000)
}

const resetPending = () => {
  clearCountdown()
  pendingSecret.value = ''
  qrcode.value = ''
  countdown.value = 0
  enableForm.token = ''
}

const copySecret = async () => {
  try {
    await navigator.clipboard.writeText(pendingSecret.value)
    message.success('密钥已复制')
  } catch (error) {
    message.warning('复制失败，请手动选择密钥复制')
  }
}

const handleCreate = async () => {
  creating.value = true
  try {
    const response = await apiRequest('/api/login/tfa?action=create', { method: 'POST' })
    if (!response.success) {
      return message.error(response.message || '生成密钥失败')
    }

    const { secret, otpauth_url } = response.data || {}
    if (!secret || !otpauth_url) {
      return message.error('密钥数据异常，请重试')
    }

    enableForm.token = ''
    pendingSecret.value = secret
    qrcode.value = ''
    startCountdown()

    try {
      qrcode.value = await fetchQrcode(otpauth_url)
    } catch (error) {
      message.warning('二维码生成失败，请手动添加密钥')
    }

    message.success('密钥生成成功，请使用验证器 App 扫描')
  } catch (error) {
  } finally {
    creating.value = false
  }
}

const handleEnable = async () => {
  if (!/^\d{6}$/.test(enableForm.token.trim())) {
    return message.error('请输入 6 位数字验证码')
  }

  enabling.value = true
  try {
    const response = await apiRequest('/api/login/tfa?action=enable', {
      method: 'POST',
      body: JSON.stringify({ token: enableForm.token.trim() }),
    })

    if (response.success) {
      enabled.value = true
      resetPending()
      message.success(response.message || '双因素认证启用成功')
    } else {
      message.error(response.message || '启用失败')
      if (response.message && response.message.includes('过期')) {
        resetPending()
      }
    }
  } catch (error) {
  } finally {
    enabling.value = false
  }
}

const openDisableModal = () => {
  disableToken.value = ''
  disableVisible.value = true
}

const resetDisableModal = () => {
  disableVisible.value = false
  disableToken.value = ''
}

const handleDelete = async () => {
  if (!/^\d{6}$/.test(disableToken.value.trim())) {
    return message.error('请输入 6 位数字验证码')
  }

  disabling.value = true
  try {
    const response = await apiRequest('/api/login/tfa?action=delete', {
      method: 'POST',
      body: JSON.stringify({ token: disableToken.value.trim() }),
    })

    if (response.success) {
      enabled.value = false
      resetDisableModal()
      message.success(response.message || '双因素认证关闭成功')
    } else {
      message.error(response.message || '关闭失败')
    }
  } catch (error) {
  } finally {
    disabling.value = false
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  fetchStatus()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  clearCountdown()
})
</script>

<style scoped>
.settings-container {
  width: 100%;
}

.settings-card {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease;
  border: 1px solid #f0f0f0;
}

.settings-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.fade-in-card {
  animation: slideInFromLeft 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.setting-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
}

.setting-icon {
  color: #722ed1;
  font-size: 18px;
}

.status-tag {
  margin-left: 4px;
}

.setting-desc {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.setting-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tip-alert {
  border-radius: 8px;
}

.idle-area {
  padding: 8px 0;
}

.pending-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qr-area {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.qr-box {
  width: 220px;
  height: 220px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.qr-image {
  width: 200px;
  height: 200px;
  display: block;
}

.qr-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-steps {
  flex: 1;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qr-step {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.7;
}

.step-index {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 3px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
  color: #ffd700;
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.secret-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  overflow: hidden;
}

.secret-text {
  flex: 1;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  letter-spacing: 1px;
  color: rgba(0, 0, 0, 0.85);
  word-break: break-all;
  user-select: all;
}

.copy-btn {
  flex-shrink: 0;
  padding: 0;
  height: auto;
}

.enable-area {
  padding-top: 4px;
}

.token-input {
  width: 180px;
}

.disable-input {
  margin-top: 16px;
}

.danger-btn {
  font-weight: 500;
}

.gold-black-btn {
  background: linear-gradient(135deg, #1a1a1a 0%, #333333 30%, #ffd700 50%, #ffed4a 70%, #1a1a1a 100%) !important;
  background-size: 200% 200% !important;
  border: none !important;
  color: #fff !important;
  font-weight: 600 !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5) !important;
  box-shadow:
    0 4px 15px rgba(255, 215, 0, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.3) !important;
  transition: all 0.3s ease !important;
  animation: gradientShift 3s ease infinite;
}

.gold-black-btn:hover {
  background: linear-gradient(135deg, #333333 0%, #1a1a1a 30%, #ffed4a 50%, #ffd700 70%, #333333 100%) !important;
  background-size: 200% 200% !important;
  box-shadow:
    0 6px 20px rgba(255, 215, 0, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.4) !important;
  transform: translateY(-2px);
}

.gold-black-btn:active {
  transform: translateY(0);
  box-shadow:
    0 2px 10px rgba(255, 215, 0, 0.2),
    0 1px 4px rgba(0, 0, 0, 0.3) !important;
}

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

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

:deep(.ant-card) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease;
}

:deep(.ant-card:hover) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

:deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
}

@media (max-width: 768px) {
  .qr-area {
    gap: 16px;
  }

  .qr-box {
    width: 100%;
    max-width: 220px;
    margin: 0 auto;
  }

  .qr-steps {
    min-width: auto;
  }

  .enable-area :deep(.ant-form-item) {
    margin-bottom: 12px;
  }

  .token-input {
    width: 100%;
  }
}
</style>
