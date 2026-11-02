<template>
  <div class="settings-page">
    <header class="settings-hero">
      <span class="settings-hero__icon">
        <SettingOutlined />
      </span>
      <div>
        <h1>面板设置</h1>
        <p>调整面板外观，管理账号与登录安全</p>
      </div>
    </header>

    <nav class="settings-nav" role="tablist" aria-label="设置分类">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="settings-nav__tab"
        :class="{ active: activeKey === tab.key }"
        role="tab"
        :aria-selected="activeKey === tab.key"
        @click="navigate(tab)"
      >
        <component :is="tab.icon" class="settings-nav__icon" />
        <span>{{ tab.label }}</span>
      </button>
    </nav>

    <div class="settings-content">
      <router-view v-slot="{ Component }">
        <transition name="settings-fade" mode="out-in">
          <component :is="Component" :key="route.name" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BgColorsOutlined, SafetyCertificateOutlined, SettingOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const tabs = [
  {
    key: 'appearance',
    label: '外观',
    route: 'settingsAppearance',
    icon: BgColorsOutlined,
  },
  {
    key: 'security',
    label: '安全',
    route: 'settingsSecurity',
    icon: SafetyCertificateOutlined,
  },
]

const activeKey = computed(() => (route.name === 'settingsSecurity' ? 'security' : 'appearance'))

const navigate = (tab) => {
  if (route.name !== tab.route) {
    router.push({ name: tab.route }).then(() => {
      window.scrollTo({ top: 0, behavior: 'auto' })
    })
  }
}
</script>
