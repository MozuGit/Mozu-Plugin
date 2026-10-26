import { computed, reactive, watch } from 'vue'

// 面板外观偏好：主题极光、强调色、背景与界面质感

const STORAGE_KEY = 'mozu:panel:appearance:v1'

export const THEME_PRESETS = [
  {
    id: 'aurora',
    name: '极光',
    dots: ['#22d3ee', '#8b5cf6', '#ec4899'],
    colors: {
      cyan: '34, 211, 238',
      blue: '99, 102, 241',
      violet: '139, 92, 246',
      pink: '236, 72, 153',
      mint: '45, 212, 191',
    },
  },
  {
    id: 'mint',
    name: '薄荷',
    dots: ['#2dd4bf', '#38bdf8', '#34d399'],
    colors: {
      cyan: '45, 212, 191',
      blue: '56, 189, 248',
      violet: '20, 184, 166',
      pink: '125, 211, 252',
      mint: '134, 239, 172',
    },
  },
  {
    id: 'sunset',
    name: '落日',
    dots: ['#fb923c', '#f472b6', '#d946ef'],
    colors: {
      cyan: '251, 146, 60',
      blue: '244, 114, 182',
      violet: '217, 70, 239',
      pink: '251, 113, 133',
      mint: '253, 186, 116',
    },
  },
  {
    id: 'ocean',
    name: '海岸',
    dots: ['#38bdf8', '#3b82f6', '#818cf8'],
    colors: {
      cyan: '56, 189, 248',
      blue: '59, 130, 246',
      violet: '129, 140, 248',
      pink: '103, 232, 249',
      mint: '45, 212, 191',
    },
  },
  {
    id: 'sakura',
    name: '樱花',
    dots: ['#f472b6', '#e879f9', '#fda4af'],
    colors: {
      cyan: '244, 114, 182',
      blue: '232, 121, 249',
      violet: '192, 132, 252',
      pink: '251, 207, 232',
      mint: '253, 164, 175',
    },
  },
]

export const ACCENT_COLORS = [
  { id: 'violet', name: '紫罗兰', color: '#667eea', deep: '#764ba2' },
  { id: 'blue', name: '海蓝', color: '#3b82f6', deep: '#2563eb' },
  { id: 'cyan', name: '青碧', color: '#06b6d4', deep: '#0891b2' },
  { id: 'green', name: '翡翠', color: '#10b981', deep: '#059669' },
  { id: 'orange', name: '琥珀', color: '#f59e0b', deep: '#d97706' },
  { id: 'pink', name: '樱花', color: '#ec4899', deep: '#be185d' },
  { id: 'red', name: '绯红', color: '#ef4444', deep: '#b91c1c' },
]

export const BACKGROUND_STYLES = [
  { id: 'aurora', name: '极光', description: '流动光晕' },
  { id: 'gradient', name: '渐变', description: '柔和渐变' },
  { id: 'solid', name: '纯色', description: '干净底色' },
]

export const GLASS_STYLES = [
  {
    id: 'clear',
    name: '通透',
    variables: {
      '--lg-surface': 'rgba(255, 255, 255, 0.34)',
      '--lg-surface-strong': 'rgba(255, 255, 255, 0.46)',
      '--lg-surface-weak': 'rgba(255, 255, 255, 0.18)',
      '--lg-blur': '18px',
      '--lg-blur-strong': '30px',
      '--lg-saturate': '175%',
    },
  },
  {
    id: 'mist',
    name: '柔雾',
    variables: {
      '--lg-surface': 'rgba(255, 255, 255, 0.46)',
      '--lg-surface-strong': 'rgba(255, 255, 255, 0.6)',
      '--lg-surface-weak': 'rgba(255, 255, 255, 0.28)',
      '--lg-blur': '26px',
      '--lg-blur-strong': '40px',
      '--lg-saturate': '185%',
    },
  },
  {
    id: 'solid',
    name: '实色',
    variables: {
      '--lg-surface': 'rgba(255, 255, 255, 0.82)',
      '--lg-surface-strong': 'rgba(255, 255, 255, 0.92)',
      '--lg-surface-weak': 'rgba(255, 255, 255, 0.62)',
      '--lg-blur': '10px',
      '--lg-blur-strong': '16px',
      '--lg-saturate': '120%',
    },
  },
]

export const CORNER_STYLES = [
  { id: 'compact', name: '紧凑', base: '8px', small: '6px', large: '14px', token: 6 },
  { id: 'default', name: '默认', base: '12px', small: '8px', large: '20px', token: 8 },
  { id: 'soft', name: '圆润', base: '16px', small: '10px', large: '26px', token: 10 },
]

export const MOTION_STYLES = [
  { id: 'full', name: '完整' },
  { id: 'reduced', name: '减弱' },
  { id: 'off', name: '关闭' },
]

export const FONT_STYLES = [
  { id: 'loli', name: '默认' },
  { id: 'system', name: '系统' },
]

const FONT_STACKS = {
  loli: "'Loli', 'Heiti SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'Source Han Sans SC', sans-serif",
  system:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'Source Han Sans SC', sans-serif",
}

const DEFAULT_STATE = {
  preset: 'aurora',
  accent: 'violet',
  background: 'aurora',
  glass: 'clear',
  corner: 'default',
  motion: 'full',
  font: 'loli',
}

const VALIDATORS = {
  preset: (value) => THEME_PRESETS.some((item) => item.id === value),
  accent: (value) => ACCENT_COLORS.some((item) => item.id === value),
  background: (value) => BACKGROUND_STYLES.some((item) => item.id === value),
  glass: (value) => GLASS_STYLES.some((item) => item.id === value),
  corner: (value) => CORNER_STYLES.some((item) => item.id === value),
  motion: (value) => MOTION_STYLES.some((item) => item.id === value),
  font: (value) => FONT_STYLES.some((item) => item.id === value),
}

function readStoredState() {
  const fallback = { ...DEFAULT_STATE }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return fallback
    for (const key of Object.keys(DEFAULT_STATE)) {
      if (VALIDATORS[key]?.(parsed[key])) {
        fallback[key] = parsed[key]
      }
    }
  } catch {
    // 浏览器禁用存储或数据损坏时直接使用默认值
  }
  return fallback
}

const state = reactive(readStoredState())

const currentPreset = computed(() => THEME_PRESETS.find((item) => item.id === state.preset) || THEME_PRESETS[0])
const currentAccent = computed(() => ACCENT_COLORS.find((item) => item.id === state.accent) || ACCENT_COLORS[0])
const currentGlass = computed(() => GLASS_STYLES.find((item) => item.id === state.glass) || GLASS_STYLES[0])
const currentCorner = computed(() => CORNER_STYLES.find((item) => item.id === state.corner) || CORNER_STYLES[1])
const fontStack = computed(() => FONT_STACKS[state.font] || FONT_STACKS.loli)

function applyAppearance() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const preset = currentPreset.value
  const accent = currentAccent.value
  const glass = currentGlass.value
  const corner = currentCorner.value

  for (const [key, value] of Object.entries(preset.colors)) {
    root.style.setProperty(`--lg-aurora-${key}`, value)
  }

  root.style.setProperty('--lg-brand', accent.color)
  root.style.setProperty('--lg-brand-deep', accent.deep)
  root.style.setProperty('--lg-brand-gradient', `linear-gradient(135deg, ${accent.color} 0%, ${accent.deep} 100%)`)

  for (const [key, value] of Object.entries(glass.variables)) {
    root.style.setProperty(key, value)
  }

  root.style.setProperty('--lg-radius', corner.base)
  root.style.setProperty('--lg-radius-sm', corner.small)
  root.style.setProperty('--lg-radius-lg', corner.large)
  root.style.setProperty('--lg-font', fontStack.value)

  root.dataset.background = state.background
  root.dataset.glass = state.glass
  root.dataset.motion = state.motion
  root.dataset.font = state.font
}

function persistAppearance() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 忽略无痕模式等场景下的写入失败
  }
}

export function resetAppearance() {
  Object.assign(state, DEFAULT_STATE)
}

export function useAppearance() {
  return {
    appearance: state,
    preset: currentPreset,
    accent: currentAccent,
    glass: currentGlass,
    corner: currentCorner,
    fontStack,
    accentColor: computed(() => currentAccent.value.color),
    radiusToken: computed(() => currentCorner.value.token),
    resetAppearance,
  }
}

watch(
  state,
  () => {
    applyAppearance()
    persistAppearance()
  },
  { deep: true }
)

applyAppearance()
