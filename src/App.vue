<template>
  <router-view v-if="route.name === 'login'" />
  <a-layout v-else style="min-height: 100vh; background: linear-gradient(135deg, #eaea66 0%, #a936d0 100%);">
    <div v-if="isMobile && !collapsed" class="mobile-overlay" @click="collapsed = true" />

    <a-layout-sider v-model:collapsed="collapsed" :collapsible="!isMobile" :trigger="null" theme="light" :width="200"
      :breakpoint="'lg'" :class="{ 'mobile-sider': isMobile, 'sider-collapsed': collapsed && isMobile }"
      style="background: #fff;">
      <div class="sider-content">
        <div class="logo">
          <img src="../Mo.png" style="height: 32px" />
          <transition name="fade">
            <span v-if="!collapsed" class="logo-text">魔族陌管理</span>
          </transition>
        </div>

        <a-menu v-model:selectedKeys="selectedKeys" mode="inline" :inline-collapsed="collapsed" @click="handleMenuClick"
          style="border-right: 0; flex: 1;">
          <a-menu-item key="xiuxian">
            <AppstoreOutlined />
            <span>魔族陌修仙</span>
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

    <a-layout style="background: transparent;">
      <a-layout-content style="margin: 16px; position: relative;">
        <a-button v-if="isMobile && collapsed" class="mobile-menu-btn" shape="circle" size="large"
          @click="collapsed = false">
          <MenuOutlined />
        </a-button>

        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { HomeOutlined, AppstoreOutlined, SettingOutlined, MenuOutlined, InfoCircleOutlined, LogoutOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

const isMobile = ref(false)
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  collapsed.value = isMobile.value
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
})

const collapsed = ref(isMobile.value)
const selectedKeys = ref([])

const validRouteNames = ['xiuxian', 'xiuxianHome', 'xiuxianConfig', 'xiuxianCdk', 'xiuxianPlayer', 'xiuxianSect', 'xiuxianBackup', 'about']

const pageTitles = {
  index: '主页',
  xiuxian: '魔族陌修仙',
  settings: '设置',
  about: '关于'
}

watch(() => route.name, (name) => {
  if (name !== 'login') {
    let subPageTitle = ""
    if (!validRouteNames.includes(name)) {
      router.push('/xiuxian')
      return
    }
    let menuKey = name
    if (name === 'xiuxianHome' || name === 'xiuxianConfig' || name === 'xiuxianCdk' || name === 'xiuxianPlayer' || name === 'xiuxianBackup' || name === 'xiuxianSect') {
      menuKey = 'xiuxian'
      subPageTitle = "魔族陌修仙"
    }
    selectedKeys.value = [menuKey]
    document.title = (pageTitles[name] || subPageTitle) + ' - MozuAdmin'

    if (isMobile.value) {
      collapsed.value = true
    }
  }
}, { immediate: true })

function handleMenuClick({ key }) {
  router.push(`/${key}`)
  if (isMobile.value) {
    collapsed.value = true
  }
}

async function logout() {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch('/login/exit', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
}

.logo-text {
  margin-left: 20px;
  color: #333;
  font-weight: bold;
  white-space: nowrap;
  flex-shrink: 0;
}

.logout-wrapper {
  padding: 12px;
  margin-top: auto;
  border-top: 1px solid #f0f0f0;
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
  background: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid #d9d9d9 !important;
  color: #666 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.mobile-menu-btn:hover,
.mobile-menu-btn:focus {
  background: rgba(255, 255, 255, 1) !important;
  border-color: #bfbfbf !important;
  color: #333 !important;
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
  background: rgba(0, 0, 0, 0.45);
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

  :deep(.ant-layout-content) {
    margin: 12px !important;
  }

  :deep(.ant-layout-header) {
    padding: 0 12px !important;
  }

  :deep(.ant-layout-header h2) {
    font-size: 16px;
  }
}
</style>