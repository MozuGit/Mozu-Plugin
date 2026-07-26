<template>
  <router-view v-if="route.name === 'login'" />
  <a-layout v-else style="min-height: 100vh; background: linear-gradient(135deg, #eaea66 0%, #a936d0 100%);">
    <a-layout-sider v-model:collapsed="collapsed" collapsible theme="light" style="background: #fff;">
      <div class="logo">
        <img src="../Mo.png" style="height: 32px" />
        <transition name="fade">
          <span v-if="!collapsed" class="logo-text">魔族陌管理</span>
        </transition>
      </div>
      <a-menu v-model:selectedKeys="selectedKeys" mode="inline" :inline-collapsed="collapsed" @click="handleMenuClick"
        style="border-right: 0;">
        <!--<a-menu-item key="index">
          <HomeOutlined />
          <span>主页</span>
        </a-menu-item>
      -->
        <a-menu-item key="xiuxian">
          <AppstoreOutlined />
          <span>魔族陌修仙</span>
        </a-menu-item>
        <!--
        <a-menu-item key="settings">
          <SettingOutlined />
          <span>设置</span>
        </a-menu-item>
      -->
      </a-menu>
    </a-layout-sider>

    <a-layout style="background: transparent;">
      <a-layout-header
        style="background: rgba(255,255,255,0.9); padding: 0 24px; display: flex; justify-content: space-between; align-items: center;">
        <h2 style="margin: 0;">{{ pageTitle }}</h2>
        <a-button type="link" @click="logout">退出登录</a-button>
      </a-layout-header>
      <a-layout-content style="margin: 24px;">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { HomeOutlined, AppstoreOutlined, SettingOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)
const selectedKeys = ref([])
const pageTitle = ref('')

const validRouteNames = ['index', 'xiuxian', 'settings']

const pageTitles = {
  index: '主页',
  xiuxian: '魔族陌修仙',
  settings: '设置'
}

watch(() => route.name, (name) => {
  if (name !== 'login') {
    if (!validRouteNames.includes(name)) {
      router.push('/xiuxian')
      return
    }
    selectedKeys.value = [name]
    pageTitle.value = pageTitles[name]
    document.title = pageTitles[name] + ' - MozuAdmin'
  }
}, { immediate: true })

function handleMenuClick({ key }) {
  router.push(`/${key}`)
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
  document.title = '魔族陌 - 登录'
}
</script>

<style scoped>
.logo {
  height: 64px;
  display: flex;
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
  margin-left: 10px;
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
</style>