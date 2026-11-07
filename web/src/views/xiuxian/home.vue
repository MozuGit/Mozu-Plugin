<template>
  <div class="panel-page home-page">
    <div class="panel-heading">
      <div class="panel-heading__main">
        <span class="panel-heading__icon">
          <DashboardOutlined />
        </span>
        <div>
          <h2>数据概览</h2>
          <p>修仙人数、宗门规模与近期活跃趋势</p>
        </div>
      </div>
      <div class="panel-heading__actions">
        <span v-if="lastUpdated" class="panel-meta">更新于 {{ lastUpdated }}</span>
        <a-button class="refresh-btn" :loading="refreshing" @click="refreshBasicData">
          <template #icon>
            <ReloadOutlined />
          </template>
          刷新
        </a-button>
      </div>
    </div>

    <section class="panel-section lg-glass">
      <div class="section-head">
        <span class="section-icon">
          <TeamOutlined />
        </span>
        <div class="section-head__copy">
          <h3>修仙概况</h3>
          <p>当前修仙人数、宗门数量与昨日新增注册</p>
        </div>
      </div>
      <div class="section-body">
        <div class="metric-grid">
          <div class="metric">
            <a-statistic title="修仙人数" :value="displayPlayerCount">
              <template #suffix>
                <span class="metric-unit metric-unit--mint">人</span>
              </template>
            </a-statistic>
          </div>
          <div class="metric">
            <a-statistic title="宗门数量" :value="displaySectCount">
              <template #suffix>
                <span class="metric-unit metric-unit--blue">个</span>
              </template>
            </a-statistic>
          </div>
          <div class="metric">
            <a-statistic title="昨日新增（新注册）" :value="displayYesterdayNewPlayers">
              <template #suffix>
                <span class="metric-unit metric-unit--pink">人</span>
              </template>
            </a-statistic>
          </div>
        </div>
      </div>
    </section>

    <section class="panel-section lg-glass">
      <div class="section-head">
        <span class="section-icon">
          <LineChartOutlined />
        </span>
        <div class="section-head__copy">
          <h3>修仙活跃分析</h3>
          <p>点击图表节点 查看对应日期的活跃玩家列表</p>
        </div>
        <div class="section-actions">
          <div class="pill-group" role="group" aria-label="统计范围">
            <button
              v-for="option in rangeOptions"
              :key="option.value"
              type="button"
              class="pill"
              :class="{ active: activeRange === option.value }"
              :disabled="rangeLoading"
              @click="activeRange = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
      <div class="section-body">
        <div class="metric-grid metric-grid--2">
          <div class="metric">
            <a-statistic title="今日活跃人数" :value="displayTodayActive">
              <template #suffix>
                <span class="metric-unit metric-unit--cyan">人</span>
              </template>
            </a-statistic>
          </div>
          <div class="metric">
            <a-statistic :title="avgTitle" :value="displayAvgActive">
              <template #suffix>
                <span class="metric-unit metric-unit--violet">人</span>
              </template>
            </a-statistic>
          </div>
        </div>

        <div class="chart-layout">
          <div v-if="chartScrollable" class="chart-yaxis" aria-hidden="true">
            <span v-for="tick in yAxisTicks" :key="tick.value" :style="{ top: `${tick.top}px` }">
              {{ tick.label }}
            </span>
          </div>
          <div ref="chartScrollRef" class="chart-scroll">
            <div
              ref="chartRef"
              class="chart-container"
              @pointerdown="handleChartPointerDown"
              @click="handleContainerClick"
            ></div>
          </div>
        </div>
        <p v-if="chartScrollable" class="chart-hint">{{ chartHint }}</p>
      </div>
    </section>

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
            :value-style="{ color: 'var(--lg-brand)', fontSize: '24px', fontWeight: 600 }"
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
import { CopyOutlined, DashboardOutlined, LineChartOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons-vue'
import * as echarts from 'echarts'
import { useAppearance } from '../../composables/useAppearance'

const { appearance } = useAppearance()

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
const lastUpdated = ref('')
const chartScrollable = ref(false)
const chartHint = ref('')
const chartRef = ref(null)
const chartScrollRef = ref(null)
const yAxisTicks = ref([])
let chartInstance = null
let requestSeq = 0
let resizeTimer = null
let lastScrollAt = 0
let tapStartPoint = null
let tooltipSuppressed = false
let tooltipTimer = null

const MOBILE_POINT_WIDTH = 40

const rangeOptions = [
  { label: '近7天', value: 7 },
  { label: '近10天', value: 10 },
  { label: '近14天', value: 14 },
  { label: '近30天', value: 30 },
  { label: '近一年', value: 365 }
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
    align: 'center'
  },
  {
    title: 'openid',
    dataIndex: 'openid',
    key: 'openid',
    width: '70%',
    align: 'center'
  }
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
        Authorization: `Bearer ${token}`
      }
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
        playerId: item[1]
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

const handleChartPointerDown = (event) => {
  tapStartPoint = {
    x: event.clientX,
    y: event.clientY,
    scrollLeft: chartScrollRef.value?.scrollLeft ?? 0
  }
}

const handleChartScroll = () => {
  lastScrollAt = Date.now()
  syncChartHint()
  suppressChartTooltip()
}

const suppressChartTooltip = () => {
  if (!chartInstance || !chartScrollable.value) return

  if (!tooltipSuppressed) {
    tooltipSuppressed = true
    chartInstance.dispatchAction({ type: 'hideTip' })
    chartInstance.setOption({ tooltip: { show: false } })
  }

  clearTimeout(tooltipTimer)
  tooltipTimer = setTimeout(() => {
    tooltipSuppressed = false
    if (chartInstance) {
      chartInstance.setOption({ tooltip: { show: true } })
    }
  }, 180)
}

const buildChartHint = (scrollLeft, scrollWidth, clientWidth) => {
  const maxLeft = scrollWidth - clientWidth
  if (maxLeft <= 2) return ''
  if (scrollLeft >= maxLeft - 2) return '向右滑动图表 查看更早数据'
  if (scrollLeft <= 2) return '向左滑动图表 查看后续数据'
  return '左右滑动图表 查看完整趋势'
}

const syncChartHint = () => {
  const el = chartScrollRef.value
  chartHint.value = el ? buildChartHint(el.scrollLeft, el.scrollWidth, el.clientWidth) : ''
}

const handleContainerClick = (event) => {
  if (Date.now() - lastScrollAt < 300) return

  if (tapStartPoint) {
    const moved = Math.hypot(event.clientX - tapStartPoint.x, event.clientY - tapStartPoint.y)
    const scrolled = Math.abs((chartScrollRef.value?.scrollLeft ?? 0) - tapStartPoint.scrollLeft)
    tapStartPoint = null
    if (moved > 8 || scrolled > 1) return
  }

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

const readCssVar = (name, fallback) => {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

const hexToRgba = (color, alpha) => {
  const hex = String(color).replace('#', '')
  const normalized = hex.length === 3 ? [...hex].map((char) => char.repeat(2)).join('') : hex
  if (normalized.length !== 6) return color
  const value = Number.parseInt(normalized, 16)
  if (Number.isNaN(value)) return color
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const isPanCapable = () => {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(pointer: coarse)').matches || window.matchMedia?.('(hover: none)').matches) {
    return true
  }
  return window.innerWidth <= 1024 && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
}

const updateChart = (data) => {
  if (!chartInstance) {
    initChart()
  }

  if (!chartInstance) return

  clearTimeout(tooltipTimer)
  tooltipSuppressed = false

  const brand = readCssVar('--lg-brand', '#667eea')
  const brandDeep = readCssVar('--lg-brand-deep', '#764ba2')
  const text = readCssVar('--lg-text', 'rgba(16, 22, 40, 0.88)')
  const textMuted = readCssVar('--lg-text-muted', 'rgba(16, 22, 40, 0.56)')
  const hairline = readCssVar('--lg-hairline', 'rgba(125, 145, 185, 0.18)')
  const surfaceSolid = readCssVar('--lg-surface-solid', 'rgba(247, 250, 255, 0.96)')
  const fontFamily = readCssVar('--lg-font', 'sans-serif')

  const isMonthly = activeRange.value === 365
  const isCompact = window.innerWidth <= 768
  const touchLayout = isPanCapable()
  const chartEl = chartRef.value
  const scrollEl = chartScrollRef.value
  const availableWidth = scrollEl?.clientWidth || chartEl?.clientWidth || 0
  const naturalWidth = data.length * MOBILE_POINT_WIDTH
  const canScroll = touchLayout && availableWidth > 0 && naturalWidth > availableWidth + 2
  chartScrollable.value = canScroll
  chartHint.value = canScroll ? '向右滑动图表 查看更早数据' : ''

  if (chartEl) {
    chartEl.style.width = canScroll ? `${naturalWidth}px` : '100%'
  }

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

  const chartHeight = chartEl?.clientHeight || (isCompact ? 210 : 280)
  const axisTop = 18
  const axisBottom = 34
  const plotHeight = Math.max(1, chartHeight - axisTop - axisBottom)
  const ticks = []

  if (canScroll) {
    for (let value = 0; value <= yMax; value += interval) {
      ticks.push({
        value,
        label: value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${Math.round(value)}`,
        top: axisTop + (1 - value / yMax) * plotHeight
      })
    }
  }

  yAxisTicks.value = ticks

  const option = {
    animation: true,
    textStyle: {
      fontFamily
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      formatter: (params) => {
        const param = params[0]
        const point = activeTrend.value[param.dataIndex]
        const isMonthPoint = point?.type === 'month'
        const title = isMonthPoint ? point.date : param.name
        const label = isMonthPoint ? '月活跃人数' : '活跃人数'
        return `<div style="font-size: 14px; font-weight: 600; margin-bottom: 4px; color: ${text};">${title}</div>
                <div style="font-size: 13px; color: ${brand};">${label}：<strong>${param.value}</strong> 人</div>
                <div style="font-size: 12px; color: ${textMuted}; margin-top: 4px;">点击查看详细列表</div>`
      },
      backgroundColor: surfaceSolid,
      borderColor: hairline,
      borderWidth: 1,
      padding: [12, 16],
      textStyle: {
        color: text,
        fontFamily
      },
      extraCssText:
        'backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border-radius: 12px; box-shadow: 0 12px 32px rgba(39, 52, 105, 0.18);'
    },
    grid: canScroll
      ? { left: 18, right: 18, top: axisTop, bottom: axisBottom }
      : { left: '3%', right: '4%', bottom: '8%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        lineStyle: {
          color: hairline
        }
      },
      axisLabel: {
        color: textMuted,
        fontSize: isMonthly ? 11 : 12,
        fontWeight: 500,
        interval: 'auto',
        formatter: (value) => {
          if (!isMonthly) return value
          const month = value.slice(5)
          return /^\d{2}$/.test(month) ? `${Number(month)}月` : value
        }
      },
      axisTick: {
        show: false,
        alignWithLabel: true
      },
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      interval: interval,
      axisLine: {
        show: !canScroll
      },
      axisTick: {
        show: !canScroll
      },
      splitLine: {
        lineStyle: {
          color: hairline,
          type: 'dashed'
        }
      },
      axisLabel: {
        show: !canScroll,
        color: textMuted,
        fontSize: 12,
        formatter: (value) => {
          if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'k'
          }
          return Math.round(value)
        }
      },
      name: canScroll ? '' : isMonthly ? '月活跃人数' : '活跃人数',
      nameTextStyle: {
        color: textMuted,
        fontSize: 12
      }
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
          color: brand,
          shadowBlur: 10,
          shadowColor: hexToRgba(brand, 0.24),
          shadowOffsetY: 5
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
                color: hexToRgba(brand, 0.3)
              },
              {
                offset: 1,
                color: hexToRgba(brandDeep, 0.02)
              }
            ]
          }
        },
        itemStyle: {
          color: brand,
          borderColor: '#fff',
          borderWidth: 2
        },
        emphasis: {
          focus: 'series',
          lineStyle: {
            width: 4
          },
          itemStyle: {
            borderWidth: 3,
            shadowBlur: 12,
            shadowColor: hexToRgba(brand, 0.45)
          }
        },
        label: {
          show: data.length <= 14 && !(isMonthly && isCompact),
          position: 'top',
          distance: 8,
          color: brandDeep,
          fontSize: 12,
          fontWeight: 600,
          formatter: (params) => {
            return params.value
          }
        },
        z: 10,
        hoverAnimation: true
      }
    ]
  }

  chartInstance.setOption(option, true)
  chartInstance.resize()

  nextTick(() => {
    const el = chartScrollRef.value
    if (canScroll && el) {
      const maxLeft = el.scrollWidth - el.clientWidth
      if (el.scrollLeft <= 2 || el.scrollLeft >= maxLeft - 2) {
        el.scrollLeft = maxLeft
      }
    }
    syncChartHint()
  })
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
        type
      }
    })
  }

  if (Array.isArray(payload.todayActive) && payload.todayActive.length > 0) {
    return payload.todayActive.map((value, index) => ({
      date: getFullDate(9 - index),
      label: formatDate(9 - index),
      active: Math.round(value || 0),
      type: 'day'
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
      type: 'day'
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
        Authorization: `Bearer ${token}`
      }
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
    lastUpdated.value = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

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
      message.error('刷新失败 请重试')
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

watch(
  appearance,
  () => {
    if (chartInstance && activeTrend.value.length > 0) {
      updateChart(activeTrend.value)
    }
  },
  { deep: true }
)

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
  chartScrollRef.value?.addEventListener('scroll', handleChartScroll, { passive: true })
  fetchData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  chartScrollRef.value?.removeEventListener('scroll', handleChartScroll)
  clearTimeout(tooltipTimer)
  window.removeEventListener('resize', handleResize)
  clearTimeout(resizeTimer)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.home-page {
  -webkit-tap-highlight-color: transparent;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.metric {
  min-width: 0;
  padding: 2px 24px;
  border-left: 1px solid var(--lg-hairline);
}

.metric:first-child {
  padding-left: 0;
  border-left: 0;
}

.metric:last-child {
  padding-right: 0;
}

.metric :deep(.ant-statistic-title) {
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--lg-text-muted);
}

.metric :deep(.ant-statistic-content) {
  font-size: 32px;
  line-height: 1.15;
  font-weight: 600;
  color: var(--lg-text);
  font-variant-numeric: tabular-nums;
}

.metric-unit {
  margin-left: 4px;
  font-size: 14px;
  font-weight: 500;
}

.metric-unit--mint {
  color: rgb(var(--lg-aurora-mint));
}

.metric-unit--blue {
  color: rgb(var(--lg-aurora-blue));
}

.metric-unit--pink {
  color: rgb(var(--lg-aurora-pink));
}

.metric-unit--cyan {
  color: rgb(var(--lg-aurora-cyan));
}

.metric-unit--violet {
  color: rgb(var(--lg-aurora-violet));
}

.chart-layout {
  display: flex;
  align-items: stretch;
  margin-top: 22px;
}

.chart-scroll {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}

.chart-scroll::-webkit-scrollbar {
  display: none;
}

.chart-yaxis {
  position: relative;
  flex: 0 0 38px;
  width: 38px;
  pointer-events: none;
  user-select: none;
}

.chart-yaxis span {
  position: absolute;
  right: 6px;
  transform: translateY(-50%);
  font-size: 11px;
  line-height: 1;
  color: var(--lg-text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.chart-container {
  width: 100%;
  height: 280px;
  cursor: pointer;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

.chart-hint {
  margin: 4px 2px 0;
  font-size: 11.5px;
  line-height: 1.5;
  text-align: right;
  color: var(--lg-text-muted);
}

.player-modal :deep(.ant-modal-header) {
  border-bottom: 1px solid var(--lg-hairline);
  padding: 16px 24px;
  flex-shrink: 0;
}

.player-modal :deep(.ant-modal-title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--lg-text);
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
  color: var(--lg-brand);
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
  height: 36px;
  border-radius: 10px;
}

.refresh-btn :deep(.anticon) {
  transition: transform 0.3s ease;
}

.refresh-btn:not(.ant-btn-loading):hover :deep(.anticon) {
  transform: rotate(180deg);
}

@media (max-width: 768px) {
  .metric-grid,
  .metric-grid--2 {
    grid-template-columns: 1fr;
  }

  .metric {
    padding: 12px 0;
    border-left: 0;
    border-top: 1px solid var(--lg-hairline);
  }

  .metric:first-child {
    padding-top: 0;
    border-top: 0;
  }

  .metric:last-child {
    padding-bottom: 0;
  }

  .metric :deep(.ant-statistic-content) {
    font-size: 26px;
  }

  .chart-layout {
    margin-top: 16px;
  }

  .chart-container {
    height: 210px;
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
    height: 34px;
    padding: 0 10px;
    font-size: 12px;
  }
}
</style>
