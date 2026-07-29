<template>
  <div class="dashboard-container">
    <!-- 顶部快捷栏 - 可滑动 -->
    <div class="quick-nav">
      <div class="nav-scroll">
        <a-button :class="{ active: currentPage === 'xiuxian' }" @click="navigateTo('xiuxian')">
          <template #icon>
            <HomeOutlined />
          </template>
          首页
        </a-button>
        <a-button :class="{ active: currentPage === 'config' }" @click="navigateTo('config')">
          <template #icon>
            <setting-outlined />
          </template>
          修仙配置
        </a-button>
        <a-button type="primary" :class="{ active: currentPage === 'cdk' }" @click="navigateTo('cdk')">
          <template #icon>
            <gift-outlined />
          </template>
          兑换码操作
        </a-button>
      </div>
    </div>

    <!-- 兑换码操作内容 -->
    <a-card title="兑换码操作" class="fade-in-card" :bordered="false">
      <!-- 顶部操作栏 -->
      <div class="toolbar">
        <a-space>
          <a-button type="primary" @click="showAddModal">
            <template #icon>
              <plus-outlined />
            </template>
            添加兑换码
          </a-button>
          <a-button danger :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete">
            <template #icon>
              <delete-outlined />
            </template>
            批量删除
          </a-button>
        </a-space>
        <!-- 静默更新提示 -->
        <span v-if="isUpdating" class="update-hint">
          <sync-outlined spin /> 更新中...
        </span>
      </div>

      <!-- 兑换码列表 -->
      <a-table :columns="columns" :data-source="cdkList" :loading="loading && cdkList.length === 0"
        :row-selection="rowSelection" :pagination="false" :locale="tableLocale" row-key="name" class="cdk-table"
        @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'genera'">
            <span>{{ record.genera ? '✅' : '❌' }}</span>
          </template>
          <template v-if="column.key === 'forceSetting'">
            <span>{{ record.forceSetting ? '✅' : '❌' }}</span>
          </template>
          <template v-if="column.key === 'cultList'">
            <span>{{ Array.isArray(record.cultList) ? record.cultList.join(', ') : record.cultList || '-' }}</span>
          </template>
          <template v-if="column.key === 'lsList'">
            <span>{{ Array.isArray(record.lsList) ? record.lsList.join(', ') : record.lsList || '-' }}</span>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="showEditModal(record)">
                <template #icon>
                  <edit-outlined />
                </template>
                修改
              </a-button>
              <a-popconfirm title="确定要删除这个兑换码吗？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record)">
                <a-button type="link" danger size="small">
                  <template #icon>
                    <delete-outlined />
                  </template>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 添加/修改兑换码弹窗 -->
    <a-modal v-model:visible="modalVisible" :title="isEdit ? '修改兑换码' : '添加兑换码'" :ok-text="isEdit ? '修改' : '添加'"
      cancel-text="取消" @ok="handleSubmit" @cancel="handleCancel" :confirm-loading="submitLoading" width="600px">
      <a-form ref="formRef" :model="formState" :rules="formRules" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="兑换码名称" name="name">
          <a-input v-model:value="formState.name" placeholder="请输入兑换码名称" :disabled="isEdit" />
        </a-form-item>

        <a-form-item label="通用开关" name="genera">
          <a-switch v-model:checked="formState.genera" />
        </a-form-item>

        <a-form-item label="强制设置开关" name="forceSetting">
          <a-switch v-model:checked="formState.forceSetting" />
        </a-form-item>

        <a-form-item label="修为" name="cultList">
          <a-textarea v-model:value="cultListText" placeholder="请输入修为值，每行一个" :rows="4" @change="handleCultListChange" />
        </a-form-item>

        <a-form-item label="灵石" name="lsList">
          <a-textarea v-model:value="lsListText" placeholder="请输入灵石值，每行一个" :rows="4" @change="handleLsListChange" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  HomeOutlined,
  SettingOutlined,
  GiftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

const CACHE_KEY = 'xiuxian_cdk_list_cache'
const CACHE_TIME_KEY = 'xiuxian_cdk_list_cache_time'
const CACHE_DURATION = 5 * 60 * 1000

const tableLocale = {
  triggerAsc: '',
  triggerDesc: '',
  cancelSort: '取消排序'
}

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
  const res = await fetch(url, config)
  if (res.status === 401) {
    message.error('token过期或无效')
    localStorage.removeItem('token')
    router.push('/login')
    document.title = '魔族陌 - 登录'
    throw new Error('未授权')
  }
  const data = await res.json()
  if (data.success && data.data) {
    return data.data
  } else if (data.success) {
    return data
  } else {
    throw new Error(data.message || '操作失败')
  }
}

const parseCdkValue = (cdk) => {
  if (typeof cdk.value === 'string') {
    try {
      const parsed = JSON.parse(cdk.value)
      return {
        ...cdk,
        genera: parsed.genera || false,
        forceSetting: parsed.forceSetting || false,
        cultList: parsed.cultList || [],
        lsList: parsed.lsList || []
      }
    } catch (error) {
      console.error('解析兑换码value失败:', error)
      return {
        ...cdk,
        genera: false,
        forceSetting: false,
        cultList: [],
        lsList: []
      }
    }
  }
  return cdk
}

const getCachedData = () => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    const cacheTime = sessionStorage.getItem(CACHE_TIME_KEY)
    if (cached && cacheTime) {
      const now = Date.now()
      const cachedTime = parseInt(cacheTime)
      if (now - cachedTime < CACHE_DURATION) {
        return JSON.parse(cached)
      }
    }
  } catch (error) {
    console.error('读取缓存失败:', error)
  }
  return null
}

const setCachedData = (data) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data))
    sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString())
  } catch (error) {
    console.error('设置缓存失败:', error)
  }
}

const currentPage = computed(() => {
  if (route.path === '/xiuxian/config') return 'config'
  if (route.path === '/xiuxian/cdk') return 'cdk'
  return 'xiuxian'
})

const navigateTo = (page) => {
  switch (page) {
    case 'xiuxian':
      router.push('/xiuxian')
      break
    case 'config':
      router.push('/xiuxian/config')
      break
    case 'cdk':
      router.push('/xiuxian/cdk')
      break
  }
}

const loading = ref(false)
const cdkList = ref([])
const selectedRowKeys = ref([])
const isUpdating = ref(false)

const columns = [
  {
    title: '兑换码名称',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
    sorter: (a, b) => a.name.localeCompare(b.name),
    sortDirections: ['ascend', 'descend']
  },
  {
    title: '通用',
    key: 'genera',
    width: 80,
    align: 'center',
    sorter: (a, b) => (a.genera === b.genera ? 0 : a.genera ? -1 : 1),
    sortDirections: ['ascend', 'descend']
  },
  {
    title: '强制设置',
    key: 'forceSetting',
    width: 120,
    align: 'center',
    sorter: (a, b) => (a.forceSetting === b.forceSetting ? 0 : a.forceSetting ? -1 : 1),
    sortDirections: ['ascend', 'descend']
  },
  {
    title: '修为',
    key: 'cultList',
    ellipsis: true,
    sorter: (a, b) => {
      const aStr = Array.isArray(a.cultList) ? a.cultList.join(',') : ''
      const bStr = Array.isArray(b.cultList) ? b.cultList.join(',') : ''
      return aStr.localeCompare(bStr)
    },
    sortDirections: ['ascend', 'descend']
  },
  {
    title: '灵石',
    key: 'lsList',
    ellipsis: true,
    sorter: (a, b) => {
      const aStr = Array.isArray(a.lsList) ? a.lsList.join(',') : ''
      const bStr = Array.isArray(b.lsList) ? b.lsList.join(',') : ''
      return aStr.localeCompare(bStr)
    },
    sortDirections: ['ascend', 'descend']
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    align: 'center'
  }
]

const rowSelection = {
  selectedRowKeys: selectedRowKeys,
  onChange: (keys) => {
    selectedRowKeys.value = keys
  }
}

const handleTableChange = (pag, filters, sorter) => {
  console.log('排序变化:', sorter)
}
const fetchCdkList = async (silent = false) => {
  if (!silent) {
    loading.value = true
  } else {
    isUpdating.value = true
  }
  try {
    const data = await apiRequest('/api/xiuxian/cdk?action=getlist')
    let parsedList = []
    if (data.cdks && Array.isArray(data.cdks)) {
      parsedList = data.cdks.map(cdk => parseCdkValue(cdk))
    } else if (Array.isArray(data)) {
      parsedList = data.map(cdk => parseCdkValue(cdk))
    }
    cdkList.value = parsedList
    setCachedData(parsedList)
  } catch (error) {
    if (error.message !== '未授权') {
      if (!silent) {
        message.error(error.message || '获取兑换码列表失败')
      }
    }

    if (silent && cdkList.value.length === 0) {
      const cached = getCachedData()
      if (cached) {
        cdkList.value = cached
      }
    }
  } finally {
    if (!silent) {
      loading.value = false
    } else {
      isUpdating.value = false
    }
  }
}

const handleDelete = async (record) => {
  try {
    await apiRequest('/api/xiuxian/cdk?action=delete', {
      method: 'POST',
      body: JSON.stringify({
        list: [record.name]
      })
    })

    message.success('删除成功')
    cdkList.value = cdkList.value.filter(item => item.name !== record.name)
    selectedRowKeys.value = selectedRowKeys.value.filter(key => key !== record.name)
    setCachedData(cdkList.value)
    fetchCdkList(true)
  } catch (error) {
    if (error.message !== '未授权') {
      message.error(error.message || '删除失败')
    }
    console.error('Error:', error)
  }
}

const handleBatchDelete = async () => {
  try {
    await apiRequest('/api/xiuxian/cdk?action=delete', {
      method: 'POST',
      body: JSON.stringify({
        list: selectedRowKeys.value
      })
    })
    message.success(`成功删除 ${selectedRowKeys.value.length} 个兑换码`)
    cdkList.value = cdkList.value.filter(item => !selectedRowKeys.value.includes(item.name))
    selectedRowKeys.value = []
    setCachedData(cdkList.value)
    fetchCdkList(true)
  } catch (error) {
    if (error.message !== '未授权') {
      message.error(error.message || '批量删除失败')
    }
    console.error('Error:', error)
  }
}

const modalVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref()
const cultListText = ref('')
const lsListText = ref('')

const formState = reactive({
  name: '',
  genera: false,
  forceSetting: false,
  cultList: [],
  lsList: []
})

const formRules = {
  name: [
    { required: true, message: '请输入兑换码名称', trigger: 'blur' }
  ]
}

const setFormData = (data) => {
  formState.name = data.name || ''
  formState.genera = data.genera || false
  formState.forceSetting = data.forceSetting || false
  formState.cultList = data.cultList || []
  formState.lsList = data.lsList || []
  cultListText.value = Array.isArray(data.cultList) ? data.cultList.join('\n') : ''
  lsListText.value = Array.isArray(data.lsList) ? data.lsList.join('\n') : ''
}

const showAddModal = () => {
  isEdit.value = false
  setFormData({
    name: '',
    genera: false,
    forceSetting: false,
    cultList: [],
    lsList: []
  })
  modalVisible.value = true
}

const showEditModal = (record) => {
  isEdit.value = true
  setFormData(record)
  modalVisible.value = true
}

const handleCultListChange = (e) => {
  const text = e.target.value
  cultListText.value = text
  formState.cultList = text.split('\n').filter(item => item.trim() !== '').map(item => {
    const num = Number(item.trim())
    return isNaN(num) ? 0 : num
  })
}

const handleLsListChange = (e) => {
  const text = e.target.value
  lsListText.value = text
  formState.lsList = text.split('\n').filter(item => item.trim() !== '').map(item => {
    const num = Number(item.trim())
    return isNaN(num) ? 0 : num
  })
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true

    const action = isEdit.value ? 'modify' : 'add'
    const url = `/api/xiuxian/cdk?action=${action}`

    const postData = {
      name: formState.name,
      genera: formState.genera,
      forceSetting: formState.forceSetting,
      cultList: formState.cultList,
      lsList: formState.lsList
    }

    await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(postData)
    })

    message.success(isEdit.value ? '修改成功' : '添加成功')
    modalVisible.value = false
    fetchCdkList(true)
  } catch (error) {
    if (error.errorFields) {
      return
    }
    if (error.message !== '未授权') {
      message.error(error.message || '操作失败')
    }
    console.error('Error:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleCancel = () => {
  modalVisible.value = false
  formRef.value?.resetFields()
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    fetchCdkList(true)
  }
}

onMounted(() => {
  const token = localStorage.getItem('token')
  if (!token) {
    message.warning('请先登录')
    router.push('/login')
    document.title = '魔族陌 - 登录'
    return
  }

  const cached = getCachedData()
  if (cached && cached.length > 0) {
    cdkList.value = cached
    fetchCdkList(true)
  } else {
    fetchCdkList(false)
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.dashboard-container {
  width: 100%;
}

.quick-nav {
  margin-bottom: 24px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.nav-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 4px;
}

.nav-scroll::-webkit-scrollbar {
  display: none;
}

.nav-scroll .ant-btn {
  height: 40px;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  flex-shrink: 0;
  white-space: nowrap;
}

.nav-scroll .ant-btn:not(.ant-btn-primary) {
  background: #f5f7fa;
  border-color: #e8eaed;
  color: #5f6368;
}

.nav-scroll .ant-btn:not(.ant-btn-primary):hover {
  background: #e8f0fe;
  border-color: #b8d4fe;
  color: #1a73e8;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.2);
}

.nav-scroll .ant-btn.active {
  background: #e8f0fe;
  border-color: #1a73e8;
  color: #1a73e8;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.15);
}

.toolbar {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.update-hint {
  color: #1677ff;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.cdk-table {
  margin-top: 16px;
}

:deep(.ant-table-wrapper) {
  overflow-x: auto;
}

:deep(.ant-table) {
  min-width: 600px;
}

:deep(.ant-table-thead > tr > th:last-child),
:deep(.ant-table-tbody > tr > td:last-child) {
  position: sticky;
  right: 0;
  background: #fff;
  z-index: 2;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.06);
}

:deep(.ant-table-thead > tr > th:last-child) {
  z-index: 3;
}

:deep(.ant-table-tbody > tr:hover > td:last-child) {
  background: #fafafa;
}

:deep(.ant-table-row-selected > td:last-child) {
  background: #e6f7ff;
}

:deep(.ant-table-row-selected:hover > td:last-child) {
  background: #dcebf8;
}

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

:deep(.ant-card) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

:deep(.ant-card:hover) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

:deep(.ant-table-wrapper) {
  overflow-x: auto;
}
</style>