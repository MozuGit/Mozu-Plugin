<template>
  <div class="dashboard-container">
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

    <a-card title="修仙活跃分析" class="fade-in-card trend-card" :bordered="false" style="margin-top: 16px;">
      <a-row :gutter="[16, 16]" style="margin-bottom: 20px;">
        <a-col :span="24">
          <a-statistic title="今日活跃人数" :value="displayTodayActive" :loading="loading"
            class="statistic-item active-statistic">
            <template #suffix>
              <span style="font-size: 16px; color: #faad14;">人</span>
            </template>
          </a-statistic>
        </a-col>
      </a-row>

      <div ref="chartRef" class="chart-container"></div>
    </a-card>

    <a-modal v-model:open="modalVisible" :title="`📋 ${selectedDate} 活跃玩家列表`" width="800px" :footer="null"
      class="player-modal" :body-style="{ padding: '24px' }">
      <div class="modal-content">
        <div class="modal-stats">
          <a-statistic title="总活跃人数" :value="sortedPlayerList.length"
            :value-style="{ color: '#faad14', fontSize: '24px' }" />
        </div>
        <div class="table-wrapper">
          <a-table :columns="playerColumns" :data-source="sortedPlayerList" :loading="playerLoading" :pagination="false"
            row-key="openid" size="middle" class="player-table" :scroll="{ y: 400 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'playerId'">
                <a-tag color="purple">{{ record.playerId }}</a-tag>
              </template>
              <template v-if="column.key === 'openid'">
                <a-tag color="purple" class="openid-tag" @click.stop="copyOpenid(record.openid)">
                  {{ record.openid }}
                  <a-tooltip title="点击复制">
                    <copy-outlined class="copy-icon" />
                  </a-tooltip>
                </a-tag>
              </template>
            </template>
          </a-table>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { CopyOutlined } from '@ant-design/icons-vue'
import * as echarts from 'echarts'

const playerCount = ref(0)
const sectCount = ref(0)
const todayActiveCount = ref(0)
const activeTrend = ref([])
const displayPlayerCount = ref(0)
const displaySectCount = ref(0)
const displayTodayActive = ref(0)
const loading = ref(false)
const chartRef = ref(null)
let chartInstance = null

const modalVisible = ref(false)
const playerLoading = ref(false)
const playerList = ref([])
const selectedDate = ref('')

const router = useRouter()

const sortedPlayerList = computed(() => {
  return [...playerList.value].sort((a, b) => {
    const idA = parseInt(a.playerId) || 0
    const idB = parseInt(b.playerId) || 0
    return idA - idB
  })
})

const playerColumns = [
  {
    title: '修仙ID',
    dataIndex: 'playerId',
    key: 'playerId',
    width: '30%',
    align: 'center'
  },
  {
    title: 'OpenID',
    dataIndex: 'openid',
    key: 'openid',
    width: '70%',
    align: 'center'
  }
]

const copyOpenid = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    message.success('OpenID已复制')
  }).catch(() => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    message.success('OpenID已复制')
  })
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

const formatDate = (offset) => {
  const date = new Date()
  date.setDate(date.getDate() - offset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

const getFullDate = (offset) => {
  const date = new Date()
  date.setDate(date.getDate() - offset)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const fetchActivePlayers = async (dateStr) => {
  playerLoading.value = true
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`/api/xiuxian/get_active_players?date=${dateStr}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (res.status === 401) {
      message.error("token过期或无效")
      localStorage.removeItem('token')
      router.push('/login')
      return
    }
    const data = await res.json()
    if (data.success) {
      playerList.value = data.data.players.map(item => ({
        openid: item[0],
        playerId: item[1]
      }))
      if (playerList.value.length === 0) {
        message.info('该日暂无活跃玩家')
      }
    } else {
      message.error(data.message || '获取活跃玩家失败')
    }
  } catch (error) {
    message.error('获取活跃玩家失败:', error)
  } finally {
    playerLoading.value = false
  }
}

const initChart = () => {
  if (!chartRef.value) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)

  window.addEventListener('resize', () => {
    chartInstance && chartInstance.resize()
  })
}

const updateChart = (data) => {
  if (!chartInstance) {
    initChart()
  }

  if (!chartInstance) return

  const dates = data.map(item => item.date)
  const values = data.map(item => item.active)

  const maxValue = Math.max(...values, 10)
  const minValue = Math.min(...values, 0)
  const range = maxValue - minValue
  const yMax = maxValue + range * 0.15
  const yMin = Math.max(0, minValue - range * 0.15)

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const param = params[0]
        return `<div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">${param.name}</div>
                <div style="font-size: 13px; color: #faad14;">活跃人数：<strong>${param.value}</strong> 人</div>
                <div style="font-size: 12px; color: #999; margin-top: 4px;">点击查看详细列表</div>`
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#f0f0f0',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: {
        color: '#333'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '6%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#e8e8e8'
        }
      },
      axisLabel: {
        color: '#666',
        fontSize: 12,
        fontWeight: 500
      },
      axisTick: {
        alignWithLabel: true
      },
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed'
        }
      },
      axisLabel: {
        color: '#666',
        fontSize: 12,
        formatter: (value) => {
          if (value >= 1000) {
            return (value / 1000) + 'k'
          }
          return value
        }
      },
      name: '活跃人数',
      nameTextStyle: {
        color: '#999',
        fontSize: 12
      }
    },
    series: [
      {
        name: '活跃人数',
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        lineStyle: {
          width: 3,
          color: '#faad14'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(250, 173, 20, 0.3)'
              },
              {
                offset: 1,
                color: 'rgba(250, 173, 20, 0.02)'
              }
            ]
          }
        },
        itemStyle: {
          color: '#faad14',
          borderColor: '#fff',
          borderWidth: 2
        },
        emphasis: {
          focus: 'series',
          lineStyle: {
            width: 4
          }
        },
        symbolSize: 12,
        z: 10,
        hoverAnimation: true
      }
    ]
  }

  chartInstance.setOption(option, true)
  chartInstance.resize()

  chartInstance.off('click')

  chartInstance.on('click', (params) => {
    if (params.componentType === 'series') {
      const dateStr = params.name
      const index = activeTrend.value.findIndex(item => item.date === dateStr)
      if (index !== -1) {
        const fullDate = getFullDate(9 - index)
        selectedDate.value = fullDate
        modalVisible.value = true
        fetchActivePlayers(fullDate)
      }
    }
  })

  chartInstance.getZr().on('click', (event) => {
    const pointInPixel = [event.offsetX, event.offsetY]
    const pointInGrid = chartInstance.convertFromPixel('grid', pointInPixel)
    if (pointInGrid && pointInGrid[0] !== undefined && pointInGrid[0] !== null) {
      const xIndex = Math.round(pointInGrid[0])
      if (xIndex >= 0 && xIndex < activeTrend.value.length) {
        const dateStr = activeTrend.value[xIndex].date
        const fullDate = getFullDate(9 - xIndex)
        selectedDate.value = fullDate
        modalVisible.value = true
        fetchActivePlayers(fullDate)
      }
    }
  })
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
      let newTodayActive = 0
      let trendArray = []
      if (data.data.todayActive && Array.isArray(data.data.todayActive)) {
        trendArray = data.data.todayActive.map((value, index) => ({
          date: formatDate(9 - index),
          active: Math.round(value || 0)
        }))
        newTodayActive = trendArray.length > 0 ? trendArray[trendArray.length - 1].active : 0
      } else {
        const baseValue = Math.round(data.data.todayActive || 0)
        newTodayActive = baseValue

        trendArray = []
        for (let i = 9; i >= 0; i--) {
          const variation = Math.random() * 0.4 - 0.2
          const value = Math.max(0, Math.round(baseValue * (1 + variation * (1 - i / 10))))
          trendArray.push({
            date: formatDate(i),
            active: i === 0 ? baseValue : value
          })
        }
      }

      playerCount.value = newPlayerCount
      sectCount.value = newSectCount
      todayActiveCount.value = newTodayActive
      activeTrend.value = trendArray

      animateNumber(newPlayerCount, displayPlayerCount)
      setTimeout(() => {
        animateNumber(newSectCount, displaySectCount)
      }, 200)
      setTimeout(() => {
        animateNumber(newTodayActive, displayTodayActive)
      }, 400)
      await nextTick()
      initChart()
      updateChart(trendArray)
    }
  } catch (error) {
    message.error('获取数据失败:', error)
  } finally {
    loading.value = false
  }
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.dashboard-container {
  width: 100%;
}

.fade-in-card {
  animation: slideInItem 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  opacity: 0;
  transform: translateX(-30px);
}

.trend-card {
  animation-delay: 0.2s;
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

.active-statistic {
  animation: slideInSubItem 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  opacity: 0;
  transform: translateX(-20px);
  animation-delay: 0.3s;
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

.trend-card :deep(.ant-card-head-title) {
  color: #1890ff;
  font-size: 17px;
}

.chart-container {
  width: 100%;
  height: 280px;
  cursor: pointer;
}

.chart-container:hover {
  opacity: 0.95;
}

.player-modal :deep(.ant-modal-header) {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 24px;
}

.player-modal :deep(.ant-modal-title) {
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
}

.modal-content {
  width: 100%;
}

.modal-stats {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  text-align: center;
}

.table-wrapper {
  max-height: 450px;
  overflow: hidden;
  position: relative;
}

.player-table :deep(.ant-table) {
  border-radius: 8px;
  overflow: hidden;
}

.player-table :deep(.ant-table-container) {
  border-radius: 8px;
}

.player-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  position: sticky;
  top: 0;
  z-index: 10;
}

.player-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #f0f7ff;
}

.player-table :deep(.ant-table-body) {
  max-height: 400px;
  overflow-y: auto !important;
}

.player-table :deep(.ant-table-body::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

.player-table :deep(.ant-table-body::-webkit-scrollbar-track) {
  background: #f1f1f1;
  border-radius: 3px;
}

.player-table :deep(.ant-table-body::-webkit-scrollbar-thumb) {
  background: #d3adf7;
  border-radius: 3px;
}

.player-table :deep(.ant-table-body::-webkit-scrollbar-thumb:hover) {
  background: #b37feb;
}

.player-table :deep(.ant-tag-purple) {
  background: #f9f0ff;
  border-color: #d3adf7;
  color: #722ed1;
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 500;
}

.openid-tag {
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}

.openid-tag:hover {
  background: #f0f0ff !important;
  border-color: #722ed1 !important;
  transform: scale(1.02) translateZ(0);
}

.copy-icon {
  font-size: 12px;
  opacity: 0.6;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.openid-tag:hover .copy-icon {
  opacity: 1;
}

@media (max-width: 768px) {
  :deep(.ant-statistic-content) {
    font-size: 24px;
  }

  :deep(.ant-statistic-title) {
    font-size: 14px;
  }

  .chart-container {
    height: 200px;
  }

  .player-modal :deep(.ant-modal) {
    max-width: 95%;
    margin: 10px auto;
  }

  .player-table :deep(.ant-table) {
    font-size: 12px;
  }

  .player-table :deep(.ant-tag-purple) {
    font-size: 11px;
    padding: 2px 8px;
  }

  .table-wrapper {
    max-height: 350px;
  }

  .player-table :deep(.ant-table-body) {
    max-height: 300px;
  }
}
</style>