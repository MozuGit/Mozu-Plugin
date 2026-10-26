<template>
  <div class="settings-panel-page security-page">
    <div class="panel-heading">
      <div class="panel-heading__main">
        <span class="panel-heading__icon">
          <SafetyCertificateOutlined />
        </span>
        <div>
          <h2>安全</h2>
          <p>管理访问密码、双重验证与当前登录状态。</p>
        </div>
      </div>
    </div>

    <section class="settings-section lg-glass">
      <div class="section-head">
        <span class="section-icon">
          <SafetyCertificateOutlined />
        </span>
        <div class="section-head__copy">
          <h3>账号安全</h3>
          <p>
            面板仅有一个管理员账号，密码保存在服务器
            <code>config/panel/config/login.yaml</code>。
          </p>
        </div>
        <a-tag class="account-tag">admin</a-tag>
      </div>

      <div class="settings-rows security-rows">
        <div class="settings-row">
          <div class="row-copy">
            <div class="row-title">访问密码</div>
            <div class="row-desc">修改后其他设备上的登录会话将立即失效。</div>
          </div>
          <div class="row-control">
            <a-button @click="openPasswordModal">
              <template #icon>
                <EditOutlined />
              </template>
              修改密码
            </a-button>
          </div>
        </div>

        <div class="settings-row">
          <div class="row-copy">
            <div class="row-title">退出登录</div>
            <div class="row-desc">清除当前浏览器保存的登录令牌。</div>
          </div>
          <div class="row-control">
            <a-popconfirm title="退出当前账号？" ok-text="退出" cancel-text="取消" @confirm="handleLogout">
              <a-button type="text" danger>退出登录</a-button>
            </a-popconfirm>
          </div>
        </div>
      </div>
    </section>

    <section class="settings-section lg-glass">
      <div class="section-head">
        <span class="section-icon">
          <KeyOutlined />
        </span>
        <div class="section-head__copy">
          <h3>双重验证</h3>
          <p>登录时在访问密码之外，再验证 Authenticator 一次性密码。默认关闭。</p>
        </div>
      </div>

      <div class="settings-rows security-rows">
        <div class="settings-row">
          <div class="row-copy">
            <div class="row-title">Authenticator</div>
            <div class="row-desc">扫描二维码或手动输入密钥，再用 6 位验证码确认。</div>
          </div>
          <div class="row-control">
            <a-spin v-if="tfaLoading" size="small" />
            <template v-else>
              <a-tag :color="tfaEnabled ? 'success' : undefined">{{ tfaEnabled ? '已启用' : '未启用' }}</a-tag>
              <a-button :type="tfaEnabled ? 'default' : 'primary'" @click="openTotpModal">
                {{ tfaEnabled ? '管理 2FA' : '开启 2FA' }}
              </a-button>
            </template>
          </div>
        </div>
      </div>

      <p class="security-hint">
        <InfoCircleOutlined />
        推荐使用 Google Authenticator、Microsoft Authenticator 或 1Password 等验证器。
      </p>
    </section>

    <p class="settings-footnote">
      <SafetyCertificateOutlined />
      密码与双重验证配置会直接写入服务器配置文件，修改后立即生效。
    </p>

    <a-modal
      v-model:open="totpVisible"
      :footer="null"
      :width="isMobile ? '94%' : '560px'"
      :destroy-on-close="true"
      class="settings-modal"
      @cancel="handleTotpCancel"
    >
      <div class="modal-heading">
        <span class="modal-heading__icon">
          <SafetyCertificateOutlined />
        </span>
        <div>
          <h3>双重验证</h3>
          <p>Authenticator 一次性密码</p>
        </div>
      </div>

      <a-spin :spinning="tfaLoading">
        <template v-if="tfaEnabled">
          <a-alert
            type="success"
            show-icon
            class="modal-alert"
            message="双重验证已开启"
            description="登录面板时需要输入验证器 App 中的 6 位动态验证码。"
          />

          <div class="modal-field">
            <span class="modal-label">验证码</span>
            <a-input
              v-model:value="disableToken"
              placeholder="输入当前 6 位验证码"
              maxlength="6"
              size="large"
              autocomplete="one-time-code"
              @press-enter="handleDisable"
            >
              <template #prefix>
                <SafetyOutlined />
              </template>
            </a-input>
          </div>

          <div class="modal-actions">
            <a-button @click="handleTotpCancel">取消</a-button>
            <a-button danger :loading="disabling" @click="handleDisable">
              <template #icon>
                <StopOutlined />
              </template>
              关闭双重验证
            </a-button>
          </div>
        </template>

        <template v-else>
          <a-alert
            type="warning"
            show-icon
            class="modal-alert"
            message="请妥善备份密钥"
            description="密钥丢失后只能通过服务器终端获取验证码后重置密码，请务必妥善保存。"
          />

          <div v-if="!pendingSecret" class="totp-intro">
            <span class="totp-intro__icon">
              <QrcodeOutlined />
            </span>
            <p>开启后，每次登录都需要额外输入验证器 App 生成的 6 位动态验证码。</p>
            <a-button type="primary" size="large" :loading="creating" @click="handleCreate">
              <template #icon>
                <QrcodeOutlined />
              </template>
              生成密钥
            </a-button>
          </div>

          <div v-else class="totp-setup">
            <a-alert
              type="info"
              show-icon
              class="modal-alert"
              :message="countdown > 0 ? `密钥有效期剩余 ${countdown} 秒` : '密钥已过期，请重新生成'"
            />

            <div class="totp-grid">
              <div class="qr-box">
                <img v-if="qrcode" :src="qrcode" alt="TOTP 二维码" class="qr-image" />
                <a-spin v-else />
              </div>

              <div class="totp-steps">
                <div class="totp-step">
                  <span class="step-index">1</span>
                  <span>使用验证器 App 扫描二维码</span>
                </div>
                <div class="totp-step">
                  <span class="step-index">2</span>
                  <span>无法扫码时，手动添加以下密钥</span>
                </div>
                <div class="secret-box">
                  <span class="secret-text">{{ pendingSecret }}</span>
                  <a-button type="link" size="small" class="copy-btn" @click="copySecret">复制</a-button>
                </div>
                <div class="totp-step">
                  <span class="step-index">3</span>
                  <span>确认 App 已能生成验证码后，在下方输入验证码完成启用</span>
                </div>
              </div>
            </div>

            <div class="modal-field">
              <span class="modal-label">验证码</span>
              <a-input
                v-model:value="enableForm.token"
                placeholder="6 位验证码"
                maxlength="6"
                size="large"
                autocomplete="one-time-code"
                @press-enter="handleEnable"
              >
                <template #prefix>
                  <SafetyOutlined />
                </template>
              </a-input>
            </div>

            <div class="modal-actions">
              <a-button @click="handleTotpCancel">取消</a-button>
              <a-button type="link" :disabled="enabling" @click="handleCreate">重新生成</a-button>
              <a-button type="primary" :loading="enabling" @click="handleEnable">验证并启用</a-button>
            </div>
          </div>
        </template>
      </a-spin>
    </a-modal>

    <a-modal
      v-model:open="passwordVisible"
      title="修改访问密码"
      ok-text="确认修改"
      cancel-text="取消"
      :confirm-loading="passwordSaving"
      :width="isMobile ? '94%' : '460px'"
      class="settings-modal"
      @ok="handleChangePassword"
      @cancel="resetPasswordForm"
    >
      <p class="modal-description">修改成功后，其他设备上的登录会话会立即失效，当前设备会保持登录。</p>

      <a-form layout="vertical" class="password-form">
        <a-form-item label="当前密码">
          <a-input-password
            v-model:value="passwordForm.currentPassword"
            placeholder="请输入当前密码"
            autocomplete="current-password"
          />
        </a-form-item>
        <a-form-item label="新密码">
          <a-input-password
            v-model:value="passwordForm.newPassword"
            placeholder="至少 6 位"
            autocomplete="new-password"
          />
        </a-form-item>
        <a-form-item label="确认新密码">
          <a-input-password
            v-model:value="passwordForm.confirmPassword"
            placeholder="再次输入新密码"
            autocomplete="new-password"
          />
        </a-form-item>
        <a-form-item v-if="tfaEnabled" label="双重验证码">
          <a-input
            v-model:value="passwordForm.token"
            placeholder="输入当前 6 位验证码"
            maxlength="6"
            autocomplete="one-time-code"
          >
            <template #prefix>
              <SafetyOutlined />
            </template>
          </a-input>
        </a-form-item>
      </a-form>

      <p class="modal-description modal-description--muted">
        <InfoCircleOutlined />
        密码会以摘要形式保存到服务器配置，建议使用字母、数字与符号组合。
      </p>
    </a-modal>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import QRCode from 'qrcode'
import {
  EditOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  QrcodeOutlined,
  SafetyCertificateOutlined,
  SafetyOutlined,
  StopOutlined,
} from '@ant-design/icons-vue'

const router = useRouter()

const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const tfaLoading = ref(true)
const tfaEnabled = ref(false)

const totpVisible = ref(false)
const creating = ref(false)
const enabling = ref(false)
const disabling = ref(false)
const pendingSecret = ref('')
const qrcode = ref('')
const countdown = ref(0)
const enableForm = reactive({ token: '' })
const disableToken = ref('')
let timer = null

const passwordVisible = ref(false)
const passwordSaving = ref(false)
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  token: '',
})

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

    return await res.json()
  } catch (error) {
    if (error.message !== '未授权') {
      message.error('网络错误，请重试')
    }
    throw error
  }
}

const fetchTfaStatus = async () => {
  tfaLoading.value = true
  try {
    const response = await apiRequest('/api/login/tfa?action=status')
    if (response.success) {
      tfaEnabled.value = response.data?.enabled === true
    } else {
      message.error(response.message || '获取双重验证状态失败')
    }
  } catch {
    // apiRequest 已提示
  } finally {
    tfaLoading.value = false
  }
}

const fetchQrcode = (otpauthUrl) => {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(
      otpauthUrl,
      {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 200,
        color: {
          dark: '#0f172a',
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

const openTotpModal = () => {
  disableToken.value = ''
  enableForm.token = ''
  if (!tfaEnabled.value) {
    resetPending()
  }
  totpVisible.value = true
}

const handleTotpCancel = () => {
  totpVisible.value = false
  resetPending()
  disableToken.value = ''
}

const copySecret = async () => {
  try {
    await navigator.clipboard.writeText(pendingSecret.value)
    message.success('密钥已复制')
  } catch {
    message.warning('复制失败，请手动选择密钥复制')
  }
}

const handleCreate = async () => {
  creating.value = true
  try {
    const response = await apiRequest('/api/login/tfa?action=create', { method: 'POST' })
    if (!totpVisible.value) return
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
    } catch {
      message.warning('二维码生成失败，请手动添加密钥')
    }

    message.success('密钥生成成功，请使用验证器 App 扫描')
  } catch {
    // apiRequest 已提示
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
      tfaEnabled.value = true
      totpVisible.value = false
      resetPending()
      message.success(response.message || '双重验证启用成功')
    } else {
      message.error(response.message || '启用失败')
      if (response.message && response.message.includes('过期')) {
        resetPending()
      }
    }
  } catch {
    // apiRequest 已提示
  } finally {
    enabling.value = false
  }
}

const handleDisable = async () => {
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
      tfaEnabled.value = false
      totpVisible.value = false
      disableToken.value = ''
      message.success(response.message || '双重验证关闭成功')
    } else {
      message.error(response.message || '关闭失败')
    }
  } catch {
    // apiRequest 已提示
  } finally {
    disabling.value = false
  }
}

const resetPasswordForm = () => {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordForm.token = ''
}

const openPasswordModal = () => {
  resetPasswordForm()
  passwordVisible.value = true
}

const handleChangePassword = async () => {
  if (passwordSaving.value) return
  if (!passwordForm.currentPassword) {
    return message.warning('请输入当前密码')
  }
  if (passwordForm.newPassword.length < 6) {
    return message.warning('新密码至少需要 6 位')
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    return message.warning('两次输入的新密码不一致')
  }
  if (tfaEnabled.value && !/^\d{6}$/.test(passwordForm.token.trim())) {
    return message.warning('请输入 6 位双重验证码')
  }

  passwordSaving.value = true
  try {
    const response = await apiRequest('/api/login?action=change_password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        token: passwordForm.token.trim(),
      }),
    })

    if (response.success) {
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token)
      }
      passwordVisible.value = false
      resetPasswordForm()
      message.success(response.message || '密码修改成功')
    } else {
      message.error(response.message || '密码修改失败')
    }
  } catch {
    // apiRequest 已提示
  } finally {
    passwordSaving.value = false
  }
}

const handleLogout = async () => {
  const token = localStorage.getItem('token')
  try {
    await fetch('/api/login?action=exit', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    // 网络异常时也清除本地令牌
  } finally {
    localStorage.removeItem('token')
    router.push('/login')
    message.success('已退出登录')
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  fetchTfaStatus()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  clearCountdown()
})
</script>

<style scoped>
.security-rows {
  margin-top: 10px;
}

.account-tag {
  margin-left: auto;
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 2px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--lg-brand);
  background: rgba(var(--lg-aurora-violet), 0.12);
  border: 1px solid rgba(var(--lg-aurora-violet), 0.24);
}

.security-hint {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin: 10px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--lg-hairline);
  font-size: 12px;
  line-height: 1.65;
  color: var(--lg-text-muted);
}

.security-hint :deep(svg) {
  margin-top: 2px;
  flex-shrink: 0;
}

.qr-box {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid var(--lg-border-soft);
  border-radius: var(--lg-radius);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 4px 16px rgba(39, 52, 105, 0.1);
}

.qr-image {
  width: 184px;
  height: 184px;
  display: block;
}

.qr-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.secret-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.48);
  border: 1px dashed rgba(var(--lg-aurora-violet), 0.42);
  border-radius: var(--lg-radius-sm);
  overflow: hidden;
}

.secret-text {
  flex: 1;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 12.5px;
  letter-spacing: 0.8px;
  color: var(--lg-text);
  word-break: break-all;
  user-select: all;
}

.copy-btn {
  flex-shrink: 0;
  padding: 0;
  height: auto;
}

.totp-grid {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.totp-steps {
  flex: 1;
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.totp-step {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--lg-text-secondary);
}

.step-index {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  border-radius: 50%;
  background: var(--lg-brand-gradient);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .account-tag {
    display: none;
  }

  .qr-box {
    width: 180px;
    height: 180px;
    margin: 0 auto;
  }

  .qr-image {
    width: 166px;
    height: 166px;
  }

  .totp-steps {
    min-width: 0;
  }
}
</style>

<style>
/* 弹窗内容通过 Teleport 渲染，使用全局类名保持样式一致 */
.settings-modal .ant-modal-content {
  padding: 22px 24px 24px;
}

.modal-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.modal-heading__icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 13px;
  font-size: 18px;
  color: var(--lg-brand);
  background: linear-gradient(135deg, rgba(var(--lg-aurora-violet), 0.18), rgba(var(--lg-aurora-cyan), 0.14));
  border: 1px solid rgba(255, 255, 255, 0.68);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.modal-heading h3 {
  margin: 0;
  font-size: 17px;
  color: var(--lg-text);
}

.modal-heading p {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--lg-text-muted);
}

.modal-alert {
  border-radius: 10px;
  margin-bottom: 14px;
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 14px;
}

.modal-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--lg-text-secondary);
}

.modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.totp-intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 22px 12px 8px;
  text-align: center;
}

.totp-intro__icon {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  font-size: 27px;
  color: var(--lg-brand);
  background: linear-gradient(135deg, rgba(var(--lg-aurora-violet), 0.16), rgba(var(--lg-aurora-cyan), 0.12));
  border: 1px solid rgba(255, 255, 255, 0.68);
}

.totp-intro p {
  max-width: 340px;
  margin: 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--lg-text-muted);
}

.totp-setup {
  display: flex;
  flex-direction: column;
}

.modal-description {
  margin: 0 0 14px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--lg-text-muted);
}

.modal-description--muted {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 4px 0 0;
  font-size: 12px;
}

.modal-description--muted svg {
  margin-top: 3px;
  flex-shrink: 0;
}

.password-form .ant-form-item {
  margin-bottom: 14px;
}

.password-form .ant-form-item-label {
  padding-bottom: 5px;
}

@media (max-width: 768px) {
  .settings-modal .ant-modal-content {
    padding: 18px 16px 20px;
  }

  .modal-heading {
    margin-bottom: 14px;
  }
}
</style>
