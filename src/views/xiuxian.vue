<template>
  <div class="dashboard-container">
    <div class="quick-nav lg-glass lg-glass__specular">
      <a-space :size="12" class="nav-scroll-container">
        <a-button
          :type="currentPage === 'home' ? 'primary' : 'default'"
          :class="{ active: currentPage === 'home' }"
          @click="navigateTo('home')"
        >
          <template #icon>
            <HomeOutlined />
          </template>
          首页
        </a-button>
        <a-button
          :type="currentPage === 'config' ? 'primary' : 'default'"
          :class="{ active: currentPage === 'config' }"
          @click="navigateTo('config')"
        >
          <template #icon>
            <setting-outlined />
          </template>
          修仙配置
        </a-button>
        <a-button
          :type="currentPage === 'cdk' ? 'primary' : 'default'"
          :class="{ active: currentPage === 'cdk' }"
          @click="navigateTo('cdk')"
        >
          <template #icon>
            <gift-outlined />
          </template>
          兑换码操作
        </a-button>
        <a-button
          :type="currentPage === 'player' ? 'primary' : 'default'"
          :class="{ active: currentPage === 'player' }"
          @click="navigateTo('player')"
        >
          <template #icon>
            <team-outlined />
          </template>
          玩家管理
        </a-button>
        <a-button
          :type="currentPage === 'sect' ? 'primary' : 'default'"
          :class="{ active: currentPage === 'sect' }"
          @click="navigateTo('sect')"
        >
          <template #icon>
            <CompassOutlined />
          </template>
          宗门管理
        </a-button>
        <a-button
          :type="currentPage === 'backup' ? 'primary' : 'default'"
          :class="{ active: currentPage === 'backup' }"
          @click="navigateTo('backup')"
        >
          <template #icon>
            <cloud-server-outlined />
          </template>
          修仙备份
        </a-button>
      </a-space>
    </div>

    <div class="content-area">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  HomeOutlined,
  CloudServerOutlined,
  SettingOutlined,
  GiftOutlined,
  TeamOutlined,
  CompassOutlined,
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

const currentPage = computed(() => {
  const path = route.path
  if (path === '/xiuxian' || path === '/xiuxian/') return 'home'
  if (path.includes('/xiuxian/backup')) return 'backup'
  if (path.includes('/xiuxian/config')) return 'config'
  if (path.includes('/xiuxian/cdk')) return 'cdk'
  if (path.includes('/xiuxian/player')) return 'player'
  if (path.includes('/xiuxian/sect')) return 'sect'
  return 'home'
})

const navigateTo = (page) => {
  let targetPath = '/xiuxian'
  switch (page) {
    case 'home':
      targetPath = '/xiuxian'
      break
    case 'backup':
      targetPath = '/xiuxian/backup'
      break
    case 'config':
      targetPath = '/xiuxian/config'
      break
    case 'cdk':
      targetPath = '/xiuxian/cdk'
      break
    case 'player':
      targetPath = '/xiuxian/player'
      break
    case 'sect':
      targetPath = '/xiuxian/sect'
      break
  }

  if (route.path !== targetPath) {
    router.push(targetPath)
  }
}
</script>

<style scoped>
.dashboard-container {
  width: 100%;
}

.quick-nav {
  margin-bottom: 24px;
  padding: 6px 12px;
  border-radius: var(--lg-radius);
  overflow: hidden;
  animation: slideInFromLeft 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.nav-scroll-container {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 8px 4px;
}

.nav-scroll-container::-webkit-scrollbar {
  display: none;
}

.nav-scroll-container > * {
  flex-shrink: 0;
}

.quick-nav .ant-btn {
  height: 40px;
  border-radius: var(--lg-radius-sm);
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  white-space: nowrap;
  min-width: fit-content;
}

.quick-nav .ant-btn:not(.ant-btn-primary) {
  background: rgba(255, 255, 255, 0.42);
  border-color: rgba(255, 255, 255, 0.6);
  color: var(--lg-text-secondary);
}

.quick-nav .ant-btn:not(.ant-btn-primary):hover {
  background: rgba(var(--lg-aurora-cyan), 0.18);
  border-color: rgba(var(--lg-aurora-cyan), 0.55);
  color: #1a73e8;
  transform: translateY(-1px);
  box-shadow: 0 2px 12px rgba(var(--lg-aurora-cyan), 0.28);
}

.quick-nav .ant-btn.active {
  background: linear-gradient(135deg, rgba(var(--lg-aurora-violet), 0.22), rgba(var(--lg-aurora-cyan), 0.18));
  border-color: rgba(var(--lg-aurora-violet), 0.55);
  color: var(--lg-brand);
  font-weight: 600;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 2px 12px rgba(var(--lg-aurora-violet), 0.26);
}

.content-area {
  width: 100%;
}

@media (max-width: 768px) {
  .quick-nav {
    padding: 4px 8px;
    margin-bottom: 16px;
  }

  .quick-nav .ant-btn {
    height: 36px;
    font-size: 13px;
    padding: 4px 12px;
  }

  .nav-scroll-container {
    gap: 8px !important;
  }
}
</style>
