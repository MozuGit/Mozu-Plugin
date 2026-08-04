<template>
  <router-view v-if="route.name === 'login'" />
  <a-layout v-else style="min-height: 100vh; background: linear-gradient(135deg, #eaea66 0%, #a936d0 100%);">
    <div v-if="isMobile && !collapsed" class="mobile-overlay" @click="collapsed = true" />

    <a-layout-sider v-model:collapsed="collapsed" :collapsible="!isMobile" :trigger="null" theme="light" :width="200"
      :breakpoint="'lg'" :class="{ 'mobile-sider': isMobile, 'sider-collapsed': collapsed && isMobile }"
      style="background: #fff;">
      <div class="logo">
        <img src="../Mo.png" style="height: 32px" />
        <transition name="fade">
          <span v-if="!collapsed" class="logo-text">魔族陌管理</span>
        </transition>
      </div>
      <a-menu v-model:selectedKeys="selectedKeys" mode="inline" :inline-collapsed="collapsed" @click="handleMenuClick"
        style="border-right: 0;">
        <a-menu-item key="xiuxian">
          <AppstoreOutlined />
          <span>魔族陌修仙</span>
        </a-menu-item>
        <a-menu-item key="about">
          <InfoCircleOutlined />
          <span>关于</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout style="background: transparent;">
      <a-layout-header
        style="background: rgba(255,255,255,0.9); padding: 0 16px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <a-button v-if="isMobile" type="text" :icon="h(MenuOutlined)" @click="collapsed = !collapsed" />
          <h2 style="margin: 0;">{{ pageTitle }}</h2>
        </div>
        <a-button type="link" @click="logout">退出登录</a-button>
      </a-layout-header>
      <a-layout-content style="margin: 16px;">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { HomeOutlined, AppstoreOutlined, SettingOutlined, MenuOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'

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
const pageTitle = ref('')

const validRouteNames = ['xiuxian', 'xiuxianHome', 'xiuxianBackup', 'xiuxianConfig', 'xiuxianCdk', 'xiuxianPlayer', 'xiuxianSect', 'about']

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
    pageTitle.value = pageTitles[name] || subPageTitle
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
  const res = await fetch('/login/exit', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  localStorage.removeItem('token')
  router.push('/login')
  document.title = '魔族陌 - MozuAdmin'
}
</script>

<style scoped>
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