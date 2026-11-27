<template>
  <a-config-provider :auto-insert-space-in-button="false" :theme="configTheme">
    <div class="panel-page config-page">
      <div class="panel-heading">
        <div class="panel-heading__main">
          <span class="panel-heading__icon">
            <SettingOutlined />
          </span>
          <div>
            <h2>修仙配置</h2>
            <p>修仙玩法、境界、妖兽、宗门与秘境参数</p>
          </div>
        </div>
        <div class="panel-heading__actions">
          <span v-if="lastLoadedAt" class="panel-meta">更新于 {{ lastLoadedAt }}</span>
          <a-button class="refresh-btn" :loading="loading" @click="handleRefresh">
            <template #icon>
              <ReloadOutlined />
            </template>
            刷新
          </a-button>
        </div>
      </div>

      <section class="config-sheet">
        <div v-if="loading" class="config-loading">
          <a-skeleton active :paragraph="{ rows: 16 }" />
        </div>

        <div v-else-if="elements.length === 0" class="config-empty">
          <a-empty description="暂无配置项" />
        </div>

        <div v-else class="config-body">
          <section v-for="section in sections" :key="section.key" class="config-section">
            <h3 v-if="section.title" class="config-section__title">{{ section.title }}</h3>

            <div class="config-section__rows">
              <template v-for="element in section.items" :key="element.field || element.label">
                <div v-if="element.component === 'GButtons'" class="config-row">
                  <div class="config-row__label">{{ element.label }}</div>
                  <div class="config-row__control">
                    <a-button danger @click="resetModalVisible = true">
                      <template #icon>
                        <DeleteOutlined />
                      </template>
                      重置
                    </a-button>
                  </div>
                </div>

                <div v-else-if="element.component === 'GSubForm'" class="config-row">
                  <div class="config-row__label">
                    <span v-if="element.required" class="config-required">*</span>{{ element.label }}
                  </div>
                  <div class="config-row__control">
                    <div
                      class="config-subform"
                      :class="element.componentProps?.multiple ? 'config-subform--list' : 'config-subform--object'"
                      role="button"
                      tabindex="0"
                      @click="openSubForm(element)"
                      @keydown.enter.prevent="openSubForm(element)"
                      @keydown.space.prevent="openSubForm(element)"
                    >
                      <template v-if="element.componentProps?.multiple">
                        <span class="config-subform__count">
                          已配置 <b>{{ arrayValue(element).length }}</b> 项
                        </span>
                      </template>
                      <template v-else>
                        <div v-if="hasObjectData(element)" class="config-subform__grid">
                          <template v-for="sub in subSchemas(element)" :key="sub.field">
                            <span class="config-subform__key">{{ sub.label }}</span>
                            <span class="config-subform__value">{{
                              previewField(objectValue(element)[sub.field], sub)
                            }}</span>
                          </template>
                        </div>
                        <span v-else class="config-subform__empty">未配置，点击编辑</span>
                      </template>
                      <span class="config-subform__edit"> <EditOutlined /> 编辑 </span>
                    </div>
                    <p v-if="element.bottomHelpMessage" class="config-hint">{{ element.bottomHelpMessage }}</p>
                  </div>
                </div>

                <div v-else class="config-row">
                  <div class="config-row__label">
                    <span v-if="element.required" class="config-required">*</span>{{ element.label }}
                  </div>
                  <div class="config-row__control">
                    <a-switch
                      v-if="element.component === 'Switch'"
                      :checked="!!formData[element.field]"
                      @update:checked="(value) => (formData[element.field] = value)"
                    />
                    <a-input-number
                      v-else-if="element.component === 'InputNumber'"
                      v-model:value="formData[element.field]"
                      v-bind="fieldProps(element)"
                      :controls="false"
                      :style="{ width: numberWidth(element) }"
                    />
                    <a-input
                      v-else-if="element.component === 'Input'"
                      v-model:value="formData[element.field]"
                      v-bind="fieldProps(element)"
                      allow-clear
                    />
                    <a-radio-group
                      v-else-if="element.component === 'RadioGroup'"
                      v-model:value="formData[element.field]"
                      :options="element.componentProps?.options || []"
                    />
                    <a-select
                      v-else-if="element.component === 'Select'"
                      v-model:value="formData[element.field]"
                      v-bind="fieldProps(element)"
                      :options="element.componentProps?.options || []"
                      allow-clear
                      popup-class-name="config-select-popup"
                      style="width: 100%"
                    />
                    <div v-else-if="element.component === 'GSelectGroup'" class="config-inline-field">
                      <a-select
                        :ref="(component) => setGroupRef(element.field, component)"
                        v-model:value="formData[element.field]"
                        :max-tag-count="4"
                        :open="!!groupOpen[element.field]"
                        :options="groupOptions"
                        mode="multiple"
                        placeholder="请选择群"
                        popup-class-name="config-select-popup"
                        @dropdownVisibleChange="(open) => (groupOpen[element.field] = open)"
                      />
                      <a-button type="primary" class="config-pick-btn" @click="openGroupSelect(element.field)">
                        <template #icon>
                          <SearchOutlined />
                        </template>
                        选择
                      </a-button>
                    </div>
                    <a-select
                      v-else-if="element.component === 'GTags'"
                      v-model:value="formData[element.field]"
                      mode="tags"
                      placeholder="输入后按回车添加"
                      popup-class-name="config-select-popup"
                      style="width: 100%"
                    />
                    <div v-else-if="element.component === 'EasyCron'" class="config-inline-field">
                      <a-input
                        v-model:value="formData[element.field]"
                        v-bind="fieldProps(element)"
                        class="config-cron-input"
                      />
                      <a-dropdown trigger="click">
                        <a-button class="config-cron-pick">
                          <template #icon>
                            <ClockCircleOutlined />
                          </template>
                          选择
                        </a-button>
                        <template #overlay>
                          <a-menu @click="(info) => applyCron(element, info.key)">
                            <a-menu-item v-for="preset in cronPresets" :key="preset.key">
                              {{ preset.label }}
                            </a-menu-item>
                          </a-menu>
                        </template>
                      </a-dropdown>
                    </div>
                    <span v-else class="config-unsupported">暂不支持 {{ element.component }}</span>

                    <p v-if="element.bottomHelpMessage" class="config-hint">{{ element.bottomHelpMessage }}</p>
                  </div>
                </div>
              </template>
            </div>
          </section>
        </div>

        <footer v-if="!loading && elements.length > 0" class="config-savebar">
          <span class="config-savebar__state">
            <span class="state-dot" :class="{ 'is-dirty': dirty }"></span>
            {{ dirty ? '有未保存的修改' : '配置已同步' }}
          </span>
          <a-button type="primary" size="large" class="config-save-btn" :loading="saving" @click="handleSave">
            <template #icon>
              <SaveOutlined />
            </template>
            保存配置
          </a-button>
        </footer>
      </section>
    </div>

    <a-modal
      v-model:open="editorVisible"
      class="config-editor-modal"
      :destroy-on-close="true"
      :mask-closable="false"
      :width="editorWidth"
      @cancel="closeEditor"
    >
      <template #title>
        <div class="editor-head">
          <span class="editor-head__title">{{ currentFrame?.title || '配置' }}</span>
          <span v-if="editorTrail" class="editor-head__trail">{{ editorTrail }}</span>
        </div>
      </template>

      <div v-if="currentFrame" class="editor-body">
        <div v-if="currentFrame.kind === 'array'" class="editor-array">
          <div class="editor-array__meta">共 {{ currentFrame.data.length }} 项配置</div>

          <div v-if="currentFrame.data.length === 0" class="editor-array__empty">
            <a-empty description="暂无配置，点击下方添加" />
          </div>

          <div
            v-for="(item, index) in currentFrame.data"
            :key="`${index}-${item?.id ?? item?.name ?? ''}`"
            class="editor-array__item"
          >
            <div class="editor-array__main">
              <span class="editor-array__index">{{ index + 1 }}</span>
              <div class="editor-array__copy">
                <div class="editor-array__name">{{ arrayItemName(item, index) }}</div>
                <div class="editor-array__summary">{{ arrayItemSummary(item) }}</div>
              </div>
            </div>
            <div class="editor-array__actions">
              <a-button size="small" type="text" @click="editArrayItem(index)">
                <EditOutlined />
                编辑
              </a-button>
              <a-popconfirm
                cancel-text="取消"
                ok-text="删除"
                title="确定删除这一项吗？"
                @confirm="removeArrayItem(index)"
              >
                <a-button danger size="small" type="text">
                  <DeleteOutlined />
                </a-button>
              </a-popconfirm>
            </div>
          </div>

          <a-button block class="editor-array__add" @click="addArrayItem">
            <template #icon>
              <PlusOutlined />
            </template>
            添加配置
          </a-button>
        </div>

        <a-form
          v-else
          :key="editorFormKey"
          ref="editorFormRef"
          :label-col="editorLabelCol"
          :model="currentFrame.data"
          :wrapper-col="editorWrapperCol"
          layout="horizontal"
        >
          <template v-for="schema in currentFrame.schemas" :key="schema.field">
            <a-form-item v-if="schema.component === 'GSubForm'" :extra="schema.bottomHelpMessage" :label="schema.label">
              <div
                class="config-subform"
                :class="schema.componentProps?.multiple ? 'config-subform--list' : 'config-subform--object'"
                role="button"
                tabindex="0"
                @click="openNestedSubForm(schema)"
                @keydown.enter.prevent="openNestedSubForm(schema)"
                @keydown.space.prevent="openNestedSubForm(schema)"
              >
                <template v-if="schema.componentProps?.multiple">
                  <span class="config-subform__count">
                    已配置 <b>{{ frameArrayCount(schema) }}</b> 项
                  </span>
                </template>
                <template v-else>
                  <div v-if="frameHasObjectData(schema)" class="config-subform__grid">
                    <template v-for="sub in subSchemas(schema)" :key="sub.field">
                      <span class="config-subform__key">{{ sub.label }}</span>
                      <span class="config-subform__value">{{
                        previewField((currentFrame.data[schema.field] || {})[sub.field], sub)
                      }}</span>
                    </template>
                  </div>
                  <span v-else class="config-subform__empty">未配置，点击编辑</span>
                </template>
                <span class="config-subform__edit"> <EditOutlined /> 编辑 </span>
              </div>
            </a-form-item>

            <a-form-item
              v-else
              :extra="schema.bottomHelpMessage"
              :label="schema.label"
              :name="schema.field"
              :rules="rulesFor(schema)"
            >
              <a-switch v-if="schema.component === 'Switch'" v-model:checked="currentFrame.data[schema.field]" />
              <a-input-number
                v-else-if="schema.component === 'InputNumber'"
                v-model:value="currentFrame.data[schema.field]"
                v-bind="fieldProps(schema)"
                :controls="false"
                :style="{ width: numberWidth(schema) }"
              />
              <a-input
                v-else-if="schema.component === 'Input'"
                v-model:value="currentFrame.data[schema.field]"
                v-bind="fieldProps(schema)"
                allow-clear
              />
              <a-radio-group
                v-else-if="schema.component === 'RadioGroup'"
                v-model:value="currentFrame.data[schema.field]"
                :options="schema.componentProps?.options || []"
              />
              <a-select
                v-else-if="schema.component === 'Select'"
                v-model:value="currentFrame.data[schema.field]"
                v-bind="fieldProps(schema)"
                :options="schema.componentProps?.options || []"
                allow-clear
                popup-class-name="config-select-popup"
                style="width: 100%"
              />
              <div v-else-if="schema.component === 'GSelectGroup'" class="config-inline-field">
                <a-select
                  :ref="(component) => setGroupRef(`editor:${schema.field}`, component)"
                  v-model:value="currentFrame.data[schema.field]"
                  :max-tag-count="4"
                  :open="!!groupOpen[`editor:${schema.field}`]"
                  :options="groupOptions"
                  mode="multiple"
                  placeholder="请选择群"
                  popup-class-name="config-select-popup"
                  @dropdownVisibleChange="(open) => (groupOpen[`editor:${schema.field}`] = open)"
                />
                <a-button type="primary" class="config-pick-btn" @click="openGroupSelect(`editor:${schema.field}`)">
                  <template #icon>
                    <SearchOutlined />
                  </template>
                  选择
                </a-button>
              </div>
              <a-select
                v-else-if="schema.component === 'GTags'"
                v-model:value="currentFrame.data[schema.field]"
                mode="tags"
                placeholder="输入后按回车添加"
                popup-class-name="config-select-popup"
                style="width: 100%"
              />
              <div v-else-if="schema.component === 'EasyCron'" class="config-inline-field">
                <a-input
                  v-model:value="currentFrame.data[schema.field]"
                  v-bind="fieldProps(schema)"
                  class="config-cron-input"
                />
                <a-dropdown trigger="click">
                  <a-button class="config-cron-pick">
                    <template #icon>
                      <ClockCircleOutlined />
                    </template>
                    选择
                  </a-button>
                  <template #overlay>
                    <a-menu @click="(info) => (currentFrame.data[schema.field] = info.key)">
                      <a-menu-item v-for="preset in cronPresets" :key="preset.key">
                        {{ preset.label }}
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>
              <span v-else class="config-unsupported">暂不支持 {{ schema.component }}</span>
            </a-form-item>
          </template>
        </a-form>
      </div>

      <template #footer>
        <div class="editor-footer">
          <a-button @click="handleEditorCancel">
            <template v-if="editorStack.length > 1" #icon>
              <ArrowLeftOutlined />
            </template>
            {{ editorStack.length > 1 ? '返回' : '取消' }}
          </a-button>
          <a-button type="primary" @click="submitEditor">
            {{ currentFrame?.kind === 'array' ? '保存' : '确定' }}
          </a-button>
        </div>
      </template>
    </a-modal>

    <a-modal
      v-model:open="resetModalVisible"
      cancel-text="取消"
      ok-text="确认重置"
      title="确认重置"
      @cancel="resetModalVisible = false"
      @ok="handleResetConfirm"
    >
      <p class="reset-warning">⚠️ 确认重置所有修仙配置吗？</p>
      <p class="reset-desc">此操作不可撤销，所有配置将恢复为默认值。</p>
      <template #footer>
        <div class="editor-footer">
          <a-button @click="resetModalVisible = false">取消</a-button>
          <a-button :loading="resetLoading" danger type="primary" @click="handleResetConfirm">确认重置</a-button>
        </div>
      </template>
    </a-modal>
  </a-config-provider>
</template>

<script setup>
import { computed, nextTick, onActivated, onMounted, reactive, ref, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined
} from '@ant-design/icons-vue'
import { requestRaw } from '../../api/http'
import { useAuthGuard } from '../../composables/useAuthGuard'
import { useMobile } from '../../composables/useMobile'

const { ensureAuth } = useAuthGuard()
const { isMobile } = useMobile()

const configTheme = {
  token: {
    colorPrimary: '#4a7df0',
    colorInfo: '#4a7df0',
    colorLink: '#4a7df0',
    borderRadius: 4,
    controlHeight: 34,
    fontSize: 14
  }
}

const cronPresets = [
  { key: '0 0 * * * *', label: '每小时整点' },
  { key: '0 0 0 * * *', label: '每天 00:00' },
  { key: '0 0 8 * * *', label: '每天 08:00' },
  { key: '0 0 0 * * 1', label: '每周一 00:00' },
  { key: '0 0 0 1 * *', label: '每月 1 日 00:00' }
]

const elements = ref([])
const loading = ref(false)
const saving = ref(false)
const lastLoadedAt = ref('')
const dirty = ref(false)
const configElementsCache = ref(null)
const formData = reactive({})

const groupOptions = ref([])
const groupOpen = reactive({})
const groupSelectRefs = new Map()

const resetModalVisible = ref(false)
const resetLoading = ref(false)

const editorVisible = ref(false)
const editorStack = reactive([])
const editorFormRef = ref()

let savedSnapshot = ''

const currentFrame = computed(() => editorStack[editorStack.length - 1] || null)
const editorWidth = computed(() => (currentFrame.value?.kind === 'array' ? 760 : 640))
const editorLabelCol = computed(() => (isMobile.value ? { span: 24 } : { style: { width: '156px' } }))
const editorWrapperCol = computed(() => (isMobile.value ? { span: 24 } : { style: { flex: '1 1 auto' } }))
const editorTrail = computed(() =>
  editorStack
    .slice(0, -1)
    .map((frame) => frame.title)
    .filter(Boolean)
    .join(' / ')
)
const editorFormKey = computed(
  () => `${editorStack.length}:${currentFrame.value?.kind || ''}:${currentFrame.value?.title || ''}`
)

const sections = computed(() => {
  const result = []
  let current = null

  for (const element of elements.value) {
    if (element.component === 'SOFT_GROUP_BEGIN') continue

    if (element.component === 'Divider') {
      current = { key: `${element.label}-${result.length}`, title: element.label, items: [] }
      result.push(current)
      continue
    }

    if (!current) {
      current = { key: `section-${result.length}`, title: '', items: [] }
      result.push(current)
    }
    current.items.push(element)
  }

  return result
})

watch(
  formData,
  () => {
    dirty.value = JSON.stringify(formData) !== savedSnapshot
  },
  { deep: true }
)

const nowLabel = () =>
  new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit'
  })

const deepClone = (value) => {
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') return value
  return JSON.parse(JSON.stringify(value))
}

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

function defaultValue(schema) {
  switch (schema?.component) {
    case 'Switch':
      return false
    case 'InputNumber':
      return null
    case 'RadioGroup':
      return schema.componentProps?.options?.[0]?.value ?? null
    case 'GSelectGroup':
    case 'GTags':
      return []
    case 'GSubForm':
      return schema.componentProps?.multiple ? [] : buildDefaults(subSchemas(schema))
    default:
      return ''
  }
}

function buildDefaults(schemas = []) {
  const data = {}
  for (const schema of schemas) {
    if (schema.field) data[schema.field] = defaultValue(schema)
  }
  return data
}

const withDefaults = (schemas, value) => {
  const data = buildDefaults(schemas)
  if (!isPlainObject(value)) return data

  for (const [key, item] of Object.entries(value)) {
    data[key] = deepClone(item)
  }
  return data
}

const subSchemas = (schema) => schema?.componentProps?.schemas || []

const getNestedValue = (object, path) => {
  if (!object || !path) return undefined

  const keys = path.split('.')
  let value = object

  for (const key of keys) {
    if (value === null || value === undefined) break
    if (typeof value !== 'object') return undefined
    value = value[key]
  }

  if (value !== undefined) return value

  if (keys.length > 1 && keys[0] === 'xiuxian') {
    return getNestedValue(object, keys.slice(1).join('.'))
  }

  return undefined
}

const initFormData = (config) => {
  Object.keys(formData).forEach((key) => delete formData[key])

  for (const element of elements.value) {
    if (!element.field || !element.component) continue
    if (['GButtons', 'SOFT_GROUP_BEGIN', 'Divider'].includes(element.component)) continue

    const raw = getNestedValue(config, element.field)

    if (element.component === 'GSubForm') {
      if (element.componentProps?.multiple) {
        formData[element.field] = Array.isArray(raw) ? deepClone(raw) : []
      } else {
        formData[element.field] = isPlainObject(raw) ? deepClone(raw) : buildDefaults(subSchemas(element))
      }
      continue
    }

    formData[element.field] = raw === undefined ? defaultValue(element) : deepClone(raw)
  }

  savedSnapshot = JSON.stringify(formData)
  dirty.value = false
}

const fetchConfigElements = async () => {
  if (configElementsCache.value) return configElementsCache.value

  const response = await requestRaw('/api/xiuxian/config?action=get_config_elements')

  if (response?.success && Array.isArray(response.data?.elements)) {
    configElementsCache.value = response.data.elements
    return response.data.elements
  }

  return []
}

const fetchConfigValues = async () => {
  const response = await requestRaw('/api/xiuxian/config?action=get_config')

  if (response?.success) {
    return response.data?.config || response.data || {}
  }

  return {}
}

const loadAllData = async ({ force = false } = {}) => {
  loading.value = true

  try {
    if (force) configElementsCache.value = null

    const [elementsData, config] = await Promise.all([fetchConfigElements(), fetchConfigValues()])

    elements.value = elementsData || []
    initFormData(config || {})
    lastLoadedAt.value = nowLabel()
  } catch (error) {
    if (error?.message !== '未授权') {
      message.error(`加载修仙配置失败：${error?.message || '未知错误'}`)
    }
  } finally {
    loading.value = false
  }
}

const refreshConfigValues = async (silent = false) => {
  if (!elements.value.length) return

  loading.value = true

  try {
    const config = await fetchConfigValues()
    initFormData(config || {})
    lastLoadedAt.value = nowLabel()
    if (!silent) message.success('配置已刷新')
  } catch (error) {
    if (error?.message !== '未授权') {
      message.error(`刷新配置失败：${error?.message || '未知错误'}`)
    }
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  if (loading.value) return

  if (!dirty.value) {
    refreshConfigValues()
    return
  }

  Modal.confirm({
    cancelText: '取消',
    content: '刷新会重新读取服务端配置，当前未保存的修改将丢失。',
    okText: '刷新',
    onOk: () => refreshConfigValues(),
    title: '放弃未保存的修改？'
  })
}

const fieldProps = (schema) => {
  const { multiple, options, style, ...rest } = schema?.componentProps || {}
  return rest
}

const numberWidth = (schema) => schema?.componentProps?.style?.width || '180px'

const subfieldLabel = (schema) => schema?.label || '该项'

const rulesFor = (schema) => {
  const rules = []
  const label = subfieldLabel(schema)

  if (schema?.required) {
    rules.push({
      required: true,
      message: `请填写${label}`,
      ...(schema.component === 'InputNumber' ? { type: 'number' } : {})
    })
  }

  if (schema?.component === 'InputNumber') {
    const min = schema.componentProps?.min
    const max = schema.componentProps?.max

    if (min !== undefined || max !== undefined) {
      rules.push({
        validator: (_, value) => {
          if (value === null || value === undefined) return Promise.resolve()
          if (typeof value !== 'number' || Number.isNaN(value)) {
            return Promise.reject(new Error(`${label}必须是数字`))
          }
          if (min !== undefined && value < min) {
            return Promise.reject(new Error(`${label}不能小于 ${min}`))
          }
          if (max !== undefined && value > max) {
            return Promise.reject(new Error(`${label}不能大于 ${max}`))
          }
          return Promise.resolve()
        },
        trigger: 'blur'
      })
    }
  }

  return rules
}

const previewField = (value, schema) => {
  if (schema?.component === 'Switch') return value ? '开启' : '关闭'

  if (schema?.component === 'RadioGroup' || schema?.component === 'Select') {
    const options = schema.componentProps?.options || []
    const matched = options.find((option) => String(option.value) === String(value))
    if (matched) return matched.label
    return value === undefined || value === null || value === '' ? '—' : String(value)
  }

  if (schema?.component === 'GSubForm') {
    if (schema.componentProps?.multiple) {
      return `已配置 ${Array.isArray(value) ? value.length : 0} 项`
    }
    if (isPlainObject(value)) {
      return Object.keys(value).length ? JSON.stringify(value) : '—'
    }
  }

  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.length ? value.join('，') : '—'
  if (isPlainObject(value)) return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? '开启' : '关闭'

  return String(value)
}

const arrayValue = (element) => (Array.isArray(formData[element.field]) ? formData[element.field] : [])
const objectValue = (element) => (isPlainObject(formData[element.field]) ? formData[element.field] : {})
const hasObjectData = (element) => Object.keys(objectValue(element)).length > 0

const arrayItemName = (item, index) => {
  const name = item?.name ?? item?.title ?? item?.id
  return name === undefined || name === null || name === '' ? `第 ${index + 1} 项` : String(name)
}

const arrayItemSummary = (item) => {
  if (!currentFrame.value?.schemas) return '暂无详细配置'

  const parts = []

  for (const schema of currentFrame.value.schemas) {
    if (['name', 'title', 'id'].includes(schema.field)) continue
    const text = previewField(item?.[schema.field], schema)
    if (text !== '—') parts.push(`${schema.label} ${text}`)
    if (parts.length === 2) break
  }

  return parts.length ? parts.join(' · ') : '暂无详细配置'
}

const frameArrayCount = (schema) => {
  const value = currentFrame.value?.data?.[schema.field]
  return Array.isArray(value) ? value.length : 0
}

const frameHasObjectData = (schema) => {
  const value = currentFrame.value?.data?.[schema.field]
  return isPlainObject(value) && Object.keys(value).length > 0
}

const pushEditor = (frame) => {
  editorStack.push(frame)
  editorVisible.value = true
}

const openSubForm = (element) => {
  const field = element.field
  const schemas = subSchemas(element)
  const title = element.componentProps?.modalProps?.title || element.label || '配置'

  if (element.componentProps?.multiple) {
    pushEditor({
      apply: (value) => {
        formData[field] = deepClone(value)
      },
      data: deepClone(arrayValue(element)),
      kind: 'array',
      schemas,
      title
    })
    return
  }

  pushEditor({
    apply: (value) => {
      formData[field] = deepClone(value)
    },
    data: withDefaults(schemas, formData[field]),
    kind: 'object',
    schemas,
    title
  })
}

const openNestedSubForm = (schema) => {
  const frame = currentFrame.value
  if (!frame || !isPlainObject(frame.data)) return

  const schemas = subSchemas(schema)
  const title = schema.componentProps?.modalProps?.title || schema.label || '配置'

  if (schema.componentProps?.multiple) {
    const current = Array.isArray(frame.data[schema.field]) ? frame.data[schema.field] : []
    pushEditor({
      apply: (value) => {
        frame.data[schema.field] = deepClone(value)
      },
      data: deepClone(current),
      kind: 'array',
      schemas,
      title
    })
    return
  }

  pushEditor({
    apply: (value) => {
      frame.data[schema.field] = deepClone(value)
    },
    data: withDefaults(schemas, frame.data[schema.field]),
    kind: 'object',
    schemas,
    title
  })
}

const editArrayItem = (index, options = {}) => {
  const frame = currentFrame.value
  if (!frame || frame.kind !== 'array') return

  const item = frame.data[index]
  const schemas = frame.schemas

  pushEditor({
    apply: (value) => {
      frame.data[index] = deepClone(value)
    },
    data: withDefaults(schemas, item),
    isNew: Boolean(options.isNew),
    kind: 'object',
    newIndex: index,
    schemas,
    title: arrayItemName(item, index)
  })
}

const addArrayItem = () => {
  const frame = currentFrame.value
  if (!frame || frame.kind !== 'array') return

  frame.data.push(buildDefaults(frame.schemas))
  editArrayItem(frame.data.length - 1, { isNew: true })
}

const removeArrayItem = (index) => {
  const frame = currentFrame.value
  if (!frame || frame.kind !== 'array') return
  frame.data.splice(index, 1)
}

const submitEditor = async () => {
  const frame = currentFrame.value
  if (!frame) return

  if (frame.kind === 'object') {
    try {
      await editorFormRef.value?.validate()
    } catch {
      return
    }
  }

  frame.apply(deepClone(frame.data))
  editorStack.pop()

  if (editorStack.length === 0) {
    editorVisible.value = false
    return
  }

  nextTick(() => editorFormRef.value?.clearValidate?.())
}

const handleEditorCancel = () => {
  const frame = currentFrame.value

  if (frame?.isNew && frame.kind === 'object') {
    const parentFrame = editorStack[editorStack.length - 2]
    if (parentFrame?.kind === 'array') {
      parentFrame.data.splice(frame.newIndex, 1)
    }
  }

  if (editorStack.length > 1) {
    editorStack.pop()
    nextTick(() => editorFormRef.value?.clearValidate?.())
    return
  }

  closeEditor()
}

const closeEditor = () => {
  editorVisible.value = false
  editorStack.splice(0, editorStack.length)
  nextTick(() => editorFormRef.value?.clearValidate?.())
}

const setGroupRef = (key, component) => {
  if (component) groupSelectRefs.set(key, component)
  else groupSelectRefs.delete(key)
}

const openGroupSelect = (key) => {
  groupSelectRefs.get(key)?.focus?.()
  groupOpen[key] = true
}

const applyCron = (element, key) => {
  if (key) formData[element.field] = key
}

const handleSave = async () => {
  if (saving.value) return

  saving.value = true

  try {
    const saveData = {}

    for (const [field, value] of Object.entries(formData)) {
      const keys = field.split('.')
      const actualKeys = keys[0] === 'xiuxian' ? keys.slice(1) : keys
      let current = saveData

      for (let index = 0; index < actualKeys.length - 1; index++) {
        const key = actualKeys[index]
        if (!isPlainObject(current[key]) && !Array.isArray(current[key])) {
          current[key] = {}
        }
        current = current[key]
      }

      current[actualKeys[actualKeys.length - 1]] = deepClone(value)
    }

    const payloadSnapshot = JSON.stringify(formData)

    const response = await requestRaw('/api/xiuxian/config?action=save_config', {
      body: JSON.stringify(saveData),
      method: 'POST'
    })

    if (!response?.success) {
      message.error(response?.message || '保存失败')
      return
    }

    savedSnapshot = payloadSnapshot
    dirty.value = JSON.stringify(formData) !== savedSnapshot
    lastLoadedAt.value = nowLabel()
    message.success(response.message || '配置保存成功')
  } catch (error) {
    if (error?.message !== '未授权') {
      message.error(`保存失败：${error?.message || '未知错误'}`)
    }
  } finally {
    saving.value = false
  }
}

const handleResetConfirm = async () => {
  if (resetLoading.value) return

  resetLoading.value = true

  try {
    const response = await requestRaw('/api/xiuxian/config?action=reset', { method: 'POST' })

    if (!response?.success) {
      message.error(response?.message || '重置失败')
      return
    }

    message.success(response.message || '重置成功')
    resetModalVisible.value = false
    await loadAllData({ force: true })
  } catch (error) {
    if (error?.message !== '未授权') {
      message.error(`重置失败：${error?.message || '未知错误'}`)
    }
  } finally {
    resetLoading.value = false
  }
}

const fetchGroups = async () => {
  try {
    const response = await requestRaw('/api/xiuxian/config?action=get_groups')

    if (response?.success && Array.isArray(response.data?.groups)) {
      groupOptions.value = response.data.groups.map((group) => ({
        label: group.name || group.groupId,
        value: group.groupId
      }))
    }
  } catch {}
}

onActivated(() => {
  if (elements.value.length > 0 && !dirty.value) refreshConfigValues(true)
})

onMounted(async () => {
  if (!ensureAuth()) return

  await Promise.all([fetchGroups(), loadAllData()])
})
</script>

<style>
.config-page {
  --cfg-primary: #4a7df0;
  --cfg-primary-deep: #3b6fd4;
  --cfg-text: #303133;
  --cfg-text-secondary: #5c6370;
  --cfg-muted: #9aa0a8;
  --cfg-hint: #b0b4bc;
  --cfg-line: #e9ecf1;
  --cfg-border: #dcdfe6;
  --cfg-soft: #f7f9fc;
}

.config-sheet {
  position: relative;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.92);
  border-radius: 16px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 16px 48px rgba(39, 52, 105, 0.12),
    0 2px 8px rgba(16, 22, 40, 0.04);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
  backdrop-filter: blur(22px) saturate(150%);
}

.config-loading,
.config-empty {
  padding: 34px 44px;
}

.config-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
}

.config-body {
  padding: 4px 44px 18px;
}

.config-section {
  padding-bottom: 2px;
}

.config-section__title {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 30px 0 18px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--cfg-primary-deep);
}

.config-section__title::before {
  content: '';
  width: 56px;
  border-top: 1px solid var(--cfg-line);
}

.config-section__title::after {
  content: '';
  flex: 1;
  border-top: 1px solid var(--cfg-line);
}

.config-section:first-child .config-section__title {
  margin-top: 22px;
}

.config-section__rows {
  padding-bottom: 4px;
}

.config-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 18px;
}

.config-row__label {
  flex: 0 0 188px;
  max-width: 188px;
  padding: 7px 12px 0 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: var(--cfg-text);
  text-align: right;
}

.config-row__label::after {
  content: '：';
}

.config-required {
  margin-right: 2px;
  color: #f53f3f;
  font-family: SimSun, sans-serif;
}

.config-row__control {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 780px;
}

.config-hint {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--cfg-hint);
}

.config-inline-field {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.config-inline-field .ant-select {
  flex: 1 1 auto;
  min-width: 0;
}

.config-inline-field .ant-btn {
  flex: 0 0 auto;
}

.config-cron-input {
  flex: 1 1 auto;
  min-width: 0;
}

.config-pick-btn.ant-btn {
  height: 34px;
  padding: 0 16px;
  box-shadow: none;
}

.config-sheet .ant-btn.config-cron-pick {
  height: 34px;
  color: var(--cfg-primary-deep) !important;
}

.config-unsupported {
  font-size: 13px;
  color: var(--cfg-muted);
}

.config-subform {
  position: relative;
  width: 100%;
  border: 1px solid var(--cfg-border);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.config-subform--list {
  display: flex;
  align-items: center;
  min-height: 34px;
  padding: 5px 14px;
}

.config-subform--object {
  padding: 11px 14px;
  background: var(--cfg-soft);
  border-color: #edf0f4;
}

.config-subform:hover {
  border-color: #a9c2f5;
  box-shadow: 0 0 0 3px rgba(74, 125, 240, 0.06);
}

.config-subform:focus-visible {
  border-color: var(--cfg-primary);
  box-shadow: 0 0 0 3px rgba(74, 125, 240, 0.16);
}

.config-subform__count {
  font-size: 13px;
  color: var(--cfg-text);
}

.config-subform__count b {
  font-weight: 600;
}

.config-subform__grid {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr);
  gap: 6px 14px;
  font-size: 13px;
  line-height: 1.5;
}

.config-subform__key {
  color: var(--cfg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.config-subform__value {
  color: var(--cfg-text-secondary);
  word-break: break-all;
}

.config-subform__empty {
  font-size: 13px;
  color: var(--cfg-muted);
}

.config-subform__edit {
  position: absolute;
  top: 50%;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding-left: 10px;
  font-size: 12px;
  color: var(--cfg-primary);
  background: inherit;
  opacity: 0;
  transform: translateY(-50%);
  transition: opacity 0.18s ease;
}

.config-subform--object .config-subform__edit {
  top: 10px;
  right: 12px;
  transform: none;
}

.config-subform:hover .config-subform__edit,
.config-subform:focus-visible .config-subform__edit {
  opacity: 1;
}

.config-savebar {
  position: sticky;
  bottom: 0;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 66px;
  padding: 12px 44px;
  background: rgba(255, 255, 255, 0.96);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  backdrop-filter: blur(14px) saturate(150%);
  border-top: 1px solid var(--cfg-line);
  border-radius: 0 0 15px 15px;
}

.config-savebar__state {
  position: absolute;
  left: 44px;
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--cfg-muted);
}

.state-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #52c41a;
}

.state-dot.is-dirty {
  background: #faad14;
}

.config-save-btn.ant-btn {
  min-width: 132px;
  height: 38px;
  font-weight: 500;
  box-shadow: 0 5px 14px rgba(74, 125, 240, 0.24);
}

.config-save-btn.ant-btn:hover {
  box-shadow: 0 7px 18px rgba(74, 125, 240, 0.3);
}

.config-sheet .ant-input,
.config-sheet .ant-input-affix-wrapper,
.config-sheet .ant-input-number,
.config-sheet .ant-select:not(.ant-select-customize-input) .ant-select-selector {
  color: var(--cfg-text) !important;
  background: #fff !important;
  border: 1px solid var(--cfg-border) !important;
  border-radius: 4px !important;
  box-shadow: none !important;
}

.config-sheet .ant-input-number {
  padding: 0 11px;
}

.config-sheet .ant-input-number-input {
  color: var(--cfg-text) !important;
  background: transparent !important;
}

.config-sheet .ant-select:not(.ant-select-customize-input) .ant-select-selector {
  padding: 0 11px;
}

.config-sheet .ant-input::placeholder,
.config-sheet .ant-select-selection-placeholder {
  color: #b9bec7 !important;
}

.config-sheet .ant-input:hover,
.config-sheet .ant-input-affix-wrapper:hover,
.config-sheet .ant-input-number:hover,
.config-sheet .ant-select:not(.ant-select-customize-input):hover .ant-select-selector {
  border-color: #a9c2f5 !important;
}

.config-sheet .ant-input:focus,
.config-sheet .ant-input-focused,
.config-sheet .ant-input-affix-wrapper:focus,
.config-sheet .ant-input-affix-wrapper-focused,
.config-sheet .ant-input-affix-wrapper:focus-within,
.config-sheet .ant-input-number-focused,
.config-sheet .ant-select-focused:not(.ant-select-disabled):not(.ant-select-customize-input) .ant-select-selector {
  background: #fff !important;
  border-color: var(--cfg-primary) !important;
  box-shadow: 0 0 0 2px rgba(74, 125, 240, 0.12) !important;
}

.config-sheet .ant-input-affix-wrapper .ant-input {
  border: 0 !important;
  box-shadow: none !important;
}

.config-sheet .ant-btn-default {
  color: var(--cfg-text-secondary) !important;
  background: #fff !important;
  border: 1px solid var(--cfg-border) !important;
  box-shadow: none !important;
}

.config-sheet .ant-btn-default:not(:disabled):hover {
  color: var(--cfg-primary) !important;
  background: #fff !important;
  border-color: var(--cfg-primary) !important;
  transform: none;
  box-shadow: none !important;
}

.config-sheet .ant-btn-primary {
  background: var(--cfg-primary) !important;
  border-color: var(--cfg-primary) !important;
  box-shadow: none;
}

.config-sheet .ant-btn-primary:not(:disabled):hover {
  background: #3f6fdd !important;
  border-color: #3f6fdd !important;
}

.config-sheet .ant-btn-dangerous.ant-btn-default {
  color: #f53f3f !important;
  border-color: #ffc2c2 !important;
  background: #fff !important;
}

.config-sheet .ant-btn-dangerous.ant-btn-default:not(:disabled):hover {
  color: #fff !important;
  background: #f53f3f !important;
  border-color: #f53f3f !important;
}

.config-sheet .ant-btn-dangerous.ant-btn-primary {
  background: #f53f3f !important;
  border-color: #f53f3f !important;
}

.config-sheet .ant-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 22px;
  min-height: 34px;
  align-items: center;
}

.config-sheet .ant-switch {
  margin-top: 5px;
}

.config-select-popup {
  background: #fff !important;
  border: 1px solid #eceef2 !important;
  border-radius: 6px !important;
  box-shadow: 0 8px 24px rgba(24, 32, 60, 0.1) !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}

.config-select-popup .ant-select-item {
  border-radius: 4px;
}

.config-select-popup .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
  color: var(--cfg-primary-deep);
  background: #eef4ff !important;
  font-weight: 500;
}

.config-select-popup .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
  background: #f4f8ff !important;
}

.reset-warning {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: #f53f3f;
}

.reset-desc {
  margin: 0;
  font-size: 13px;
  color: #8b909a;
}

@media (max-width: 768px) {
  .config-body {
    padding: 2px 18px 12px;
  }

  .config-loading,
  .config-empty {
    padding: 24px 18px;
  }

  .config-row {
    flex-direction: column;
    margin-bottom: 16px;
  }

  .config-row__label {
    flex: 0 0 auto;
    max-width: none;
    padding: 0 0 6px;
    text-align: left;
  }

  .config-row__control {
    width: 100%;
    max-width: none;
  }

  .config-section__title::before {
    width: 24px;
  }

  .config-subform__grid {
    grid-template-columns: 96px minmax(0, 1fr);
  }

  .config-subform__edit {
    opacity: 0.55;
  }

  .config-savebar {
    min-height: 60px;
    padding: 10px 18px 10px 76px;
    border-radius: 0 0 15px 15px;
  }

  .config-savebar__state {
    display: none;
  }

  .config-save-btn.ant-btn {
    width: auto;
    min-width: 150px;
  }
}
</style>

<style>
.config-editor-modal .ant-modal-content {
  padding: 0 !important;
  overflow: hidden;
  background: #fff !important;
  background-image: none !important;
  border: 1px solid #eceef2;
  border-radius: 12px !important;
  box-shadow: 0 24px 64px rgba(24, 32, 60, 0.2) !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}

.config-editor-modal .ant-modal-content::before,
.config-editor-modal .ant-modal-content::after {
  display: none !important;
}

.config-editor-modal .ant-modal-header {
  margin: 0 !important;
  padding: 18px 24px 14px !important;
  background: #fff !important;
  border-bottom: 1px solid #f0f2f5 !important;
  border-radius: 12px 12px 0 0 !important;
}

.config-editor-modal .ant-modal-title {
  color: #1f2329 !important;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
}

.config-editor-modal .ant-modal-close {
  top: 16px;
  right: 16px;
  color: #9aa0a8;
}

.config-editor-modal .ant-modal-body {
  max-height: 64vh;
  padding: 20px 24px 8px !important;
  overflow-y: auto;
}

.config-editor-modal .ant-modal-footer {
  margin: 0 !important;
  padding: 12px 24px !important;
  background: #fff;
  border-top: 1px solid #f0f2f5 !important;
  border-radius: 0 0 12px 12px;
}

.config-editor-modal .ant-form-item {
  margin-bottom: 18px;
}

.config-editor-modal .ant-form-item-label > label {
  color: #303133 !important;
  font-weight: 500;
}

.config-editor-modal .ant-form-item-extra {
  padding-top: 4px;
  color: #b0b4bc !important;
  font-size: 12.5px;
  line-height: 1.5;
}

.config-editor-modal .ant-form-item-explain-error {
  font-size: 12px;
}

.config-editor-modal .ant-input,
.config-editor-modal .ant-input-affix-wrapper,
.config-editor-modal .ant-input-number,
.config-editor-modal .ant-select:not(.ant-select-customize-input) .ant-select-selector {
  color: #303133 !important;
  background: #fff !important;
  border: 1px solid #dcdfe6 !important;
  border-radius: 4px !important;
  box-shadow: none !important;
}

.config-editor-modal .ant-input-number {
  padding: 0 11px;
}

.config-editor-modal .ant-input-number-input {
  background: transparent !important;
  color: #303133 !important;
}

.config-editor-modal .ant-input::placeholder,
.config-editor-modal .ant-select-selection-placeholder {
  color: #b9bec7 !important;
}

.config-editor-modal .ant-input:hover,
.config-editor-modal .ant-input-affix-wrapper:hover,
.config-editor-modal .ant-input-number:hover,
.config-editor-modal .ant-select:not(.ant-select-customize-input):hover .ant-select-selector {
  border-color: #a9c2f5 !important;
}

.config-editor-modal .ant-input:focus,
.config-editor-modal .ant-input-focused,
.config-editor-modal .ant-input-affix-wrapper:focus,
.config-editor-modal .ant-input-affix-wrapper-focused,
.config-editor-modal .ant-input-affix-wrapper:focus-within,
.config-editor-modal .ant-input-number-focused,
.config-editor-modal
  .ant-select-focused:not(.ant-select-disabled):not(.ant-select-customize-input)
  .ant-select-selector {
  background: #fff !important;
  border-color: #4a7df0 !important;
  box-shadow: 0 0 0 2px rgba(74, 125, 240, 0.12) !important;
}

.config-editor-modal .ant-input-affix-wrapper .ant-input {
  border: 0 !important;
  box-shadow: none !important;
}

.config-editor-modal .ant-form-item-has-error .ant-input,
.config-editor-modal .ant-form-item-has-error .ant-input-affix-wrapper,
.config-editor-modal .ant-form-item-has-error .ant-input-number,
.config-editor-modal .ant-form-item-has-error .ant-select:not(.ant-select-customize-input) .ant-select-selector {
  border-color: #ff4d4f !important;
}

.config-editor-modal .ant-form-item-has-error .ant-input:focus,
.config-editor-modal .ant-form-item-has-error .ant-input-affix-wrapper:focus,
.config-editor-modal .ant-form-item-has-error .ant-input-number-focused,
.config-editor-modal
  .ant-form-item-has-error
  .ant-select-focused:not(.ant-select-disabled):not(.ant-select-customize-input)
  .ant-select-selector {
  border-color: #ff4d4f !important;
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.12) !important;
}

.config-editor-modal .ant-btn-default {
  color: #4e5969 !important;
  background: #fff !important;
  border: 1px solid #dcdfe6 !important;
  box-shadow: none !important;
}

.config-editor-modal .ant-btn-default:not(:disabled):hover {
  color: #4a7df0 !important;
  background: #fff !important;
  border-color: #4a7df0 !important;
  transform: none;
  box-shadow: none !important;
}

.config-editor-modal .ant-btn-primary {
  background: #4a7df0 !important;
  border-color: #4a7df0 !important;
  box-shadow: none;
}

.config-editor-modal .ant-btn-primary:not(:disabled):hover {
  background: #3f6fdd !important;
  border-color: #3f6fdd !important;
}

.config-editor-modal .ant-btn-dangerous.ant-btn-primary {
  background: #f53f3f !important;
  border-color: #f53f3f !important;
}

.config-editor-modal .ant-btn-text {
  background: transparent !important;
  border-color: transparent !important;
}

.config-editor-modal .ant-btn-text:not(:disabled):hover {
  background: #f4f6fa !important;
}

.config-editor-modal .ant-btn-dangerous.ant-btn-text {
  color: #f53f3f !important;
}

.config-editor-modal .ant-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 22px;
  min-height: 34px;
  align-items: center;
}

.config-editor-modal .ant-switch {
  margin-top: 5px;
}

.editor-head {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-right: 24px;
}

.editor-head__title {
  color: #1f2329;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
}

.editor-head__trail {
  color: #a3a9b3;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
}

.editor-body {
  min-height: 80px;
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.editor-array__meta {
  margin-bottom: 12px;
  color: #9aa0a8;
  font-size: 12.5px;
}

.editor-array__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  margin-bottom: 14px;
  border: 1px dashed #e3e6eb;
  border-radius: 8px;
  background: #fbfcfe;
}

.editor-array__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
  padding: 12px 14px;
  background: #fcfdff;
  border: 1px solid #eceef2;
  border-radius: 8px;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.editor-array__item:hover {
  border-color: #c9d8f7;
  box-shadow: 0 3px 12px rgba(39, 52, 105, 0.06);
}

.editor-array__main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.editor-array__index {
  display: grid;
  flex: 0 0 26px;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #eef4ff;
  color: #4a7df0;
  font-size: 12px;
  font-weight: 600;
}

.editor-array__copy {
  min-width: 0;
}

.editor-array__name {
  color: #303133;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.editor-array__summary {
  max-width: 520px;
  margin-top: 3px;
  overflow: hidden;
  color: #9aa0a8;
  font-size: 12px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-array__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
}

.editor-array__actions .ant-btn-text:not(.ant-btn-dangerous) {
  color: #4a7df0;
}

.editor-array__add.ant-btn {
  height: 38px;
  margin-top: 4px;
  color: #4a7df0 !important;
  background: #fff !important;
  border: 1px dashed #c8d3e6 !important;
  box-shadow: none !important;
}

.editor-array__add.ant-btn:hover {
  color: #3f6fdd !important;
  background: #f7faff !important;
  border-color: #4a7df0 !important;
}

.config-editor-modal .config-subform {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.config-editor-modal .config-subform--object {
  padding: 11px 14px;
  background: #f7f9fc;
  border-color: #edf0f4;
}

.config-editor-modal .config-subform--list {
  display: flex;
  align-items: center;
  min-height: 34px;
  padding: 5px 14px;
}

.config-editor-modal .config-subform:hover {
  border-color: #a9c2f5;
  box-shadow: 0 0 0 3px rgba(74, 125, 240, 0.06);
}

.config-editor-modal .config-subform:focus-visible {
  border-color: #4a7df0;
  box-shadow: 0 0 0 3px rgba(74, 125, 240, 0.16);
}

.config-editor-modal .config-subform__count {
  color: #303133;
  font-size: 13px;
}

.config-editor-modal .config-subform__count b {
  font-weight: 600;
}

.config-editor-modal .config-subform__grid {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 6px 14px;
  font-size: 13px;
  line-height: 1.5;
}

.config-editor-modal .config-subform__key {
  overflow: hidden;
  color: #9aa0a8;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.config-editor-modal .config-subform__value {
  color: #5c6370;
  word-break: break-all;
}

.config-editor-modal .config-subform__empty {
  color: #9aa0a8;
  font-size: 13px;
}

.config-editor-modal .config-subform__edit {
  position: absolute;
  top: 50%;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding-left: 10px;
  color: #4a7df0;
  background: inherit;
  font-size: 12px;
  opacity: 0;
  transform: translateY(-50%);
  transition: opacity 0.18s ease;
}

.config-editor-modal .config-subform--object .config-subform__edit {
  top: 10px;
  right: 12px;
  transform: none;
}

.config-editor-modal .config-subform:hover .config-subform__edit,
.config-editor-modal .config-subform:focus-visible .config-subform__edit {
  opacity: 1;
}

.config-editor-modal .config-inline-field {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.config-editor-modal .config-inline-field .ant-select {
  flex: 1 1 auto;
  min-width: 0;
}

.config-editor-modal .config-cron-input {
  flex: 1 1 auto;
  min-width: 0;
}

.config-editor-modal .config-pick-btn.ant-btn {
  height: 34px;
  padding: 0 16px;
  box-shadow: none;
}

.config-editor-modal .ant-btn.config-cron-pick {
  height: 34px;
  color: #3b6fd4 !important;
}

.config-editor-modal .config-unsupported {
  color: #9aa0a8;
  font-size: 13px;
}

@media (max-width: 768px) {
  .config-editor-modal .ant-modal-body {
    max-height: 68vh;
    padding: 16px 16px 4px !important;
  }

  .config-editor-modal .ant-modal-header {
    padding: 16px 16px 12px !important;
  }

  .config-editor-modal .ant-modal-footer {
    padding: 10px 16px !important;
  }

  .editor-array__summary {
    max-width: 180px;
  }
}
</style>
