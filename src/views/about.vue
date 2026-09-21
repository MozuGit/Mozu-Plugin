<template>
  <div class="about-container">
    <a-card title="关于" :bordered="false" class="about-card fade-in-card">
      <div v-if="loading" class="info-list">
        <div class="info-item">
          <span class="info-label">插件版本</span>
          <span class="info-value"><span class="skeleton-block" style="width: 140px;"></span></span>
        </div>
        <div class="info-item">
          <span class="info-label">插件作者</span>
          <span class="info-value"><span class="skeleton-block" style="width: 160px;"></span></span>
        </div>
        <div class="info-item">
          <span class="info-label">插件链接</span>
          <span class="info-value">
            <span class="skeleton-block" style="width: 130px;"></span>
            <span class="separator">·</span>
            <span class="skeleton-block" style="width: 130px;"></span>
            <span class="separator">·</span>
            <span class="skeleton-block" style="width: 130px;"></span>
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">联系方式</span>
          <span class="info-value">
            <span class="skeleton-block" style="width: 120px;"></span>
            <span class="separator">·</span>
            <span class="skeleton-block" style="width: 120px;"></span>
            <span class="separator">·</span>
            <span class="skeleton-block" style="width: 120px;"></span>
          </span>
        </div>
      </div>

      <div v-else class="info-list">
        <div class="info-item">
          <span class="info-label">插件版本</span>
          <span class="info-value">
            <span v-if="pluginVersion" class="version-badge" :class="versionStatusClass">
              <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span class="badge-text">v{{ pluginVersion }}</span>
              <span class="badge-tag" :class="versionTagClass">{{ versionStatusText }}</span>
              <a-tooltip v-if="versionStatus === 'update'" :title="'最新版本：v' + latestVersion">
                <span class="update-hint">
                  <svg class="update-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 4v6h-6M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                </span>
              </a-tooltip>
            </span>
            <span v-else class="text-muted">未知版本</span>
          </span>
        </div>

        <div class="info-item">
          <span class="info-label">插件作者</span>
          <span class="info-value">
            <a v-if="authorName" :href="authorUrl" target="_blank" rel="noopener noreferrer" class="author-badge">
              <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span class="badge-text">{{ authorName }}</span>
              <span class="badge-tag author-tag">作者</span>
            </a>
            <span v-else class="text-muted">魔族陌</span>
          </span>
        </div>

        <div class="info-item">
          <span class="info-label">插件链接</span>
          <span class="info-value link-group">
            <a href="https://github.com/MozuGit/Mozu-Plugin" target="_blank" rel="noopener noreferrer" class="link-badge github-badge">
              <svg class="badge-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span class="badge-text">GitHub</span>
              <span class="badge-tag github-tag">开源</span>
            </a>
            <a href="https://gitee.com/MozuGit/Mozu-Plugin" target="_blank" rel="noopener noreferrer" class="link-badge gitee-badge">
              <svg class="badge-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.984 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6.09 5.333c.328.33.51.775.51 1.275 0 .492-.176.93-.498 1.255l-5.168 5.172 5.168 5.172c.322.325.498.763.498 1.255 0 .5-.182.945-.51 1.275-.33.33-.775.51-1.275.51-.5 0-.945-.18-1.275-.51l-5.172-5.168-5.172 5.168c-.33.33-.775.51-1.275.51s-.945-.18-1.275-.51c-.33-.33-.51-.775-.51-1.275 0-.492.18-.93.51-1.255l5.168-5.172-5.168-5.172c-.33-.325-.51-.763-.51-1.255 0-.5.18-.945.51-1.275.33-.33.775-.51 1.275-.51s.945.18 1.275.51l5.172 5.168 5.172-5.168c.33-.33.775-.51 1.275-.51s.945.18 1.275.51z"/>
              </svg>
              <span class="badge-text">Gitee</span>
              <span class="badge-tag gitee-tag">镜像</span>
            </a>
            <a href="https://gitcode.com/MozuGit/Mozu-Plugin" target="_blank" rel="noopener noreferrer" class="link-badge gitcode-badge">
              <svg class="badge-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L1 6v12l11 6 11-6V6L12 0zm0 2.18l8.5 4.64v10.36L12 21.82l-8.5-4.64V6.82L12 2.18zm0 3.64L7 8.5v7l5 2.73 5-2.73v-7l-5-2.95z"/>
              </svg>
              <span class="badge-text">GitCode</span>
              <span class="badge-tag gitcode-tag">镜像</span>
            </a>
          </span>
        </div>

        <div class="info-item">
          <span class="info-label">联系方式</span>
          <span class="info-value link-group">
            <a href="https://qm.qq.com/q/5fKlztbHHG" target="_blank" rel="noopener noreferrer" class="link-badge qq-badge">
              <svg class="badge-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              <span class="badge-text">QQ</span>
              <span class="badge-tag qq-tag">魔族陌</span>
            </a>
            <a href="https://qun.qq.com/universal-share/share?ac=1&authKey=13%2FWEfX0G3PO77HgYt3w8yg8K%2BCSE3fYXzuA%2FOH0Vnzv5HDrENZctaRM1qkC07eD&busi_data=eyJncm91cENvZGUiOiI5NzY3MTkwMTciLCJ0b2tlbiI6Inl0NHY2b01BRTlMeHR4MXBYbWJqYWxpbmU5Wk9kT3VqZE1nM0dNYVZET1pBcjVPTVZ5WDVLMnVCaFpHNTFWVUgiLCJ1aW4iOiIzMzQzNzEyNTg5In0%3D&data=uDBsYAg-ZA2RbnkK_3yJFYKmiPRZg-XmEhn6iJ1tWmOfRPEeEIiA6N1o1e5p9-dqSJDSxCk44qnx92h62ZlrmQ&svctype=4&tempid=h5_group_info" target="_blank" rel="noopener noreferrer" class="link-badge qqgroup-badge">
              <svg class="badge-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              <span class="badge-text">QQ群</span>
              <span class="badge-tag qqgroup-tag">陌陌の小窝</span>
            </a>
            <a href="https://www.ifdian.net/a/Mozumo" target="_blank" rel="noopener noreferrer" class="link-badge ifdian-badge">
              <svg class="badge-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              <span class="badge-text">爱发电</span>
              <span class="badge-tag ifdian-tag">支持</span>
            </a>
          </span>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(true)
const pluginVersion = ref('')
const latestVersion = ref('')
const authorName = ref('MozuGit')
const authorUrl = ref('https://github.com/MozuGit')

const versionStatus = computed(() => {
  if (!pluginVersion.value || !latestVersion.value) return 'normal'
  const current = pluginVersion.value.replace(/^v/, '')
  const latest = latestVersion.value.replace(/^v/, '')
  const parseVersion = (version) => {
    const match = version.match(/^(\d+(?:\.\d+)*)(?:[-.](.+))?$/)
    if (!match) return { segments: [0], prerelease: '' }
    const segments = match[1].split('.').map(Number)
    const prerelease = match[2] || ''
    return { segments, prerelease }
  }
  const currentParsed = parseVersion(current)
  const latestParsed = parseVersion(latest)
  const maxLength = Math.max(currentParsed.segments.length, latestParsed.segments.length)
  for (let i = 0; i < maxLength; i++) {
    const curr = currentParsed.segments[i] || 0
    const lat = latestParsed.segments[i] || 0
    if (lat > curr) return 'update'
    if (curr > lat) return 'beta'
  }
  if (!currentParsed.prerelease && !latestParsed.prerelease) {
    return 'normal'
  }
  if (currentParsed.prerelease && !latestParsed.prerelease) {
    return 'beta'
  }
  if (!currentParsed.prerelease && latestParsed.prerelease) {
    return 'beta'
  }
  const prereleaseOrder = ['alpha', 'beta', 'rc', 'pre', 'preview']
  const comparePrerelease = (pre1, pre2) => {
    const getPrereleaseInfo = (pre) => {
      const parts = pre.split('.')
      const type = parts[0].replace(/\d+$/, '')
      const number = parseInt(parts[0].match(/\d+$/)?.[0] || '0') || (parts[1] ? parseInt(parts[1]) : 0)
      const orderIndex = prereleaseOrder.indexOf(type.toLowerCase())
      return {
        type: type.toLowerCase(),
        orderIndex: orderIndex >= 0 ? orderIndex : prereleaseOrder.length,
        number: number
      }
    }
    const info1 = getPrereleaseInfo(pre1)
    const info2 = getPrereleaseInfo(pre2)
    if (info1.orderIndex !== info2.orderIndex) {
      return info2.orderIndex - info1.orderIndex
    }
    return info2.number - info1.number
  }
  const compareResult = comparePrerelease(currentParsed.prerelease, latestParsed.prerelease)
  if (compareResult > 0) return 'update'
  if (compareResult < 0) return 'beta'
  return 'normal'
})

const versionStatusText = computed(() => {
  switch (versionStatus.value) {
    case 'update': return '可更新'
    case 'beta': return '测试版'
    default: return '最新版'
  }
})

const versionStatusClass = computed(() => {
  switch (versionStatus.value) {
    case 'update': return 'version-update'
    case 'beta': return 'version-beta'
    default: return 'version-normal'
  }
})

const versionTagClass = computed(() => {
  switch (versionStatus.value) {
    case 'update': return 'tag-update'
    case 'beta': return 'tag-beta'
    default: return 'tag-normal'
  }
})

const fetchAboutInfo = async () => {
  loading.value = true
  const token = localStorage.getItem('token')
  try {
    const headers = {
      'Content-Type': 'application/json'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch('/api/about/getInfo', {
      method: 'GET',
      headers
    })

    if (res.status === 401) {
      message.error('token过期或无效')
      localStorage.removeItem('token')
      router.push('/login')
      document.title = '魔族陌 - 登录'
      return
    }

    const data = await res.json()

    if (data.success && data.data) {
      const info = data.data
      pluginVersion.value = info.version || info.currentVersion || ''
      latestVersion.value = info.latestVersion || ''
      
      if (info.author) {
        authorName.value = info.author
      }
    }
  } catch (error) {
    message.error('获取插件信息失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAboutInfo()
})
</script>

<style scoped>
.about-container {
  width: 100%;
}

.about-card {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  border: 1px solid #f0f0f0;
}

.about-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.fade-in-card {
  animation: slideInFromLeft 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #e9eef3;
  animation: slideInItem 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  opacity: 0;
  transform: translateX(-20px);
}

.info-item:first-child {
  animation-delay: 0.15s;
}

.info-item:nth-child(2) {
  animation-delay: 0.25s;
}

.info-item:nth-child(3) {
  animation-delay: 0.35s;
}

.info-item:nth-child(4) {
  animation-delay: 0.45s;
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.65);
  min-width: 80px;
  font-size: 14px;
}

.info-value {
  color: rgba(0, 0, 0, 0.85);
  font-weight: 500;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.link-group {
  gap: 12px;
}

/* 通用徽章样式 */
.version-badge,
.author-badge,
.link-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  text-decoration: none;
  cursor: pointer;
}

.version-badge:hover,
.author-badge:hover,
.link-badge:hover {
  transform: translateY(-2px);
}

/* 版本徽章 - 正常 */
.version-normal {
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%);
  border: 1px solid #b3d8ff;
}

.version-normal:hover {
  background: linear-gradient(135deg, #e6f4ff 0%, #d6ebff 100%);
  border-color: #69b1ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

/* 版本徽章 - 可更新 */
.version-update {
  background: linear-gradient(135deg, #fff7e6 0%, #fff1d6 100%);
  border: 1px solid #ffd591;
}

.version-update:hover {
  background: linear-gradient(135deg, #fff1d6 0%, #ffe7ba 100%);
  border-color: #ffc069;
  box-shadow: 0 4px 12px rgba(250, 140, 22, 0.2);
}

/* 版本徽章 - 测试版 */
.version-beta {
  background: linear-gradient(135deg, #f6ffed 0%, #eeffdd 100%);
  border: 1px solid #b7eb8f;
}

.version-beta:hover {
  background: linear-gradient(135deg, #eeffdd 0%, #e0ffcc 100%);
  border-color: #95de64;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.2);
}

/* 作者徽章 */
.author-badge {
  background: linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%);
  border: 1px solid #d3adf7;
}

.author-badge:hover {
  background: linear-gradient(135deg, #efdbff 0%, #e5c8ff 100%);
  border-color: #b37feb;
  box-shadow: 0 4px 12px rgba(114, 46, 209, 0.2);
}

/* GitHub 徽章 */
.github-badge {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  border: 1px solid #d9d9d9;
}

.github-badge:hover {
  background: linear-gradient(135deg, #e8e8e8 0%, #d9d9d9 100%);
  border-color: #bfbfbf;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Gitee 徽章 */
.gitee-badge {
  background: linear-gradient(135deg, #fff0f0 0%, #ffe6e6 100%);
  border: 1px solid #ffb3b3;
}

.gitee-badge:hover {
  background: linear-gradient(135deg, #ffe6e6 0%, #ffcccc 100%);
  border-color: #ff9999;
  box-shadow: 0 4px 12px rgba(199, 29, 35, 0.2);
}

/* GitCode 徽章 */
.gitcode-badge {
  background: linear-gradient(135deg, #e6f7ff 0%, #d6eeff 100%);
  border: 1px solid #91d5ff;
}

.gitcode-badge:hover {
  background: linear-gradient(135deg, #d6eeff 0%, #c5e6ff 100%);
  border-color: #69c0ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

/* QQ 徽章 */
.qq-badge {
  background: linear-gradient(135deg, #e8f4ff 0%, #d6ecff 100%);
  border: 1px solid #91c8ff;
}

.qq-badge:hover {
  background: linear-gradient(135deg, #d6ecff 0%, #c5e3ff 100%);
  border-color: #69b1ff;
  box-shadow: 0 4px 12px rgba(0, 120, 255, 0.2);
}

.qq-badge .badge-icon {
  color: #0078ff;
}

.qq-badge .badge-text {
  color: #0078ff;
}

.qq-tag {
  background: #0078ff;
}

/* QQ群 徽章 */
.qqgroup-badge {
  background: linear-gradient(135deg, #fff0e6 0%, #ffe6d6 100%);
  border: 1px solid #ffb391;
}

.qqgroup-badge:hover {
  background: linear-gradient(135deg, #ffe6d6 0%, #ffdcc5 100%);
  border-color: #ff8c5a;
  box-shadow: 0 4px 12px rgba(255, 120, 0, 0.2);
}

.qqgroup-badge .badge-icon {
  color: #ff7800;
}

.qqgroup-badge .badge-text {
  color: #ff7800;
}

.qqgroup-tag {
  background: #ff7800;
}

/* 爱发电 徽章 */
.ifdian-badge {
  background: linear-gradient(135deg, #fce4ec 0%, #f8d7e0 100%);
  border: 1px solid #f48fb1;
}

.ifdian-badge:hover {
  background: linear-gradient(135deg, #f8d7e0 0%, #f5c8d4 100%);
  border-color: #f06292;
  box-shadow: 0 4px 12px rgba(233, 30, 99, 0.2);
}

.ifdian-badge .badge-icon {
  color: #e91e63;
}

.ifdian-badge .badge-text {
  color: #e91e63;
}

.ifdian-tag {
  background: #e91e63;
}

/* 徽章内图标 */
.badge-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.version-normal .badge-icon {
  color: #1677ff;
}

.version-update .badge-icon {
  color: #fa8c16;
}

.version-beta .badge-icon {
  color: #52c41a;
}

.author-badge .badge-icon {
  color: #722ed1;
}

.github-badge .badge-icon {
  color: #24292e;
}

.gitee-badge .badge-icon {
  color: #c71d23;
}

.gitcode-badge .badge-icon {
  color: #1677ff;
}

/* 徽章内文字 */
.badge-text {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.version-normal .badge-text {
  color: #1677ff;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
}

.version-update .badge-text {
  color: #fa8c16;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
}

.version-beta .badge-text {
  color: #52c41a;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
}

.author-badge .badge-text {
  color: #722ed1;
}

.github-badge .badge-text {
  color: #24292e;
}

.gitee-badge .badge-text {
  color: #c71d23;
}

.gitcode-badge .badge-text {
  color: #1677ff;
}

/* 徽章内标签 */
.badge-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 10px;
  letter-spacing: 0.3px;
  line-height: 1.5;
  color: #ffffff;
}

.tag-normal {
  background: #1677ff;
}

.tag-update {
  background: #fa8c16;
}

.tag-beta {
  background: #52c41a;
}

.author-tag {
  background: #722ed1;
}

.github-tag {
  background: #24292e;
}

.gitee-tag {
  background: #c71d23;
}

.gitcode-tag {
  background: #1677ff;
}

/* 更新提示图标 */
.update-hint {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  cursor: help;
}

.update-icon {
  width: 14px;
  height: 14px;
  color: #fa8c16;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

.text-muted {
  color: #94a3b8;
}

.skeleton-block {
  display: inline-block;
  height: 36px;
  border-radius: 20px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
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

@keyframes slideInItem {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

:deep(.ant-card) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

:deep(.ant-card:hover) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

:deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
}

@media (max-width: 768px) {
  .link-group {
    gap: 8px;
  }
  
  .version-badge,
  .author-badge,
  .link-badge {
    padding: 6px 12px;
  }

  .badge-text {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .info-label {
    min-width: auto;
  }

  .version-badge,
  .author-badge,
  .link-badge {
    padding: 6px 12px;
  }

  .badge-text {
    font-size: 13px;
  }

  .link-group {
    gap: 6px;
    flex-wrap: wrap;
  }
}
</style>