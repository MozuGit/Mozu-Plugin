<template>
  <div class="dashboard-container">
    <a-card class="fade-in-card" :bordered="false">
      <template #title>
        <span>魔族陌修仙</span>
      </template>
      <template #extra>
        <a-button type="text" :loading="refreshing" @click="refreshBasicData" class="refresh-btn">
          <template #icon>
            <reload-outlined :spin="refreshing" />
          </template>
        </a-button>
      </template>
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="8">
          <a-statistic title="修仙人数" :value="displayPlayerCount" class="statistic-item">
            <template #suffix>
              <span style="font-size: 16px; color: #52c41a">人</span>
            </template>
          </a-statistic>
        </a-col>
        <a-col :xs="24" :sm="8">
          <a-statistic title="宗门数量" :value="displaySectCount" class="statistic-item">
            <template #suffix>
              <span style="font-size: 16px; color: #1890ff">个</span>
            </template>
          </a-statistic>
        </a-col>
        <a-col :xs="24" :sm="8">
          <a-statistic title="昨日新增（新注册）" :value="displayYesterdayNewPlayers" class="statistic-item">
            <template #suffix>
              <span style="font-size: 16px; color: #fa8c16">人</span>
            </template>
          </a-statistic>
        </a-col>
      </a-row>
    </a-card>

    <a-card class="fade-in-card trend-card" :bordered="false" style="margin-top: 16px">
      <template #title>
        <span>修仙活跃分析</span>
      </template>
      <template #extra>
        <a-segmented
          v-model:value="activeRange"
          :options="rangeOptions"
          :disabled="rangeLoading"
          class="range-segmented"
        />
      </template>
      <a-row :gutter="[16, 16]" style="margin-bottom: 20px">
        <a-col :xs="24" :sm="12">
          <a-statistic title="今日活跃人数" :value="displayTodayActive" class="statistic-item active-statistic">
            <template #suffix>
              <span style="font-size: 16px; color: #0891b2">人</span>
            </template>
          </a-statistic>
        </a-col>
        <a-col :xs="24" :sm="12">
          <a-statistic :title="avgTitle" :value="displayAvgActive" class="statistic-item avg-statistic">
            <template #suffix>
              <span style="font-size: 16px; color: #722ed1">人</span>
            </template>
          </a-statistic>
        </a-col>
      </a-row>

      <div ref="chartRef" class="chart-container" @click="handleContainerClick" @touchend="handleContainerTouch"></div>
    </a-card>

    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      width="800px"
      :footer="null"
      class="player-modal"
      :mask-closable="true"
      :destroy-on-close="false"
      :z-index="1000"
      :centered="true"
      :body-style="{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }"
    >
      <div class="modal-content">
        <div class="modal-stats lg-glass lg-glass--weak">
          <a-statistic
            title="总活跃人数"
            :value="sortedPlayerList.length"
            :value-style="{ color: '#c2820b', fontSize: '24px' }"
          />
        </div>
        <div class="table-wrapper">
          <a-table
            :columns="playerColumns"
            :data-source="sortedPlayerList"
            :loading="playerLoading"
            :pagination="false"
            row-key="openid"
            size="middle"
            class="player-table"
            :scroll="{ y: 400 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'playerId'">
                <a-tag color="purple">{{ record.playerId }}</a-tag>
              </template>
              <template v-if="column.key === 'openid'">
                <a-tag color="purple" class="openid-tag" @click.stop="copyOpenid(record.openid)">
                  <span class="openid-text">{{ record.openid }}</span>
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
import { ref, onMounted, nextTick, onBeforeUnmount, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import * as echarts from 'echarts'

const playerCount = ref(0)
const sectCount = ref(0)
const yesterdayNewPlayers = ref(0)
const todayActiveCount = ref(0)
const avgActiveCount = ref(0)
const activeTrend = ref([])
const activeRange = ref(10)
const rangeLoading = ref(false)
const displayPlayerCount = ref(0)
const displaySectCount = ref(0)
const displayYesterdayNewPlayers = ref(0)
const displayTodayActive = ref(0)
const displayAvgActive = ref(0)
const loading = ref(false)
const refreshing = ref(false)
const chartRef = ref(null)
let chartInstance = null
let requestSeq = 0
let resizeTimer = null

const rangeOptions = [
  { label: '近7天', value: 7 },
  { label: '近10天', value: 10 },
  { label: '近14天', value: 14 },
  { label: '近30天', value: 30 },
  { label: '近一年', value: 365 },
]

const avgTitle = computed(() => {
  return activeRange.value === 365 ? '近一年月均人数' : `近${activeRange.value}天平均人数`
})

const modalVisible = ref(false)
const playerLoading = ref(false)
const playerList = ref([])
const selectedDate = ref('')
const selectedPointType = ref('day')

const modalTitle = computed(() => {
  return `${selectedDate.value} ${selectedPointType.value === 'month' ? '月活跃玩家列表' : '活跃玩家列表'}`
})

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
    align: 'center',
  },
  {
    title: 'openid',
    dataIndex: 'openid',
    key: 'openid',
    width: '70%',
    align: 'center',
  },
]

const copyOpenid = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      message.success('OpenID已复制')
    })
    .catch(() => {
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

const fetchActivePlayers = async (point) => {
  playerLoading.value = true
  const token = localStorage.getItem('token')
  const query =
    point.type === 'month' ? `month=${encodeURIComponent(point.date)}` : `date=${encodeURIComponent(point.date)}`
  try {
    const res = await fetch(`/api/xiuxian/get_active_players?${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (res.status === 401) {
      message.error('token过期或无效')
      localStorage.removeItem('token')
      router.push('/login')
      return
    }
    const data = await res.json()
    if (data.success) {
      playerList.value = data.data.players.map((item) => ({
        openid: item[0],
        playerId: item[1],
      }))
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
    chartInstance = null
  }

  chartInstance = echarts.init(chartRef.value)

  window.removeEventListener('resize', handleResize)
  window.addEventListener('resize', handleResize)
}

const showPlayerList = (index) => {
  const point = activeTrend.value[index]
  if (!point) return
  selectedDate.value = point.date
  selectedPointType.value = point.type
  modalVisible.value = true
  fetchActivePlayers(point)
}

const handleContainerClick = (event) => {
  if (!chartInstance || !chartRef.value) return

  const rect = chartRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const pointInGrid = chartInstance.convertFromPixel('grid', [x, y])

  if (pointInGrid && pointInGrid[0] !== undefined && pointInGrid[0] !== null) {
    const xIndex = Math.round(pointInGrid[0])
    if (xIndex >= 0 && xIndex < activeTrend.value.length) {
      showPlayerList(xIndex)
    }
  }
}

const handleContainerTouch = (event) => {
  if (!chartInstance || !chartRef.value) return

  const touch = event.changedTouches[0]
  if (!touch) return

  const rect = chartRef.value.getBoundingClientRect()
  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top

  setTimeout(() => {
    if (!chartInstance) return

    const pointInGrid = chartInstance.convertFromPixel('grid', [x, y])

    if (pointInGrid && pointInGrid[0] !== undefined && pointInGrid[0] !== null) {
      const xIndex = Math.round(pointInGrid[0])
      if (xIndex >= 0 && xIndex < activeTrend.value.length) {
        showPlayerList(xIndex)
      }
    }
  }, 50)
}

const updateChart = (data) => {
  if (!chartInstance) {
    initChart()
  }

  if (!chartInstance) return

  const isMonthly = activeRange.value === 365
  const isCompact = window.innerWidth <= 768
  const dates = data.map((item) => item.label || item.date)
  const values = data.map((item) => item.active)
  const maxValue = Math.max(0, ...values)
  let yMax
  if (maxValue <= 10) {
    yMax = Math.ceil(maxValue * 1.5)
  } else if (maxValue <= 100) {
    yMax = Math.ceil(maxValue / 10) * 10 + 10
  } else if (maxValue <= 1000) {
    yMax = Math.ceil(maxValue / 50) * 50 + 50
  } else {
    yMax = Math.ceil(maxValue / 100) * 100 + 100
  }
  if (yMax < 5) {
    yMax = 5
  }
  const yMin = 0
  let interval
  if (yMax <= 10) {
    interval = 1
  } else if (yMax <= 50) {
    interval = 5
  } else if (yMax <= 100) {
    interval = 10
  } else if (yMax <= 500) {
    interval = 50
  } else if (yMax <= 1000) {
    interval = 100
  } else {
    interval = Math.ceil(yMax / 10)
  }

  const option = {
    animation: true,
    tooltip: {
      trigger: 'axis',
      confine: true,
      formatter: (params) => {
        const param = params[0]
        const point = activeTrend.value[param.dataIndex]
        const isMonthPoint = point?.type === 'month'
        const title = isMonthPoint ? point.date : param.name
        const label = isMonthPoint ? '月活跃人数' : '活跃人数'
        return `<div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 13px; color: #0e7490;">${label}：<strong>${param.value}</strong> 人</div>
                <div style="font-size: 12px; color: #999; margin-top: 4px;">点击查看详细列表</div>`
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#f0f0f0',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: {
        color: '#333',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#e8e8e8',
        },
      },
      axisLabel: {
        color: '#666',
        fontSize: isMonthly ? 11 : 12,
        fontWeight: 500,
        interval: 'auto',
        formatter: (value) => {
          if (!isMonthly) return value
          const month = value.slice(5)
          return /^\d{2}$/.test(month) ? `${Number(month)}月` : value
        },
      },
      axisTick: {
        alignWithLabel: true,
      },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      interval: interval,
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed',
        },
      },
      axisLabel: {
        color: '#666',
        fontSize: 12,
        formatter: (value) => {
          if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'k'
          }
          return Math.round(value)
        },
      },
      name: isMonthly ? '月活跃人数' : '活跃人数',
      nameTextStyle: {
        color: '#999',
        fontSize: 12,
      },
    },
    series: [
      {
        name: isMonthly ? '月活跃人数' : '活跃人数',
        type: 'line',
        data: values,
        smooth: true,
        symbol: 'circle',
        symbolSize: data.length > 20 ? 8 : 12,
        lineStyle: {
          width: 3,
          color: '#0891b2',
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
                color: 'rgba(8, 145, 178, 0.32)',
              },
              {
                offset: 1,
                color: 'rgba(8, 145, 178, 0.02)',
              },
            ],
          },
        },
        itemStyle: {
          color: '#0891b2',
          borderColor: '#fff',
          borderWidth: 2,
        },
        emphasis: {
          focus: 'series',
          lineStyle: {
            width: 4,
          },
        },
        label: {
          show: data.length <= 14 && !(isMonthly && isCompact),
          position: 'top',
          distance: 8,
          color: '#0e7490',
          fontSize: 12,
          fontWeight: 600,
          formatter: (params) => {
            return params.value
          },
        },
        z: 10,
        hoverAnimation: true,
      },
    ],
  }

  chartInstance.setOption(option, true)
  chartInstance.resize()
}

const normalizeTrend = (payload) => {
  if (Array.isArray(payload.trend) && payload.trend.length > 0) {
    return payload.trend.map((item) => {
      const type = item.type === 'month' ? 'month' : 'day'
      const date = String(item.date || '')
      return {
        date,
        label: item.label || (type === 'month' ? date : date.slice(5)),
        active: Math.round(Number(item.active) || 0),
        type,
      }
    })
  }

  if (Array.isArray(payload.todayActive) && payload.todayActive.length > 0) {
    return payload.todayActive.map((value, index) => ({
      date: getFullDate(9 - index),
      label: formatDate(9 - index),
      active: Math.round(value || 0),
      type: 'day',
    }))
  }

  const baseValue = Math.round(payload.todayActive || 0)
  const trend = []
  for (let i = 9; i >= 0; i--) {
    const variation = Math.random() * 0.4 - 0.2
    const value = Math.max(0, Math.round(baseValue * (1 + variation * (1 - i / 10))))
    trend.push({
      date: getFullDate(i),
      label: formatDate(i),
      active: i === 0 ? baseValue : value,
      type: 'day',
    })
  }
  return trend
}

const fetchData = async (isSilent = false, range = activeRange.value, animateOverview = true) => {
  if (!isSilent) {
    loading.value = true
  } else {
    refreshing.value = true
  }
  rangeLoading.value = true

  const seq = ++requestSeq
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`/api/xiuxian/getInfo?range=${range}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (res.status === 401) {
      message.error('token过期或无效')
      localStorage.removeItem('token')
      router.push('/login')
      document.title = '魔族陌 - 登录'
      return false
    }
    const data = await res.json()
    if (!data.success) {
      message.error(data.message || '获取数据失败')
      return false
    }
    if (seq !== requestSeq) return false

    const payload = data.data || {}
    const newPlayerCount = Math.round(payload.playerCount || 0)
    const newSectCount = Math.round(payload.sectCount || 0)
    const newYesterdayNewPlayers = Math.round(payload.yesterdayNewPlayers || 0)
    const trendArray = normalizeTrend(payload)
    const legacyActive = Array.isArray(payload.todayActive) ? payload.todayActive : []
    const todayPoint = trendArray.find((item) => item.date === getFullDate(0))
    const newTodayActive =
      legacyActive.length > 0
        ? Math.round(legacyActive[legacyActive.length - 1] || 0)
        : todayPoint
          ? todayPoint.active
          : 0
    const newAvgActive =
      typeof payload.average === 'number'
        ? Math.round(payload.average)
        : trendArray.length > 0
          ? Math.round(trendArray.reduce((sum, item) => sum + item.active, 0) / trendArray.length)
          : 0

    playerCount.value = newPlayerCount
    sectCount.value = newSectCount
    yesterdayNewPlayers.value = newYesterdayNewPlayers
    todayActiveCount.value = newTodayActive
    avgActiveCount.value = newAvgActive
    activeTrend.value = trendArray

    if (animateOverview) {
      const animationDuration = isSilent ? 800 : 1500

      animateNumber(newPlayerCount, displayPlayerCount, animationDuration)
      setTimeout(
        () => {
          animateNumber(newSectCount, displaySectCount, animationDuration)
        },
        isSilent ? 100 : 200
      )
      setTimeout(
        () => {
          animateNumber(newTodayActive, displayTodayActive, animationDuration)
        },
        isSilent ? 200 : 400
      )
      setTimeout(
        () => {
          animateNumber(newAvgActive, displayAvgActive, animationDuration)
        },
        isSilent ? 300 : 600
      )
      setTimeout(
        () => {
          animateNumber(newYesterdayNewPlayers, displayYesterdayNewPlayers, animationDuration)
        },
        isSilent ? 400 : 800
      )
    } else {
      displayPlayerCount.value = newPlayerCount
      displaySectCount.value = newSectCount
      displayYesterdayNewPlayers.value = newYesterdayNewPlayers
      displayTodayActive.value = newTodayActive
      animateNumber(newAvgActive, displayAvgActive, isSilent ? 500 : 700)
    }

    await nextTick()
    initChart()
    updateChart(trendArray)

    if (isSilent) {
      message.success('数据已更新')
    }
    return true
  } catch (error) {
    if (isSilent) {
      message.error('刷新失败，请重试')
    } else {
      message.error('获取数据失败:', error)
    }
    return false
  } finally {
    loading.value = false
    refreshing.value = false
    if (seq === requestSeq) {
      rangeLoading.value = false
    }
  }
}

let revertingRange = false
watch(activeRange, async (range, previous) => {
  if (revertingRange) {
    revertingRange = false
    return
  }
  if (!rangeOptions.some((item) => item.value === range)) return

  const ok = await fetchData(false, range, false)
  if (!ok && activeRange.value === range) {
    revertingRange = true
    activeRange.value = previous
  }
})

const refreshBasicData = async () => {
  if (refreshing.value) return
  await fetchData(true, activeRange.value, true)
}

const handleResize = () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    if (!chartInstance) return
    chartInstance.resize()
    if (activeTrend.value.length > 0) {
      updateChart(activeTrend.value)
    }
  }, 150)
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  clearTimeout(resizeTimer)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.dashboard-container {
  width: 100%;
  -webkit-tap-highlight-color: transparent;
}

.trend-card {
  animation-delay: 0.2s;
}

.statistic-item,
.active-statistic,
.avg-statistic {
  animation: slideInItem 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  opacity: 0;
  transform: translateX(-20px);
}

.statistic-item:nth-child(1) {
  animation-delay: 0.15s;
}

.statistic-item:nth-child(2) {
  animation-delay: 0.35s;
}

.statistic-item:nth-child(3) {
  animation-delay: 0.55s;
}

.active-statistic {
  animation-delay: 0.3s;
}

.avg-statistic {
  animation-delay: 0.5s;
}

:deep(.ant-statistic-title) {
  font-size: 16px;
  color: var(--lg-text-secondary);
}

:deep(.ant-statistic-content) {
  font-size: 28px;
  font-weight: 600;
  color: var(--lg-text);
}

.trend-card :deep(.ant-card-head-title) {
  color: #3b6fd4;
  font-size: 17px;
}

.trend-card :deep(.ant-card-head-wrapper) {
  flex-wrap: wrap;
  row-gap: 8px;
}

.range-segmented {
  background: rgba(255, 255, 255, 0.45);
}

.range-segmented :deep(.ant-segmented-item) {
  color: var(--lg-text-secondary);
  font-size: 13px;
}

.range-segmented :deep(.ant-segmented-item-selected) {
  background: linear-gradient(135deg, rgba(var(--lg-aurora-violet), 0.22), rgba(var(--lg-aurora-cyan), 0.18));
  color: #1a73e8;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.chart-container {
  width: 100%;
  height: 280px;
  cursor: pointer;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  pointer-events: auto;
}

.chart-container:hover {
  opacity: 0.95;
}

.chart-container :deep(canvas) {
  pointer-events: none !important;
}

.player-modal :deep(.ant-modal-header) {
  border-bottom: 1px solid var(--lg-hairline);
  padding: 16px 24px;
  flex-shrink: 0;
}

.player-modal :deep(.ant-modal-title) {
  font-size: 18px;
  font-weight: 600;
  color: #3b6fd4;
}

.player-modal :deep(.ant-modal-body) {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.player-modal :deep(.ant-modal-content) {
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.modal-content {
  width: 100%;
}

.modal-stats {
  margin-bottom: 16px;
  padding: 16px;
  border-radius: var(--lg-radius-sm);
  text-align: center;
  flex-shrink: 0;
}

.table-wrapper {
  max-height: 50vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

.player-table :deep(.ant-table) {
  border-radius: var(--lg-radius-sm);
  overflow: hidden;
}

.player-table :deep(.ant-table-container) {
  border-radius: var(--lg-radius-sm);
}

.player-table :deep(.ant-table-thead > tr > th) {
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
}

.player-table :deep(.ant-table-tbody > tr:hover > td) {
  background: rgba(var(--lg-aurora-cyan), 0.12) !important;
}

.player-table :deep(.ant-table-body) {
  max-height: 40vh !important;
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch;
}

.player-table :deep(.ant-tag-purple) {
  background: rgba(var(--lg-aurora-violet), 0.14);
  border-color: rgba(var(--lg-aurora-violet), 0.42);
  color: #6b46c1;
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 500;
}

.openid-tag {
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  -webkit-tap-highlight-color: transparent;
}

.openid-tag:hover {
  background: rgba(var(--lg-aurora-violet), 0.2) !important;
  border-color: rgba(var(--lg-aurora-violet), 0.62) !important;
}

.openid-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.copy-icon {
  font-size: 12px;
  opacity: 0.6;
  transition: opacity 0.3s ease;
  pointer-events: none;
  flex-shrink: 0;
}

.openid-tag:hover .copy-icon {
  opacity: 1;
}

.refresh-btn {
  color: var(--lg-text-muted);
  transition: all 0.3s ease;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.refresh-btn:hover {
  color: #3b6fd4;
  background: rgba(var(--lg-aurora-cyan), 0.16);
  transform: rotate(180deg);
}

.refresh-btn:active {
  transform: rotate(360deg) scale(0.9);
}

:deep(.ant-card-head) {
  min-height: 56px;
}

:deep(.ant-card-extra) {
  padding: 0;
}

:deep(.ant-card-head-title) {
  font-size: 17px;
  font-weight: 600;
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

  .trend-card :deep(.ant-card-head-wrapper) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .trend-card :deep(.ant-card-extra) {
    margin-inline-start: 0;
    max-width: 100%;
  }

  .range-segmented :deep(.ant-segmented-item) {
    font-size: 12px;
  }

  .range-segmented :deep(.ant-segmented-item-label) {
    padding: 0 7px;
  }

  .player-modal :deep(.ant-modal) {
    max-width: 95%;
    margin: 10px auto;
    top: 20px;
  }

  .player-modal :deep(.ant-modal-content) {
    max-height: 85vh;
  }

  .player-modal :deep(.ant-modal-body) {
    padding: 16px !important;
  }

  .player-table :deep(.ant-table) {
    font-size: 12px;
  }

  .player-table :deep(.ant-tag-purple) {
    font-size: 11px;
    padding: 2px 8px;
  }

  .openid-text {
    max-width: 120px;
  }

  .table-wrapper {
    max-height: 55vh;
  }

  .player-table :deep(.ant-table-body) {
    max-height: 45vh !important;
  }

  .refresh-btn {
    width: 32px;
    height: 32px;
  }

  :deep(.ant-card-head) {
    min-height: 48px;
    padding: 0 16px;
  }
}
</style>
