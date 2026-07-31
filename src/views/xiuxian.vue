<template>
  <div class="dashboard-container">
    <!-- 顶部快捷栏 -->
    <div class="quick-nav">
      <a-space :size="12" class="nav-scroll-container">
        <a-button :type="currentPage === 'xiuxian' ? 'primary' : 'default'"
          :class="{ active: currentPage === 'xiuxian' }" @click="navigateTo('xiuxian')">
          <template #icon>
            <HomeOutlined />
          </template>
          首页
        </a-button>
        <a-button :type="currentPage === 'config' ? 'primary' : 'default'" :class="{ active: currentPage === 'config' }"
          @click="navigateTo('config')">
          <template #icon>
            <setting-outlined />
          </template>
          修仙配置
        </a-button>
        <a-button :type="currentPage === 'cdk' ? 'primary' : 'default'" :class="{ active: currentPage === 'cdk' }"
          @click="navigateTo('cdk')">
          <template #icon>
            <gift-outlined />
          </template>
          兑换码操作
        </a-button>
      </a-space>
    </div>

    <a-card title="魔族陌修仙" class="fade-in-card" :bordered="false">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12">
          <a-statistic title="修仙人数" :value="displayPlayerCount" :loading="loading" class="statistic-item">
            <template #suffix>
              <span style="font-size: 16px; color: #52c41a;">人</span>
            </template>
          </a-statistic>
        </a-col>
        <a-col :xs="24" :sm="12">
          <a-statistic title="宗门数量" :value="displaySectCount" :loading="loading" class="statistic-item">
            <template #suffix>
              <span style="font-size: 16px; color: #1890ff;">个</span>
            </template>
          </a-statistic>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { HomeOutlined, SettingOutlined, GiftOutlined } from '@ant-design/icons-vue'

const playerCount = ref(0)
const sectCount = ref(0)
const displayPlayerCount = ref(0)
const displaySectCount = ref(0)
const loading = ref(false)

const router = useRouter()
const route = useRoute()

const currentPage = computed(() => {
  if (route.path === '/xiuxian/config') return 'config'
  if (route.path === '/xiuxian/cdk') return 'cdk'
  return 'xiuxian'
})

const navigateTo = (page) => {
  const targetPath = page === 'xiuxian'
    ? '/xiuxian'
    : page === 'config'
      ? '/xiuxian/config'
      : '/xiuxian/cdk'

  if (route.path !== targetPath) {
    router.push(targetPath)
  }
}

const animateNumber = (target, displayRef, duration = 1500) => {
  const start = Math.round(displayRef.value)
  const end = Math.round(target)
  const diff = end - start
  const startTime = performance.now()

  const update = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    const eased = 1 - Math.pow(1 - progress, 3)
    const current = start + diff * eased

    displayRef.value = Math.round(current)

    if (progress < 1) {
      requestAnimationFrame(update)
    } else {
      displayRef.value = end
    }
  }

  requestAnimationFrame(update)
}

const fetchData = async () => {
  loading.value = true
  const token = localStorage.getItem('token')
  try {
    const res = await fetch('/api/xiuxian/getInfo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (res.status === 401) {
      message.error("token过期或无效")
      localStorage.removeItem('token')
      router.push('/login')
      document.title = '魔族陌 - 登录'
      return
    }
    const data = await res.json()
    if (data.success) {
      const newPlayerCount = Math.round(data.data.playerCount || 0)
      const newSectCount = Math.round(data.data.sectCount || 0)

      playerCount.value = newPlayerCount
      sectCount.value = newSectCount

      animateNumber(newPlayerCount, displayPlayerCount)
      setTimeout(() => {
        animateNumber(newSectCount, displaySectCount)
      }, 200)
    }
  } catch (error) {
    message.error('获取数据失败:', error)
  } finally {
    loading.value = false
  }
}

watch([playerCount, sectCount], ([newPlayer, newSect]) => {
  if (newPlayer > 0 || newSect > 0) {
    animateNumber(newPlayer, displayPlayerCount)
    setTimeout(() => {
      animateNumber(newSect, displaySectCount)
    }, 200)
  }
})

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.dashboard-container {
  width: 100%;
}

/* 顶部快捷栏样式 */
.quick-nav {
  margin-bottom: 24px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  animation: slideInFromLeft 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  overflow: hidden;
}

.nav-scroll-container {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 4px;
}

.nav-scroll-container::-webkit-scrollbar {
  display: none;
}

.nav-scroll-container>* {
  flex-shrink: 0;
}

.quick-nav .ant-btn {
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  white-space: nowrap;
  min-width: fit-content;
}

.quick-nav .ant-btn:not(.ant-btn-primary) {
  background: #f5f7fa;
  border-color: #e8eaed;
  color: #5f6368;
}

.quick-nav .ant-btn:not(.ant-btn-primary):hover {
  background: #e8f0fe;
  border-color: #b8d4fe;
  color: #1a73e8;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.2);
}

.quick-nav .ant-btn.active {
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

  .quick-nav .ant-btn {
    height: 36px;
    font-size: 13px;
    padding: 4px 12px;
  }

  .nav-scroll-container {
    gap: 8px !important;
  }
}

.fade-in-card {
  animation: slideInItem 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
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

@keyframes slideInItem {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.statistic-item {
  animation: slideInSubItem 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  opacity: 0;
  transform: translateX(-20px);
}

.statistic-item:first-child {
  animation-delay: 0.15s;
}

.statistic-item:last-child {
  animation-delay: 0.35s;
}

@keyframes slideInSubItem {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

:deep(.ant-statistic-title) {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.85);
}

:deep(.ant-statistic-content) {
  font-size: 28px;
  font-weight: 600;
}

:deep(.ant-statistic-loading .ant-statistic-content) {
  opacity: 0.6;
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

@media (max-width: 768px) {
  :deep(.ant-statistic-content) {
    font-size: 24px;
  }

  :deep(.ant-statistic-title) {
    font-size: 14px;
  }
}
</style>