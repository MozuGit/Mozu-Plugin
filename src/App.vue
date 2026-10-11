<template>
  <svg class="glass-filters" aria-hidden="true" focusable="false">
    <filter id="lg-refract" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.014" numOctaves="2" seed="7" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>

  <div class="lg-aurora" aria-hidden="true">
    <span class="lg-aurora__blob lg-aurora__blob--1" />
    <span class="lg-aurora__blob lg-aurora__blob--2" />
    <span class="lg-aurora__blob lg-aurora__blob--3" />
  </div>

  <router-view v-if="route.name === 'login'" />
  <a-layout v-else class="app-layout">
    <div v-if="isMobile && !collapsed" class="mobile-overlay" @click="collapsed = true" />

    <a-layout-sider
      v-model:collapsed="collapsed"
      :collapsible="!isMobile"
      :trigger="null"
      theme="light"
      :width="200"
      :breakpoint="'lg'"
      :class="{ 'mobile-sider': isMobile, 'sider-collapsed': collapsed && isMobile, 'app-sider': true }"
    >
      <div class="sider-content">
        <div class="logo">
          <img src="../Mo.png" style="height: 32px" />
          <transition name="fade">
            <span v-if="!collapsed" class="logo-text">魔族陌管理</span>
          </transition>
        </div>

        <a-menu
          v-model:selectedKeys="selectedKeys"
          mode="inline"
          :inline-collapsed="collapsed"
          @click="handleMenuClick"
          class="app-menu"
        >
          <a-menu-item key="xiuxian">
            <AppstoreOutlined />
            <span>魔族陌修仙</span>
          </a-menu-item>
          <a-menu-item key="settings">
            <SettingOutlined />
            <span>设置</span>
          </a-menu-item>
          <a-menu-item key="about">
            <InfoCircleOutlined />
            <span>关于</span>
          </a-menu-item>
        </a-menu>

        <div class="logout-wrapper">
          <a-button block @click="logout" class="logout-btn">
            <LogoutOutlined />
            <span v-if="!collapsed">退出登录</span>
          </a-button>
        </div>
      </div>
    </a-layout-sider>

    <a-layout class="app-main">
      <a-layout-content class="app-content">
        <a-button
          v-if="isMobile && collapsed"
          class="mobile-menu-btn"
          shape="circle"
          size="large"
          @click="collapsed = false"
        >
          <MenuOutlined />
        </a-button>

        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  AppstoreOutlined,
  SettingOutlined,
  MenuOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue'
import { useGlassPointer } from './composables/useGlassPointer'

const router = useRouter()
const route = useRoute()

const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  collapsed.value = isMobile.value
}

let glassPointer = null

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)

  glassPointer = useGlassPointer()

  document.body.classList.add('lg-body')
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  glassPointer?.destroy()
  document.body.classList.remove('lg-body')
})

const collapsed = ref(isMobile.value)
const selectedKeys = ref([])

const validRouteNames = [
  'xiuxian',
  'xiuxianHome',
  'xiuxianConfig',
  'xiuxianCdk',
  'xiuxianPlayer',
  'xiuxianSect',
  'xiuxianBackup',
  'settings',
  'about',
]

const pageTitles = {
  index: '主页',
  xiuxian: '魔族陌修仙',
  settings: '设置',
  about: '关于',
}

watch(
  () => route.name,
  (name) => {
    if (name !== 'login') {
      let subPageTitle = ''
      if (!validRouteNames.includes(name)) {
        router.push('/xiuxian')
        return
      }
      let menuKey = name
      if (
        name === 'xiuxianHome' ||
        name === 'xiuxianConfig' ||
        name === 'xiuxianCdk' ||
        name === 'xiuxianPlayer' ||
        name === 'xiuxianBackup' ||
        name === 'xiuxianSect'
      ) {
        menuKey = 'xiuxian'
        subPageTitle = '魔族陌修仙'
      }
      selectedKeys.value = [menuKey]
      document.title = (pageTitles[name] || subPageTitle) + ' - MozuAdmin'

      if (isMobile.value) {
        collapsed.value = true
      }
    }
  },
  { immediate: true }
)

function handleMenuClick({ key }) {
  router.push(`/${key}`)
  if (isMobile.value) {
    collapsed.value = true
  }
}

async function logout() {
  const token = localStorage.getItem('token')
  try {
    await fetch('/api/login?action=exit', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch (error) {
    console.error('退出登录失败:', error)
  } finally {
    localStorage.removeItem('token')
    router.push('/login')
    document.title = '魔族陌 - MozuAdmin'
  }
}
</script>

<style scoped>
.glass-filters {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}

.app-layout {
  min-height: 100vh;
  background: transparent;
}

.app-main,
.app-content {
  background: transparent;
}

.app-content {
  margin: 16px;
  position: relative;
}

.app-sider {
  background: var(--lg-surface-strong) !important;
  background-image: linear-gradient(160deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.14) 100%) !important;
  -webkit-backdrop-filter: blur(var(--lg-blur-strong)) saturate(var(--lg-saturate));
  backdrop-filter: blur(var(--lg-blur-strong)) saturate(var(--lg-saturate));
  border-right: 1px solid var(--lg-border-soft);
  box-shadow:
    inset -1px 0 0 rgba(255, 255, 255, 0.5),
    4px 0 28px rgba(39, 52, 105, 0.1);
}

.sider-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.logo {
  height: 64px;
  display: flex;
  margin-left: 7px;
  align-items: center;
  padding: 0 16px;
  overflow: hidden;
  white-space: nowrap;
}

.logo img {
  height: 32px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 6px rgba(39, 52, 105, 0.18));
}

.logo-text {
  margin-left: 20px;
  color: var(--lg-text);
  font-weight: bold;
  white-space: nowrap;
  flex-shrink: 0;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
}

.app-menu {
  border-right: 0 !important;
  flex: 1;
  background: transparent !important;
}

.app-menu :deep(.ant-menu-item) {
  color: var(--lg-text-secondary);
  border-radius: var(--lg-radius-sm);
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.app-menu :deep(.ant-menu-item:hover) {
  background: rgba(255, 255, 255, 0.5) !important;
  color: var(--lg-brand) !important;
}

.app-menu :deep(.ant-menu-item-selected) {
  background: linear-gradient(
    135deg,
    rgba(var(--lg-aurora-violet), 0.22),
    rgba(var(--lg-aurora-cyan), 0.18)
  ) !important;
  color: var(--lg-brand) !important;
  font-weight: 600;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 2px 10px rgba(39, 52, 105, 0.1);
}

.app-menu :deep(.ant-menu-item-selected::after) {
  display: none;
}

.logout-wrapper {
  padding: 12px;
  margin-top: auto;
  border-top: 1px solid var(--lg-hairline);
}

.logout-btn {
  background-color: #ff4d4f !important;
  border-color: #ff4d4f !important;
  color: #fff !important;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.logout-btn:hover,
.logout-btn:focus {
  background-color: #ff7875 !important;
  border-color: #ff7875 !important;
  color: #fff !important;
}

.logout-btn span {
  margin-left: 8px;
}

.mobile-menu-btn {
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: 998;
  background: var(--lg-surface-strong) !important;
  -webkit-backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate));
  backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate));
  border: 1px solid var(--lg-border-soft) !important;
  color: var(--lg-text-secondary) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 8px 28px rgba(39, 52, 105, 0.18);
}

.mobile-menu-btn:hover,
.mobile-menu-btn:focus {
  background: rgba(255, 255, 255, 0.85) !important;
  border-color: rgba(var(--lg-aurora-violet), 0.5) !important;
  color: var(--lg-brand) !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.mobile-sider {
  position: fixed !important;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
  height: 100vh;
  transition: transform 0.3s ease !important;
}

.sider-collapsed {
  transform: translateX(-100%);
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(24, 32, 60, 0.38);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  z-index: 999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .logo {
    margin-left: 0;
  }

  .app-content {
    margin: 12px;
  }
}
</style>
