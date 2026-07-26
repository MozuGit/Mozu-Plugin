<template>
  <a-card title="魔族陌修仙" class="fade-in-card" :bordered="false">
    <a-row :gutter="16">
      <a-col :span="12">
        <a-statistic title="修仙人数" :value="displayPlayerCount" :loading="loading" class="statistic-item">
          <template #suffix>
            <span style="font-size: 16px; color: #52c41a;">人</span>
          </template>
        </a-statistic>
      </a-col>
      <a-col :span="12">
        <a-statistic title="宗门数量" :value="displaySectCount" :loading="loading" class="statistic-item">
          <template #suffix>
            <span style="font-size: 16px; color: #1890ff;">个</span>
          </template>
        </a-statistic>
      </a-col>
    </a-row>
  </a-card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

const playerCount = ref(0)
const sectCount = ref(0)
const displayPlayerCount = ref(0)
const displaySectCount = ref(0)
const loading = ref(false)

const router = useRouter()

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

.statistic-item {
  animation: slideInItem 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  opacity: 0;
  transform: translateX(-20px);
}

.statistic-item:first-child {
  animation-delay: 0.15s;
}

.statistic-item:last-child {
  animation-delay: 0.35s;
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

:deep(.ant-statistic-title) {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.85);
}

:deep(.ant-statistic-content) {
  font-size: 28px;
  font-weight: 600;
}

/* 加载状态下数字颜色略微变淡 */
:deep(.ant-statistic-loading .ant-statistic-content) {
  opacity: 0.6;
}

/* 卡片样式微调 */
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