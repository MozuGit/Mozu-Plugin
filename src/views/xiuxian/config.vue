<template>
  <div class="config-container">
    <a-card :bordered="false" class="fade-in-card">
      <div class="card-header">
        <span class="card-title">修仙配置</span>
        <div class="header-actions">
          <a-button type="primary" :loading="saving" @click="handleSave" class="save-btn">
            <template #icon><save-outlined /></template>
            保存配置
          </a-button>
          <a-button @click="handleRefresh" :loading="loading">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </div>
      </div>

      <div v-if="loading" class="loading-container">
        <a-spin size="large" tip="加载配置中..." />
      </div>

      <div v-else-if="elements.length === 0" class="empty-container">
        <a-empty description="暂无配置项" />
      </div>

      <div v-else class="config-form">
        <a-form ref="formRef" :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }"
          layout="horizontal">
          <template v-for="element in elements" :key="element.field || element.label">
            <div v-if="element.component === 'SOFT_GROUP_BEGIN'" class="group-title">
              {{ element.label }}
            </div>

            <div v-else-if="element.component === 'Divider'" class="divider-wrapper">
              <a-divider :orientation="element.componentProps?.orientation || 'left'"
                :plain="element.componentProps?.plain !== false">
                {{ element.label }}
              </a-divider>
            </div>

            <a-form-item v-else-if="element.component === 'GButtons'" :label="element.label" class="config-item">
              <a-button v-for="(btn, btnIdx) in element.componentProps?.buttons" :key="btnIdx"
                :type="btn.type || 'default'" :danger="btn.danger" @click="handleButtonAction(btn)"
                style="margin-right: 8px;">
                {{ btn.label }}
              </a-button>
            </a-form-item>

            <a-form-item v-else-if="element.component === 'GSubForm'" :label="element.label"
              :help="element.bottomHelpMessage" class="config-item subform-form-item">
              <div class="subform-card" @click="openSubForm(element)">
                <template v-if="element.componentProps?.multiple">
                  <div class="card-preview">
                    <div class="array-count-preview">
                      <span class="count-number">{{ getArrayData(element.field).length }}</span>
                      <span class="count-text">项</span>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <div v-if="getObjectData(element.field) && Object.keys(getObjectData(element.field)).length > 0"
                    class="card-preview">
                    <div v-for="schema in (element.componentProps?.schemas || []).slice(0, 3)" :key="schema.field"
                      class="preview-item">
                      <span class="preview-label">{{ schema.label }}:</span>
                      <span class="preview-value">{{ formatPreviewValue(getObjectData(element.field)[schema.field],
                        schema) }}</span>
                    </div>
                    <div v-if="(element.componentProps?.schemas || []).length > 3" class="preview-more">
                      还有 {{ element.componentProps.schemas.length - 3 }} 项...
                    </div>
                  </div>
                  <div v-else class="card-empty">点击配置</div>
                </template>

                <div class="card-hint">
                  <edit-outlined /> 点击编辑
                </div>
              </div>
            </a-form-item>

            <a-form-item v-else :label="element.label" :help="element.bottomHelpMessage" :required="element.required"
              class="config-item">
              <template v-if="isNestedObjectType(element)">
                <div class="subform-card" @click="openNestedSubForm(element)">
                  <div v-if="getObjectData(element.field) && Object.keys(getObjectData(element.field)).length > 0"
                    class="card-preview">
                    <div v-for="schema in (getNestedSchemas(element) || []).slice(0, 3)" :key="schema.field"
                      class="preview-item">
                      <span class="preview-label">{{ schema.label }}:</span>
                      <span class="preview-value">{{ formatPreviewValue(getObjectData(element.field)[schema.field],
                        schema) }}</span>
                    </div>
                    <div v-if="(getNestedSchemas(element) || []).length > 3" class="preview-more">
                      还有 {{ getNestedSchemas(element).length - 3 }} 项...
                    </div>
                  </div>
                  <div v-else class="card-empty">点击配置</div>
                  <div class="card-hint">
                    <edit-outlined /> 点击编辑
                  </div>
                </div>
              </template>

              <template v-else>
                <a-switch v-if="element.component === 'Switch'" v-model:checked="formData[element.field]" />
                <a-input-number v-else-if="element.component === 'InputNumber'" v-model:value="formData[element.field]"
                  v-bind="element.componentProps" style="width: 100%;" />
                <a-input v-else-if="element.component === 'Input'" v-model:value="formData[element.field]"
                  v-bind="element.componentProps" />
                <a-radio-group v-else-if="element.component === 'RadioGroup'" v-model:value="formData[element.field]">
                  <a-radio v-for="opt in element.componentProps?.options" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </a-radio>
                </a-radio-group>
                <a-select v-else-if="element.component === 'Select'" v-model:value="formData[element.field]"
                  v-bind="element.componentProps" style="width: 100%;" />
                <a-select v-else-if="element.component === 'GSelectGroup'" v-model:value="formData[element.field]"
                  mode="multiple" placeholder="请选择群" style="width: 100%;">
                  <a-select-option v-for="group in groupOptions" :key="group.value" :value="group.value">
                    {{ group.label }}
                  </a-select-option>
                </a-select>
                <a-select v-else-if="element.component === 'GTags'" v-model:value="formData[element.field]" mode="tags"
                  placeholder="输入后按回车添加" style="width: 100%;" />
                <a-input v-else-if="element.component === 'EasyCron'" v-model:value="formData[element.field]"
                  v-bind="element.componentProps" placeholder="*表示任意，?表示不指定（月日和星期互斥）" />
              </template>
            </a-form-item>
          </template>
        </a-form>
      </div>
    </a-card>

    <a-modal v-model:visible="subFormVisible" :title="subFormTitle" ok-text="确定" cancel-text="取消"
      @ok="handleSubFormSave" @cancel="subFormVisible = false" :confirm-loading="subFormLoading" width="600px"
      :destroyOnClose="true">
      <div v-if="currentSubFormSchemas && currentSubFormSchemas.length > 0" class="sub-form">
        <a-form ref="subFormInnerRef" :model="subFormData" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }"
          layout="horizontal">
          <template v-for="schema in currentSubFormSchemas" :key="schema.field">
            <a-form-item v-if="schema.component === 'GSubForm' || isNestedObjectType(schema)" :label="schema.label"
              :help="schema.bottomHelpMessage">
              <div class="subform-card subform-card-inner" @click="openNestedSubSubForm(schema)">
                <div v-if="subFormData[schema.field] && Object.keys(subFormData[schema.field]).length > 0"
                  class="card-preview">
                  <div v-for="subSchema in (getNestedSchemas(schema) || []).slice(0, 3)" :key="subSchema.field"
                    class="preview-item">
                    <span class="preview-label">{{ subSchema.label }}:</span>
                    <span class="preview-value">{{ formatPreviewValue(subFormData[schema.field]?.[subSchema.field],
                      subSchema) }}</span>
                  </div>
                </div>
                <div v-else class="card-empty">点击配置</div>
                <div class="card-hint">
                  <edit-outlined /> 点击编辑
                </div>
              </div>
            </a-form-item>

            <a-form-item v-else :label="schema.label" :required="schema.required" :help="schema.bottomHelpMessage"
              :rules="getFormItemRules(schema)" :name="schema.field">
              <a-switch v-if="schema.component === 'Switch'" v-model:checked="subFormData[schema.field]" />
              <a-input-number v-else-if="schema.component === 'InputNumber'" v-model:value="subFormData[schema.field]"
                v-bind="schema.componentProps" style="width: 100%;" />
              <a-input v-else-if="schema.component === 'Input'" v-model:value="subFormData[schema.field]"
                v-bind="schema.componentProps" />
              <a-radio-group v-else-if="schema.component === 'RadioGroup'" v-model:value="subFormData[schema.field]">
                <a-radio v-for="opt in schema.componentProps?.options" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </a-radio>
              </a-radio-group>
              <a-select v-else-if="schema.component === 'Select'" v-model:value="subFormData[schema.field]"
                v-bind="schema.componentProps" style="width: 100%;" />
              <a-select v-else-if="schema.component === 'GTags'" v-model:value="subFormData[schema.field]" mode="tags"
                style="width: 100%;" />
              <a-select v-else-if="schema.component === 'GSelectGroup'" v-model:value="subFormData[schema.field]"
                mode="multiple" style="width: 100%;">
                <a-select-option v-for="group in groupOptions" :key="group.value" :value="group.value">
                  {{ group.label }}
                </a-select-option>
              </a-select>
              <a-input v-else-if="schema.component === 'EasyCron'" v-model:value="subFormData[schema.field]"
                placeholder="*表示任意，?表示不指定" />
            </a-form-item>
          </template>
        </a-form>
      </div>
      <div v-else class="sub-form-empty">
        <a-empty description="暂无配置项" />
      </div>
    </a-modal>

    <a-modal v-model:visible="nestedSubFormVisible" :title="nestedSubFormTitle" ok-text="确定" cancel-text="取消"
      @ok="handleNestedSubFormSave" @cancel="nestedSubFormVisible = false" :confirm-loading="nestedSubFormLoading"
      width="600px" :destroyOnClose="true">
      <div v-if="currentNestedSchemas && currentNestedSchemas.length > 0" class="sub-form">
        <a-form ref="nestedFormInnerRef" :model="nestedSubFormData" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }"
          layout="horizontal">
          <template v-for="schema in currentNestedSchemas" :key="schema.field">
            <a-form-item v-if="schema.component === 'GSubForm' || isNestedObjectType(schema)" :label="schema.label"
              :help="schema.bottomHelpMessage">
              <div class="subform-card subform-card-inner" @click="openDeepNestedSubForm(schema, nestedSubFormData)">
                <div v-if="nestedSubFormData[schema.field] && Object.keys(nestedSubFormData[schema.field]).length > 0"
                  class="card-preview">
                  <div v-for="subSchema in (getNestedSchemas(schema) || []).slice(0, 3)" :key="subSchema.field"
                    class="preview-item">
                    <span class="preview-label">{{ subSchema.label }}:</span>
                    <span class="preview-value">{{
                      formatPreviewValue(nestedSubFormData[schema.field]?.[subSchema.field], subSchema) }}</span>
                  </div>
                </div>
                <div v-else class="card-empty">点击配置</div>
                <div class="card-hint">
                  <edit-outlined /> 点击编辑
                </div>
              </div>
            </a-form-item>

            <a-form-item v-else :label="schema.label" :required="schema.required" :help="schema.bottomHelpMessage"
              :rules="getFormItemRules(schema)" :name="schema.field">
              <a-switch v-if="schema.component === 'Switch'" v-model:checked="nestedSubFormData[schema.field]" />
              <a-input-number v-else-if="schema.component === 'InputNumber'"
                v-model:value="nestedSubFormData[schema.field]" v-bind="schema.componentProps" style="width: 100%;" />
              <a-input v-else-if="schema.component === 'Input'" v-model:value="nestedSubFormData[schema.field]"
                v-bind="schema.componentProps" />
              <a-radio-group v-else-if="schema.component === 'RadioGroup'"
                v-model:value="nestedSubFormData[schema.field]">
                <a-radio v-for="opt in schema.componentProps?.options" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </a-radio>
              </a-radio-group>
              <a-select v-else-if="schema.component === 'Select'" v-model:value="nestedSubFormData[schema.field]"
                v-bind="schema.componentProps" style="width: 100%;" />
              <a-select v-else-if="schema.component === 'GTags'" v-model:value="nestedSubFormData[schema.field]"
                mode="tags" style="width: 100%;" />
              <a-select v-else-if="schema.component === 'GSelectGroup'" v-model:value="nestedSubFormData[schema.field]"
                mode="multiple" style="width: 100%;">
                <a-select-option v-for="group in groupOptions" :key="group.value" :value="group.value">
                  {{ group.label }}
                </a-select-option>
              </a-select>
              <a-input v-else-if="schema.component === 'EasyCron'" v-model:value="nestedSubFormData[schema.field]"
                placeholder="*表示任意，?表示不指定" />
            </a-form-item>
          </template>
        </a-form>
      </div>
      <div v-else class="sub-form-empty">
        <a-empty description="暂无配置项" />
      </div>
    </a-modal>

    <a-modal v-model:visible="arraySubFormVisible" :title="arraySubFormTitle" :ok-text="null" :cancel-text="null"
      :footer="null" width="700px" :destroyOnClose="true">
      <div v-if="currentArraySubFormSchemas && currentArraySubFormSchemas.length > 0" class="array-modal-container">
        <div class="array-scroll-area">
          <div v-if="arraySubFormData.length === 0" class="array-empty">
            <a-empty description="暂无数据，点击下方添加" />
          </div>

          <div v-for="(item, itemIdx) in arraySubFormData" :key="itemIdx" class="array-item-card">
            <div class="array-item-header">
              <span class="array-item-title">{{ item.name || getArrayItemDisplayName(item) }}</span>
              <div class="array-item-actions">
                <a-button type="link" size="small" @click="editArrayItem(itemIdx)">
                  <edit-outlined /> 编辑
                </a-button>
                <a-button type="text" danger size="small" @click="removeArrayItem(itemIdx)">
                  <delete-outlined />
                </a-button>
              </div>
            </div>
            <div class="array-item-preview">
              <div v-for="schema in (currentArraySubFormSchemas || []).slice(0, 3)" :key="schema.field"
                class="preview-item">
                <span class="preview-label">{{ schema.label }}:</span>
                <span class="preview-value">{{ formatPreviewValue(item[schema.field], schema) }}</span>
              </div>
              <div v-if="(currentArraySubFormSchemas || []).length > 3" class="preview-more">
                还有 {{ currentArraySubFormSchemas.length - 3 }} 项...
              </div>
            </div>
          </div>
        </div>

        <div class="array-footer">
          <a-button type="primary" @click="addArrayItemAndEdit" class="array-add-btn">
            <template #icon><plus-outlined /></template>
            添加
          </a-button>
          <a-button type="primary" @click="handleArrayConfirm" style="margin-left: 8px;">
            确定
          </a-button>
        </div>
      </div>
      <div v-else class="sub-form-empty">
        <a-empty description="暂无配置项" />
      </div>
    </a-modal>

    <a-modal v-model:visible="arrayItemEditVisible" :title="arrayItemEditTitle" ok-text="确定" cancel-text="取消"
      @ok="handleArrayItemEditSave" @cancel="handleArrayItemEditCancel" :confirm-loading="arrayItemEditLoading"
      width="600px" :destroyOnClose="true">
      <div v-if="currentArrayItemSchemas && currentArrayItemSchemas.length > 0" class="sub-form">
        <a-form ref="arrayItemFormInnerRef" :model="arrayItemEditData" :label-col="{ span: 8 }"
          :wrapper-col="{ span: 16 }" layout="horizontal">
          <template v-for="schema in currentArrayItemSchemas" :key="schema.field">
            <a-form-item v-if="schema.component === 'GSubForm' || isNestedObjectType(schema)" :label="schema.label"
              :help="schema.bottomHelpMessage">
              <div class="subform-card subform-card-inner"
                @click="openNestedSubSubFormForArray(schema, arrayItemEditData)">
                <div v-if="arrayItemEditData[schema.field] && Object.keys(arrayItemEditData[schema.field]).length > 0"
                  class="card-preview">
                  <div v-for="subSchema in (getNestedSchemas(schema) || []).slice(0, 3)" :key="subSchema.field"
                    class="preview-item">
                    <span class="preview-label">{{ subSchema.label }}:</span>
                    <span class="preview-value">{{
                      formatPreviewValue(arrayItemEditData[schema.field]?.[subSchema.field], subSchema) }}</span>
                  </div>
                </div>
                <div v-else class="card-empty">点击配置</div>
                <div class="card-hint">
                  <edit-outlined /> 点击编辑
                </div>
              </div>
            </a-form-item>

            <a-form-item v-else :label="schema.label" :required="schema.required" :help="schema.bottomHelpMessage"
              :rules="getFormItemRules(schema)" :name="schema.field">
              <a-switch v-if="schema.component === 'Switch'" v-model:checked="arrayItemEditData[schema.field]" />
              <a-input-number v-else-if="schema.component === 'InputNumber'"
                v-model:value="arrayItemEditData[schema.field]" v-bind="schema.componentProps" style="width: 100%;" />
              <a-input v-else-if="schema.component === 'Input'" v-model:value="arrayItemEditData[schema.field]"
                v-bind="schema.componentProps" />
              <a-radio-group v-else-if="schema.component === 'RadioGroup'"
                v-model:value="arrayItemEditData[schema.field]">
                <a-radio v-for="opt in schema.componentProps?.options" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </a-radio>
              </a-radio-group>
              <a-select v-else-if="schema.component === 'Select'" v-model:value="arrayItemEditData[schema.field]"
                v-bind="schema.componentProps" style="width: 100%;" />
              <a-select v-else-if="schema.component === 'GTags'" v-model:value="arrayItemEditData[schema.field]"
                mode="tags" style="width: 100%;" />
              <a-input v-else-if="schema.component === 'EasyCron'" v-model:value="arrayItemEditData[schema.field]"
                placeholder="*表示任意，?表示不指定" />
              <a-select v-else-if="schema.component === 'GSelectGroup'" v-model:value="arrayItemEditData[schema.field]"
                mode="multiple" style="width: 100%;">
                <a-select-option v-for="group in groupOptions" :key="group.value" :value="group.value">
                  {{ group.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </template>
        </a-form>
      </div>
      <div v-else class="sub-form-empty">
        <a-empty description="暂无配置项" />
      </div>
    </a-modal>

    <a-modal v-model:visible="resetModalVisible" title="确认重置" ok-text="确认重置" cancel-text="取消" ok-danger
      @ok="handleResetConfirm" @cancel="resetModalVisible = false" :confirm-loading="resetLoading">
      <p style="font-size: 16px; color: #ff4d4f; font-weight: bold;">
        ⚠️ 确认重置所有修仙配置吗？
      </p>
      <p style="color: #666;">此操作不可撤销！所有配置将恢复为默认值。</p>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onActivated, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  SaveOutlined,
  ReloadOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'

const router = useRouter()

const configElementsCache = ref(null)

const loading = ref(false)
const saving = ref(false)
const elements = ref([])
const formData = reactive({})
const formRef = ref()

const subFormInnerRef = ref()
const nestedFormInnerRef = ref()
const arrayItemFormInnerRef = ref()

const resetModalVisible = ref(false)
const resetLoading = ref(false)

const groupOptions = ref([])

const subFormVisible = ref(false)
const subFormTitle = ref('')
const subFormData = reactive({})
const currentSubFormSchemas = ref([])
const subFormLoading = ref(false)
const currentElement = ref(null)

const nestedSubFormVisible = ref(false)
const nestedSubFormTitle = ref('')
const nestedSubFormData = reactive({})
const currentNestedSchemas = ref([])
const nestedSubFormLoading = ref(false)
const currentNestedElement = ref(null)

const arraySubFormVisible = ref(false)
const arraySubFormTitle = ref('')
const arraySubFormData = ref([])
const currentArraySubFormSchemas = ref([])
const currentArrayElement = ref(null)

const arrayItemEditVisible = ref(false)
const arrayItemEditTitle = ref('')
const arrayItemEditData = reactive({})
const currentArrayItemSchemas = ref([])
const arrayItemEditLoading = ref(false)
const currentEditItemIndex = ref(-1)
const isNewArrayItem = ref(false)

const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const config = {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  }

  try {
    const res = await fetch(url, config)

    if (res.status === 401) {
      message.error('token过期或无效')
      localStorage.removeItem('token')
      router.push('/login')
      throw new Error('未授权')
    }

    const data = await res.json()
    return data
  } catch (error) { }
}

const fetchConfigElements = async () => {
  if (configElementsCache.value) {
    elements.value = configElementsCache.value
    return configElementsCache.value
  }

  try {
    const response = await apiRequest('/api/xiuxian/config?action=get_config_elements')

    if (response.success && response.data?.elements) {
      const elementsData = response.data.elements
      configElementsCache.value = elementsData
      elements.value = elementsData
      return elementsData
    }

    return []
  } catch (error) {
    if (error.message !== '未授权') {
      message.error('获取配置模板失败: ' + error.message)
    }
    return []
  }
}

const fetchConfigValues = async () => {
  try {
    const response = await apiRequest('/api/xiuxian/config?action=get_config')

    if (response.success) {
      const config = response.data?.config || response.data || {}
      return config
    }

    return {}
  } catch (error) {
    if (error.message !== '未授权') {
      message.error('获取配置失败: ' + error.message)
    }
    return {}
  }
}

const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined

  const keys = path.split('.')

  let value = obj
  for (const key of keys) {
    if (value === null || value === undefined) break
    if (typeof value !== 'object') return undefined
    value = value[key]
  }

  if (value !== undefined) return value

  if (keys.length > 1 && keys[0] === 'xiuxian') {
    const newPath = keys.slice(1).join('.')
    return getNestedValue(obj, newPath)
  }

  return undefined
}

const getDefaultValue = (element) => {
  switch (element.component) {
    case 'Switch':
      return false
    case 'InputNumber':
      return null
    case 'RadioGroup':
      return element.componentProps?.options?.[0]?.value ?? null
    case 'GSelectGroup':
    case 'GTags':
      return []
    case 'GSubForm':
      return element.componentProps?.multiple ? [] : {}
    default:
      return ''
  }
}

const deepClone = (obj) => {
  if (obj === null || obj === undefined) return obj
  return JSON.parse(JSON.stringify(obj))
}

const getFormItemRules = (schema) => {
  if (!schema.required) return []

  const rules = [{ required: true, message: `${schema.label}不能为空` }]

  if (schema.component === 'InputNumber') {
    rules.push({ type: 'number', message: `${schema.label}必须为数字` })
  }

  if (schema.componentProps?.min !== undefined) {
    rules.push({
      type: 'number',
      min: schema.componentProps.min,
      message: `${schema.label}最小值为${schema.componentProps.min}`
    })
  }
  if (schema.componentProps?.max !== undefined) {
    rules.push({
      type: 'number',
      max: schema.componentProps.max,
      message: `${schema.label}最大值为${schema.componentProps.max}`
    })
  }

  return rules
}

const isNestedObjectType = (element) => {
  if (element.componentProps?.schemas && element.componentProps.schemas.length > 0) {
    return true
  }

  if (element.field) {
    const childElements = elements.value.filter(el => {
      if (!el.field) return false
      const elKeys = el.field.split('.')
      const currentKeys = element.field.split('.')
      return elKeys.length === currentKeys.length + 1 &&
        el.field.startsWith(element.field + '.') &&
        el.component !== 'SOFT_GROUP_BEGIN' &&
        el.component !== 'Divider' &&
        el.component !== 'GSubForm'
    })
    return childElements.length > 0
  }

  return false
}

const getNestedSchemas = (element) => {
  if (element.componentProps?.schemas && element.componentProps.schemas.length > 0) {
    return element.componentProps.schemas
  }

  if (element.field) {
    return elements.value.filter(el => {
      if (!el.field) return false
      const elKeys = el.field.split('.')
      const currentKeys = element.field.split('.')
      return elKeys.length === currentKeys.length + 1 &&
        el.field.startsWith(element.field + '.') &&
        el.component !== 'SOFT_GROUP_BEGIN' &&
        el.component !== 'Divider' &&
        el.component !== 'GSubForm'
    }).map(el => ({
      field: el.field.split('.').pop(),
      label: el.label,
      component: el.component,
      componentProps: el.componentProps,
      required: el.required,
      bottomHelpMessage: el.bottomHelpMessage
    }))
  }

  return []
}

const initFormData = (elementsList, config) => {
  const keys = Object.keys(formData)
  keys.forEach(key => delete formData[key])

  elementsList.forEach(element => {
    if (!element.field || element.component === 'SOFT_GROUP_BEGIN' || element.component === 'Divider') {
      return
    }

    const configValue = getNestedValue(config, element.field)

    if (configValue !== undefined) {
      if (typeof configValue === 'object' && configValue !== null) {
        formData[element.field] = deepClone(configValue)
      } else {
        formData[element.field] = configValue
      }
    } else {
      formData[element.field] = getDefaultValue(element)
    }
  })
}

const loadAllData = async (forceLoadElements = false) => {
  loading.value = true

  try {
    if (forceLoadElements) {
      configElementsCache.value = null
    }

    const elementsData = await fetchConfigElements()

    if (elementsData.length === 0) {
      loading.value = false
      return
    }

    const config = await fetchConfigValues()
    initFormData(elementsData, config || {})
  } catch (error) { } finally {
    loading.value = false
  }
}

const refreshConfigValues = async () => {
  loading.value = true

  try {
    const config = await fetchConfigValues()
    if (elements.value.length > 0 && config) {
      initFormData(elements.value, config)
    }
  } catch (error) { } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  refreshConfigValues()
}

const getArrayData = (field) => {
  const data = formData[field]
  return Array.isArray(data) ? data : []
}

const getObjectData = (field) => {
  const data = formData[field]
  return (data && typeof data === 'object' && !Array.isArray(data)) ? data : {}
}

const formatPreviewValue = (value, schema) => {
  if (value === undefined || value === null || value === '') return '-'

  if (schema?.component === 'Switch') {
    return value ? '开启' : '关闭'
  }

  if (schema?.component === 'RadioGroup') {
    const option = schema.componentProps?.options?.find(opt => opt.value === value)
    return option?.label || String(value)
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '-'
    return value.slice(0, 3).join(', ') + (value.length > 3 ? ` +${value.length - 3}...` : '')
  }

  if (typeof value === 'object') {
    return JSON.stringify(value).substring(0, 50) + '...'
  }

  return String(value)
}

const getArrayItemDisplayName = (item) => {
  if (item.name) return item.name
  if (item.id) return String(item.id)
  if (item.title) return item.title
  for (const key in item) {
    if (typeof item[key] === 'string' && item[key]) {
      return item[key].length > 20 ? item[key].substring(0, 20) + '...' : item[key]
    }
  }
  return '未命名'
}

const copyReactiveObject = (source, target) => {
  Object.keys(target).forEach(key => delete target[key])
  Object.entries(source).forEach(([key, value]) => {
    target[key] = deepClone(value)
  })
}

const openNestedSubForm = (element) => {
  currentNestedElement.value = element
  nestedSubFormTitle.value = element.label || '配置'

  const schemas = getNestedSchemas(element)
  currentNestedSchemas.value = schemas

  Object.keys(nestedSubFormData).forEach(key => delete nestedSubFormData[key])

  const existingData = getObjectData(element.field)

  nextTick(() => {
    if (schemas.length > 0) {
      schemas.forEach(schema => {
        if (schema.field) {
          const value = existingData[schema.field]
          if (value !== undefined) {
            nestedSubFormData[schema.field] = deepClone(value)
          } else {
            nestedSubFormData[schema.field] = getDefaultValue(schema)
          }
        }
      })
    }
  })

  nestedSubFormVisible.value = true
}

const handleNestedSubFormSave = async () => {
  if (nestedFormInnerRef.value) {
    try {
      await nestedFormInnerRef.value.validate()
    } catch (error) {
      return
    }
  }

  nestedSubFormLoading.value = true

  try {
    const newData = deepClone(nestedSubFormData)
    const element = currentNestedElement.value

    if (element.parent === 'subForm') {
      subFormData[element.field] = newData
    } else if (element.parent === 'arrayItem') {
      arrayItemEditData[element.field] = newData
    } else if (element.parent === 'deep') {
      if (element.parentData) {
        element.parentData[element.field] = newData
      }
    } else {
      formData[element.field] = newData
    }

    nestedSubFormVisible.value = false
  } catch (error) {
    message.error('保存失败: ' + error.message)
  } finally {
    nestedSubFormLoading.value = false
  }
}

const openNestedSubSubForm = (schema) => {
  currentNestedElement.value = { field: schema.field, label: schema.label, parent: 'subForm', parentData: subFormData }
  nestedSubFormTitle.value = schema.label || '配置'

  const schemas = getNestedSchemas(schema)
  currentNestedSchemas.value = schemas

  Object.keys(nestedSubFormData).forEach(key => delete nestedSubFormData[key])

  const existingData = subFormData[schema.field] || {}

  nextTick(() => {
    if (schemas.length > 0) {
      schemas.forEach(s => {
        if (s.field) {
          const value = existingData[s.field]
          if (value !== undefined) {
            nestedSubFormData[s.field] = deepClone(value)
          } else {
            nestedSubFormData[s.field] = getDefaultValue(s)
          }
        }
      })
    }
  })

  nestedSubFormVisible.value = true
}

const openNestedSubSubFormForArray = (schema, parentData) => {
  currentNestedElement.value = { field: schema.field, label: schema.label, parent: 'arrayItem', parentData: parentData }
  nestedSubFormTitle.value = schema.label || '配置'

  const schemas = getNestedSchemas(schema)
  currentNestedSchemas.value = schemas

  Object.keys(nestedSubFormData).forEach(key => delete nestedSubFormData[key])

  const existingData = parentData[schema.field] || {}

  nextTick(() => {
    if (schemas.length > 0) {
      schemas.forEach(s => {
        if (s.field) {
          const value = existingData[s.field]
          if (value !== undefined) {
            nestedSubFormData[s.field] = deepClone(value)
          } else {
            nestedSubFormData[s.field] = getDefaultValue(s)
          }
        }
      })
    }
  })

  nestedSubFormVisible.value = true
}

const openDeepNestedSubForm = (schema, parentData) => {
  currentNestedElement.value = { field: schema.field, label: schema.label, parent: 'deep', parentData: parentData }
  nestedSubFormTitle.value = schema.label || '配置'

  const schemas = getNestedSchemas(schema)
  currentNestedSchemas.value = schemas

  Object.keys(nestedSubFormData).forEach(key => delete nestedSubFormData[key])

  const existingData = parentData[schema.field] || {}

  nextTick(() => {
    if (schemas.length > 0) {
      schemas.forEach(s => {
        if (s.field) {
          const value = existingData[s.field]
          if (value !== undefined) {
            nestedSubFormData[s.field] = deepClone(value)
          } else {
            nestedSubFormData[s.field] = getDefaultValue(s)
          }
        }
      })
    }
  })

  nestedSubFormVisible.value = true
}

const openSubForm = (element) => {
  if (element.componentProps?.multiple) {
    openArraySubForm(element)
    return
  }

  currentElement.value = element
  subFormTitle.value = element.componentProps?.modalProps?.title || element.label || '配置'

  const schemas = element.componentProps?.schemas || []
  currentSubFormSchemas.value = schemas

  Object.keys(subFormData).forEach(key => delete subFormData[key])

  const existingData = getObjectData(element.field)

  nextTick(() => {
    if (schemas.length > 0) {
      schemas.forEach(schema => {
        if (schema.field) {
          const value = existingData[schema.field]
          if (value !== undefined) {
            subFormData[schema.field] = deepClone(value)
          } else {
            subFormData[schema.field] = getDefaultValue(schema)
          }
        }
      })
    }
  })

  subFormVisible.value = true
}

const handleSubFormSave = async () => {
  if (subFormInnerRef.value) {
    try {
      await subFormInnerRef.value.validate()
    } catch (error) {
      return
    }
  }

  subFormLoading.value = true

  try {
    const field = currentElement.value.field
    const newData = deepClone(subFormData)
    formData[field] = newData
    subFormVisible.value = false
  } catch (error) {
    message.error('保存失败: ' + error.message)
  } finally {
    subFormLoading.value = false
  }
}

const openArraySubForm = (element) => {
  currentArrayElement.value = element
  arraySubFormTitle.value = element.componentProps?.modalProps?.title || element.label || '配置'

  const schemas = element.componentProps?.schemas || []
  currentArraySubFormSchemas.value = schemas

  const data = formData[element.field]
  arraySubFormData.value = Array.isArray(data) ? deepClone(data) : []

  arraySubFormVisible.value = true
}

const addArrayItemAndEdit = () => {
  const newItem = {}
  currentArraySubFormSchemas.value.forEach(schema => {
    if (schema.field) {
      newItem[schema.field] = getDefaultValue(schema)
    }
  })
  arraySubFormData.value.push(newItem)

  isNewArrayItem.value = true

  const newIndex = arraySubFormData.value.length - 1
  editArrayItem(newIndex)
}

const removeArrayItem = (index) => {
  arraySubFormData.value.splice(index, 1)
}

const handleArrayConfirm = () => {
  const field = currentArrayElement.value.field
  formData[field] = deepClone(arraySubFormData.value)
  arraySubFormVisible.value = false
}

const editArrayItem = (index) => {
  currentEditItemIndex.value = index
  arrayItemEditTitle.value = '编辑项目'
  currentArrayItemSchemas.value = currentArraySubFormSchemas.value

  Object.keys(arrayItemEditData).forEach(key => delete arrayItemEditData[key])

  const itemData = arraySubFormData.value[index] || {}

  nextTick(() => {
    if (currentArrayItemSchemas.value.length > 0) {
      currentArrayItemSchemas.value.forEach(schema => {
        if (schema.field) {
          const value = itemData[schema.field]
          if (value !== undefined) {
            arrayItemEditData[schema.field] = deepClone(value)
          } else {
            arrayItemEditData[schema.field] = getDefaultValue(schema)
          }
        }
      })
    }
  })

  arrayItemEditVisible.value = true
}

const handleArrayItemEditSave = async () => {
  if (arrayItemFormInnerRef.value) {
    try {
      await arrayItemFormInnerRef.value.validate()
    } catch (error) {
      return
    }
  }

  arrayItemEditLoading.value = true

  try {
    const updatedItem = {}
    Object.entries(arrayItemEditData).forEach(([key, value]) => {
      updatedItem[key] = deepClone(value)
    })

    arraySubFormData.value[currentEditItemIndex.value] = updatedItem
    isNewArrayItem.value = false

    arrayItemEditVisible.value = false
  } catch (error) {
    message.error('保存失败: ' + error.message)
  } finally {
    arrayItemEditLoading.value = false
  }
}

const handleArrayItemEditCancel = () => {
  if (isNewArrayItem.value) {
    arraySubFormData.value.splice(currentEditItemIndex.value, 1)
    isNewArrayItem.value = false
  }
  arrayItemEditVisible.value = false
}

const handleButtonAction = async (btn) => {
  if (btn.action === 'resetxxConfig') {
    resetModalVisible.value = true
    return
  }
  message.info(`执行动作: ${btn.action}`)
}

const handleResetConfirm = async () => {
  resetLoading.value = true

  try {
    const response = await apiRequest('/api/xiuxian/config?action=reset', {
      method: 'POST'
    })

    if (response.success) {
      message.success(response.message)
      resetModalVisible.value = false
      await loadAllData(true)
    } else {
      message.error(response.message || '重置失败')
    }
  } catch (error) {
    if (error.message !== '未授权') {
      message.error('重置失败: ' + error.message)
    }
  } finally {
    resetLoading.value = false
  }
}

const handleSave = async () => {
  saving.value = true

  try {
    const saveData = {}
    Object.keys(formData).forEach(key => {
      if (key === 'actions') return

      const keys = key.split('.')
      if (keys.length === 1) {
        saveData[key] = deepClone(formData[key])
        return
      }

      const actualKeys = keys[0] === 'xiuxian' ? keys.slice(1) : keys

      let current = saveData
      for (let i = 0; i < actualKeys.length - 1; i++) {
        const k = actualKeys[i]
        if (!current[k] || typeof current[k] !== 'object' || Array.isArray(current[k])) {
          current[k] = {}
        }
        current = current[k]
      }

      current[actualKeys[actualKeys.length - 1]] = deepClone(formData[key])
    })

    const response = await apiRequest('/api/xiuxian/config?action=save_config', {
      method: 'POST',
      body: JSON.stringify(saveData)
    })

    if (response.success) {
      message.success(response.message || '配置保存成功')
    } else {
      message.error(response.message || '保存失败')
    }
  } catch (error) {
    if (error.message !== '未授权') {
      message.error('保存失败: ' + error.message)
    }
  } finally {
    saving.value = false
  }
}

const fetchGroups = async () => {
  try {
    const response = await apiRequest('/api/xiuxian/config?action=get_groups')
    if (response.success && response.data?.groups) {
      groupOptions.value = response.data.groups.map(g => ({
        label: g.name || g.groupId,
        value: g.groupId
      }))
    }
  } catch (error) { }
}

onActivated(() => {
  if (elements.value.length > 0) {
    refreshConfigValues()
  }
})

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    message.warning('请先登录')
    router.push('/login')
    return
  }

  await fetchGroups()
  await loadAllData()
})
</script>

<style scoped>
.config-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.save-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.config-form {
  padding-top: 8px;
}

.group-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  padding: 20px 0 12px 0;
  margin-bottom: 8px;
}

.divider-wrapper {
  margin: 12px 0;
}

.config-item {
  margin-bottom: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.config-item:hover {
  background: #fafafa;
}

.config-help {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
  margin-left: 4px;
}

.subform-form-item :deep(.ant-form-item-control-input) {
  min-height: auto;
}

.subform-card {
  display: inline-block;
  min-width: 180px;
  min-height: 60px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 12px 36px 12px 16px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.subform-card-inner {
  min-width: 150px;
}

.subform-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.card-preview {
  padding-right: 4px;
}

.array-count-preview {
  display: flex;
  align-items: baseline;
  justify-content: center;
  padding: 8px 0;
}

.count-number {
  font-size: 24px;
  font-weight: 600;
  color: #667eea;
  line-height: 1;
}

.count-text {
  font-size: 14px;
  color: #999;
  margin-left: 4px;
}

.preview-item {
  display: flex;
  align-items: baseline;
  margin-bottom: 4px;
  font-size: 13px;
  white-space: nowrap;
}

.preview-label {
  color: #666;
  margin-right: 8px;
  flex-shrink: 0;
}

.preview-value {
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.preview-more {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

.card-empty {
  color: #bbb;
  font-size: 14px;
  text-align: center;
  padding: 12px 0;
}

.card-hint {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 12px;
  color: #bbb;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s;
}

.subform-card:hover .card-hint {
  color: #667eea;
}

.sub-form {
  max-height: 60vh;
  overflow-y: auto;
  padding: 8px 4px;
}

.sub-form-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.array-modal-container {
  display: flex;
  flex-direction: column;
  height: 60vh;
}

.array-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 8px 4px;
  margin-bottom: 0;
}

.array-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.array-item-card {
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.array-item-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.array-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #e8e8e8;
}

.array-item-title {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.array-item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.array-item-preview {
  padding: 4px 0;
}

.array-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px 4px 4px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
  flex-shrink: 0;
}

.array-add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.array-add-btn:hover {
  opacity: 0.9;
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

:deep(.ant-form-item-label > label) {
  font-weight: 500;
}

:deep(.ant-form-item-extra) {
  color: #1890ff;
  font-size: 12px;
}

:deep(.ant-form-item-help) {
  color: #999;
  font-size: 12px;
}

:deep(.ant-divider) {
  margin: 16px 0;
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

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .subform-card {
    min-width: auto;
  }

  .array-modal-container {
    height: auto;
    max-height: 60vh;
  }

  :deep(.ant-form-item) {
    flex-direction: column;
  }

  :deep(.ant-form-item-label) {
    text-align: left;
    padding-bottom: 4px;
  }

  .array-footer {
    flex-direction: column;
    gap: 8px;
  }
}
</style>