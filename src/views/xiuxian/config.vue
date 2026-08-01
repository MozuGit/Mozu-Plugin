<template>
  <div class="dashboard-container">
    <!-- 顶部快捷栏 - 可滑动 -->
    <div class="quick-nav">
      <div class="nav-scroll">
        <a-button :class="{ active: currentPage === 'xiuxian' }" @click="navigateTo('xiuxian')">
          <template #icon>
            <HomeOutlined />
          </template>
          首页
        </a-button>
        <a-button type="primary" :class="{ active: currentPage === 'config' }" @click="navigateTo('config')">
          <template #icon>
            <setting-outlined />
          </template>
          修仙配置
        </a-button>
        <a-button :class="{ active: currentPage === 'cdk' }" @click="navigateTo('cdk')">
          <template #icon>
            <gift-outlined />
          </template>
          兑换码操作
        </a-button>
        <a-button :type="currentPage === 'player' ? 'primary' : 'default'" :class="{ active: currentPage === 'player' }"
          @click="navigateTo('player')">
          <template #icon>
            <team-outlined />
          </template>
          玩家管理
        </a-button>
      </div>
    </div>

    <!-- 配置管理内容 -->
    <a-card title="修仙配置" class="fade-in-card" :bordered="false">
      <a-empty description="修仙配置页面开发中..." />
    </a-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { HomeOutlined, SettingOutlined, GiftOutlined, TeamOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

const currentPage = computed(() => {
  if (route.path === '/xiuxian/config') return 'config'
  if (route.path === '/xiuxian/cdk') return 'cdk'
  return 'xiuxian'
})

const navigateTo = (page) => {
  switch (page) {
    case 'xiuxian':
      router.push('/xiuxian')
      break
    case 'config':
      router.push('/xiuxian/config')
      break
    case 'cdk':
      router.push('/xiuxian/cdk')
      break
    case 'player':
      router.push('/xiuxian/player')
      break
  }
}
</script>

<style scoped>
.dashboard-container {
  width: 100%;
}

/* 顶部快捷栏样式 - 可滑动 */
.quick-nav {
  margin-bottom: 24px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.nav-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE/Edge */
  padding-bottom: 4px;
}

.nav-scroll::-webkit-scrollbar {
  display: none;
  /* Chrome/Safari/Opera */
}

.nav-scroll .ant-btn {
  height: 40px;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  flex-shrink: 0;
  white-space: nowrap;
}

.nav-scroll .ant-btn:not(.ant-btn-primary) {
  background: #f5f7fa;
  border-color: #e8eaed;
  color: #5f6368;
}

.nav-scroll .ant-btn:not(.ant-btn-primary):hover {
  background: #e8f0fe;
  border-color: #b8d4fe;
  color: #1a73e8;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.2);
}

.nav-scroll .ant-btn.active {
  background: #e8f0fe;
  border-color: #1a73e8;
  color: #1a73e8;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.15);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .quick-nav {
    padding: 10px 12px;
    margin-bottom: 16px;
  }

  .nav-scroll {
    gap: 8px;
  }

  .nav-scroll .ant-btn {
    height: 36px;
    font-size: 13px;
    padding: 4px 12px;
  }
}

.fade-in-card {
  animation: slideInFromLeft 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  opacity: 0;
  transform: translateX(-30px);
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
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

:deep(.ant-card:hover) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
</style>