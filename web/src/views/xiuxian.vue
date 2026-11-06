<template>
  <div class="page-shell">
    <header class="page-hero">
      <span class="page-hero__icon">
        <AppstoreOutlined />
      </span>
      <div>
        <h1>魔族陌修仙</h1>
        <p>查看修仙数据，管理玩家、宗门与兑换码</p>
      </div>
    </header>

    <nav class="page-nav" role="tablist" aria-label="修仙功能">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="page-nav__tab"
        :class="{ active: activeKey === tab.key }"
        role="tab"
        :aria-selected="activeKey === tab.key"
        @click="navigate(tab)"
      >
        <component :is="tab.icon" class="page-nav__icon" />
        <span>{{ tab.label }}</span>
      </button>
    </nav>

    <div class="page-content">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" :key="route.name" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  AppstoreOutlined,
  HomeOutlined,
  CloudServerOutlined,
  SettingOutlined,
  GiftOutlined,
  TeamOutlined,
  CompassOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

const tabs = [
  { key: 'home', label: '首页', path: '/xiuxian', icon: HomeOutlined },
  { key: 'config', label: '修仙配置', path: '/xiuxian/config', icon: SettingOutlined },
  { key: 'cdk', label: '兑换码操作', path: '/xiuxian/cdk', icon: GiftOutlined },
  { key: 'player', label: '玩家管理', path: '/xiuxian/player', icon: TeamOutlined },
  { key: 'sect', label: '宗门管理', path: '/xiuxian/sect', icon: CompassOutlined },
  { key: 'backup', label: '修仙备份', path: '/xiuxian/backup', icon: CloudServerOutlined }
]

const activeKey = computed(() => {
  const path = route.path
  if (path === '/xiuxian' || path === '/xiuxian/') return 'home'
  const current = tabs.find((tab) => tab.key !== 'home' && path.startsWith(tab.path))
  return current?.key || 'home'
})

const navigate = (tab) => {
  if (route.path !== tab.path) {
    router.push(tab.path).then(() => {
      window.scrollTo({ top: 0, behavior: 'auto' })
    })
  }
}
</script>
