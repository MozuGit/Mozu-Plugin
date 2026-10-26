<template>
  <div class="settings-panel-page appearance-page">
    <div class="panel-heading">
      <div class="panel-heading__main">
        <span class="panel-heading__icon">
          <BgColorsOutlined />
        </span>
        <div>
          <h2>外观</h2>
          <p>调整面板的配色与质感，所有改动都会立即生效</p>
        </div>
      </div>
      <a-popconfirm title="恢复默认外观设置？" ok-text="恢复" cancel-text="取消" @confirm="handleReset">
        <a-button class="reset-btn">
          <template #icon>
            <ReloadOutlined />
          </template>
          恢复默认
        </a-button>
      </a-popconfirm>
    </div>

    <section class="settings-section lg-glass">
      <div class="section-head">
        <span class="section-icon">
          <BgColorsOutlined />
        </span>
        <div class="section-head__copy">
          <h3>主题</h3>
          <p>选择液态玻璃的极光配色，为面板换一种氛围</p>
        </div>
        <span class="section-note">{{ currentPreset.name }}</span>
      </div>

      <div class="section-body">
        <div class="preset-grid" role="radiogroup" aria-label="主题配色">
          <button
            v-for="preset in THEME_PRESETS"
            :key="preset.id"
            type="button"
            class="preset-tile"
            :class="{ active: appearance.preset === preset.id }"
            role="radio"
            :aria-checked="appearance.preset === preset.id"
            @click="appearance.preset = preset.id"
          >
            <span class="preset-dots">
              <i v-for="dot in preset.dots" :key="dot" :style="{ backgroundColor: dot }" />
            </span>
            <span class="preset-name">{{ preset.name }}</span>
            <span v-if="appearance.preset === preset.id" class="preset-check">
              <CheckOutlined />
            </span>
          </button>
        </div>
      </div>
    </section>

    <section class="settings-section lg-glass">
      <div class="section-head">
        <span class="section-icon">
          <HighlightOutlined />
        </span>
        <div class="section-head__copy">
          <h3>强调色</h3>
          <p>用于按钮、链接与高亮状态，和主题配色相互映衬</p>
        </div>
        <span class="section-note">当前：{{ currentAccent.name }}</span>
      </div>

      <div class="section-body">
        <div class="swatch-row" role="radiogroup" aria-label="强调色">
          <button
            v-for="accentOption in ACCENT_COLORS"
            :key="accentOption.id"
            type="button"
            class="swatch"
            :class="{ active: appearance.accent === accentOption.id }"
            :style="{ '--swatch-color': accentOption.color, '--swatch-deep': accentOption.deep }"
            role="radio"
            :aria-checked="appearance.accent === accentOption.id"
            :aria-label="accentOption.name"
            @click="appearance.accent = accentOption.id"
          >
            <span class="swatch__fill" />
            <CheckOutlined v-if="appearance.accent === accentOption.id" class="swatch__check" />
          </button>
        </div>
      </div>
    </section>

    <section class="settings-section lg-glass">
      <div class="section-head">
        <span class="section-icon">
          <PictureOutlined />
        </span>
        <div class="section-head__copy">
          <h3>背景</h3>
          <p>控制页面底层的氛围光效，不会影响卡片内容</p>
        </div>
      </div>

      <div class="section-body">
        <div class="background-grid" role="radiogroup" aria-label="背景样式">
          <button
            v-for="background in BACKGROUND_STYLES"
            :key="background.id"
            type="button"
            class="background-tile"
            :class="{ active: appearance.background === background.id }"
            role="radio"
            :aria-checked="appearance.background === background.id"
            @click="appearance.background = background.id"
          >
            <span class="background-preview" :class="`background-preview--${background.id}`" />
            <span class="background-meta">
              <strong>{{ background.name }}</strong>
              <small>{{ background.description }}</small>
            </span>
            <CheckOutlined v-if="appearance.background === background.id" class="background-check" />
          </button>
        </div>
      </div>
    </section>

    <section class="settings-section lg-glass">
      <div class="section-head">
        <span class="section-icon">
          <FontSizeOutlined />
        </span>
        <div class="section-head__copy">
          <h3>排版与界面</h3>
          <p>调整字体、圆角与玻璃质感，让界面更贴合你的阅读习惯</p>
        </div>
      </div>

      <div class="settings-rows">
        <div class="settings-row">
          <div class="row-copy">
            <div class="row-title">界面字体</div>
            <div class="row-desc">默认使用插件内置的 Loli 字体，也可以切换为系统字体</div>
          </div>
          <div class="row-control">
            <div class="pill-group">
              <button
                v-for="font in FONT_STYLES"
                :key="font.id"
                type="button"
                class="pill"
                :class="{ active: appearance.font === font.id }"
                @click="appearance.font = font.id"
              >
                {{ font.name }}
              </button>
            </div>
          </div>
        </div>

        <div class="settings-row">
          <div class="row-copy">
            <div class="row-title">界面圆角</div>
            <div class="row-desc">统一调整卡片、弹窗与控件的圆角幅度</div>
          </div>
          <div class="row-control">
            <div class="pill-group">
              <button
                v-for="corner in CORNER_STYLES"
                :key="corner.id"
                type="button"
                class="pill"
                :class="{ active: appearance.corner === corner.id }"
                @click="appearance.corner = corner.id"
              >
                {{ corner.name }}
              </button>
            </div>
          </div>
        </div>

        <div class="settings-row">
          <div class="row-copy">
            <div class="row-title">玻璃质感</div>
            <div class="row-desc">通透更轻盈，柔雾更朦胧，实色则更容易阅读</div>
          </div>
          <div class="row-control">
            <div class="pill-group">
              <button
                v-for="glassStyle in GLASS_STYLES"
                :key="glassStyle.id"
                type="button"
                class="pill"
                :class="{ active: appearance.glass === glassStyle.id }"
                @click="appearance.glass = glassStyle.id"
              >
                {{ glassStyle.name }}
              </button>
            </div>
          </div>
        </div>

        <div class="settings-row">
          <div class="row-copy">
            <div class="row-title">界面动效</div>
            <div class="row-desc">减弱或关闭光晕、悬浮与入场动画，适合偏好安静界面的用户</div>
          </div>
          <div class="row-control">
            <div class="pill-group">
              <button
                v-for="motion in MOTION_STYLES"
                :key="motion.id"
                type="button"
                class="pill"
                :class="{ active: appearance.motion === motion.id }"
                @click="appearance.motion = motion.id"
              >
                {{ motion.name }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <p class="settings-footnote">
      <InfoCircleOutlined />
      外观偏好保存在当前浏览器，切换设备后需要重新调整
    </p>
  </div>
</template>

<script setup>
import { message } from 'ant-design-vue'
import {
  BgColorsOutlined,
  CheckOutlined,
  FontSizeOutlined,
  HighlightOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'
import {
  ACCENT_COLORS,
  BACKGROUND_STYLES,
  CORNER_STYLES,
  FONT_STYLES,
  GLASS_STYLES,
  MOTION_STYLES,
  THEME_PRESETS,
  useAppearance,
} from '../../composables/useAppearance'

const { appearance, preset: currentPreset, accent: currentAccent, resetAppearance } = useAppearance()

const handleReset = () => {
  resetAppearance()
  message.success('已恢复默认外观')
}
</script>

<style scoped>
.reset-btn {
  height: 36px;
  border-radius: 10px;
}

.section-note {
  align-self: center;
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--lg-text-muted);
  background: rgba(255, 255, 255, 0.38);
  border: 1px solid rgba(255, 255, 255, 0.55);
  white-space: nowrap;
}

/* 主题配色 */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.preset-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 8px 9px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.34);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.preset-tile:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(var(--lg-aurora-violet), 0.4);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 6px 18px rgba(39, 52, 105, 0.12);
}

.preset-tile.active {
  border-color: rgba(var(--lg-aurora-violet), 0.72);
  background: rgba(255, 255, 255, 0.62);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 0 0 3px rgba(var(--lg-aurora-violet), 0.12),
    0 6px 18px rgba(var(--lg-aurora-violet), 0.16);
}

.preset-dots {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 4px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.46);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.preset-dots i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.preset-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--lg-text-secondary);
  line-height: 1;
}

.preset-tile.active .preset-name {
  color: var(--lg-brand);
}

.preset-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 9px;
  color: #fff;
  background: var(--lg-brand-gradient);
  box-shadow: 0 2px 6px rgba(var(--lg-aurora-violet), 0.35);
}

/* 强调色 */
.swatch-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.swatch {
  position: relative;
  width: 38px;
  height: 38px;
  padding: 3px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.swatch:hover {
  transform: translateY(-2px) scale(1.04);
}

.swatch.active {
  border-color: var(--lg-brand);
  box-shadow: 0 0 0 3px rgba(var(--lg-aurora-violet), 0.12);
}

.swatch__fill {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--swatch-color), var(--swatch-deep));
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.5),
    0 2px 6px rgba(39, 52, 105, 0.16);
}

.swatch__check {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 14px;
  height: 14px;
  color: #fff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

/* 背景 */
.background-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  max-width: 520px;
}

.background-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border-radius: 13px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.34);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.background-tile:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(var(--lg-aurora-violet), 0.4);
}

.background-tile.active {
  border-color: rgba(var(--lg-aurora-violet), 0.72);
  background: rgba(255, 255, 255, 0.6);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 0 0 3px rgba(var(--lg-aurora-violet), 0.1);
}

.background-preview {
  display: block;
  width: 100%;
  height: 48px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.65);
}

.background-preview--aurora {
  background:
    radial-gradient(circle at 24% 28%, rgba(var(--lg-aurora-cyan), 0.78), transparent 45%),
    radial-gradient(circle at 78% 22%, rgba(var(--lg-aurora-violet), 0.72), transparent 48%),
    radial-gradient(circle at 64% 84%, rgba(var(--lg-aurora-pink), 0.6), transparent 52%), #eef3ff;
}

.background-preview--gradient {
  background:
    radial-gradient(80% 90% at 18% 8%, rgba(var(--lg-aurora-cyan), 0.3), transparent 62%),
    radial-gradient(80% 90% at 88% 96%, rgba(var(--lg-aurora-violet), 0.24), transparent 64%),
    linear-gradient(150deg, #f9fbff 0%, #eef2fb 55%, #f4f7ff 100%);
}

.background-preview--solid {
  background: #e3eaf8;
}

.background-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0 2px 2px;
}

.background-meta strong {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--lg-text-secondary);
}

.background-meta small {
  font-size: 11px;
  color: var(--lg-text-muted);
}

.background-check {
  position: absolute;
  top: 13px;
  right: 13px;
  width: 16px;
  height: 16px;
  padding: 3px;
  border-radius: 50%;
  color: #fff;
  background: var(--lg-brand-gradient);
  box-shadow: 0 2px 6px rgba(var(--lg-aurora-violet), 0.3);
}

@media (max-width: 768px) {
  .reset-btn {
    height: 34px;
    padding: 0 10px;
    font-size: 12px;
  }

  .section-note {
    display: none;
  }

  .preset-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .preset-tile {
    padding: 9px 6px 8px;
  }

  .preset-dots {
    gap: 5px;
    padding: 8px 4px;
  }

  .preset-dots i {
    width: 7px;
    height: 7px;
  }

  .swatch-row {
    gap: 10px;
  }

  .swatch {
    width: 36px;
    height: 36px;
  }

  .background-grid {
    max-width: none;
  }

  .background-preview {
    height: 42px;
  }
}

@media (max-width: 520px) {
  .panel-heading {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .reset-btn {
    align-self: flex-start;
  }

  .preset-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .background-meta small {
    display: none;
  }
}
</style>
