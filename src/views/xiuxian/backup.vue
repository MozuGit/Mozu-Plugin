<template>
  <div class="backup-container">
    <a-card title="修仙备份管理" class="fade-in-card" :bordered="false">
      <div class="toolbar">
        <a-space>
          <a-button type="primary" @click="showBackupModal">
            <template #icon>
              <cloud-upload-outlined />
            </template>
            手动备份
          </a-button>
          <a-button danger :disabled="selectedRowKeys.length === 0" @click="showBatchDeleteConfirm">
            <template #icon>
              <delete-outlined />
            </template>
            批量删除
          </a-button>
        </a-space>
        <span v-if="isUpdating" class="update-hint">
          <sync-outlined spin /> 更新中...
        </span>
      </div>

      <a-table :columns="columns" :data-source="backupList" :loading="loading && backupList.length === 0"
        :row-selection="rowSelection" :pagination="false" :locale="tableLocale" row-key="filename" class="backup-table">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'size'">
            <span>{{ record.size || '-' }}</span>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="showRestoreConfirm(record)">
                <template #icon>
                  <history-outlined />
                </template>
                还原
              </a-button>
              <a-button type="link" danger size="small" @click="showDeleteConfirm(record)">
                <template #icon>
                  <delete-outlined />
                </template>
                删除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="backupModalVisible" title="手动备份" ok-text="开始备份" cancel-text="取消" @ok="handleCreateBackup"
      :confirm-loading="backupLoading" width="450px">
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="备份文件名" help="留空则自动生成时间格式文件名">
          <a-input v-model:value="backupFilename" placeholder="例如：2026-01-01_12:00" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="restoreModalVisible" title="确认还原备份" @ok="executeRestore" ok-text="确认还原" cancel-text="取消"
      :confirm-loading="restoreLoading" width="480px">
      <div class="confirm-content">
        <p><strong>备份文件：</strong>{{ currentRestoreFile?.filename }}</p>
        <p style="color: #ff4d4f; margin-top: 12px;">
          ⚠️ 还原操作将覆盖当前所有数据，此操作不可撤销，请谨慎操作！
        </p>
        <p>确定要还原到此备份吗？</p>
      </div>
    </a-modal>

    <a-modal v-model:visible="deleteModalVisible" title="确认删除备份" @ok="executeSingleDelete" ok-text="确认删除"
      cancel-text="取消" :confirm-loading="deleteLoading" width="450px">
      <div class="confirm-content">
        <p><strong>备份文件：</strong>{{ currentDeleteFile?.filename }}</p>
        <p>删除后将无法恢复，确定要删除该备份文件吗？</p>
      </div>
    </a-modal>

    <a-modal v-model:visible="batchDeleteModalVisible" title="确认批量删除" @ok="executeBatchDelete" ok-text="确认删除"
      cancel-text="取消" :confirm-loading="batchDeleteLoading" width="480px">
      <div class="confirm-content">
        <p><strong>已选择 {{ selectedRowKeys.length }} 个备份文件：</strong></p>
        <ul style="max-height: 200px; overflow-y: auto; margin-top: 8px; padding-left: 20px;">
          <li v-for="key in selectedRowKeys" :key="key">{{ key }}</li>
        </ul>
        <p style="margin-top: 12px;">批量删除后将无法恢复，确定要删除这些备份文件吗？</p>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  DeleteOutlined,
  SyncOutlined,
  CloudUploadOutlined,
  HistoryOutlined
} from '@ant-design/icons-vue'

const router = useRouter()

const CACHE_KEY = 'xiuxian_backup_list_cache'
const CACHE_TIME_KEY = 'xiuxian_backup_list_cache_time'
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

const loading = ref(false)
const backupList = ref([])
const selectedRowKeys = ref([])
const isUpdating = ref(false)

const columns = [
  {
    title: '备份文件名称',
    dataIndex: 'filename',
    key: 'filename',
    ellipsis: true,
    sorter: (a, b) => a.filename.localeCompare(b.filename),
    sortDirections: ['ascend', 'descend']
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    align: 'center'
  }
]

const rowSelection = {
  selectedRowKeys: selectedRowKeys,
  onChange: (keys) => {
    selectedRowKeys.value = keys
  }
}

const fetchBackupList = async (silent = false) => {
  if (!silent) {
    loading.value = true
  } else {
    isUpdating.value = true
  }
  try {
    const data = await apiRequest('/api/xiuxian/backup?action=getlist')
    let parsedList = []
    if (data.backups && Array.isArray(data.backups)) {
      parsedList = data.backups.map(filename => ({
        filename: filename.replace(/\.json$/, '')
      }))
    }
    backupList.value = parsedList
    setCachedData(parsedList)
  } catch (error) {
    if (error.message !== '未授权') {
      if (!silent) {
        message.error(error.message || '获取备份列表失败')
      }
    }

    if (silent && backupList.value.length === 0) {
      const cached = getCachedData()
      if (cached) {
        backupList.value = cached
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

const restoreModalVisible = ref(false)
const restoreLoading = ref(false)
const currentRestoreFile = ref(null)

const showRestoreConfirm = (record) => {
  currentRestoreFile.value = record
  restoreModalVisible.value = true
}

const executeRestore = async () => {
  if (!currentRestoreFile.value) return

  restoreLoading.value = true
  try {
    await apiRequest(`/api/xiuxian/backup?action=restore&filename=${encodeURIComponent(currentRestoreFile.value.filename)}`)
    message.success(`还原备份 ${currentRestoreFile.value.filename} 成功`)
    restoreModalVisible.value = false
    currentRestoreFile.value = null
    fetchBackupList(true)
  } catch (error) {
    if (error.message !== '未授权') {
      message.error(error.message || '还原失败')
    }
  } finally {
    restoreLoading.value = false
  }
}

const deleteModalVisible = ref(false)
const deleteLoading = ref(false)
const currentDeleteFile = ref(null)

const showDeleteConfirm = (record) => {
  currentDeleteFile.value = record
  deleteModalVisible.value = true
}

const executeSingleDelete = async () => {
  if (!currentDeleteFile.value) return

  deleteLoading.value = true
  try {
    await apiRequest('/api/xiuxian/backup?action=delete', {
      method: 'POST',
      body: JSON.stringify({
        files: [currentDeleteFile.value.filename]
      })
    })

    message.success('删除成功')
    backupList.value = backupList.value.filter(item => item.filename !== currentDeleteFile.value.filename)
    selectedRowKeys.value = selectedRowKeys.value.filter(key => key !== currentDeleteFile.value.filename)
    setCachedData(backupList.value)
    deleteModalVisible.value = false
    currentDeleteFile.value = null
    fetchBackupList(true)
  } catch (error) {
    if (error.message !== '未授权') {
      message.error(error.message || '删除失败')
    }
  } finally {
    deleteLoading.value = false
  }
}

const batchDeleteModalVisible = ref(false)
const batchDeleteLoading = ref(false)

const showBatchDeleteConfirm = () => {
  batchDeleteModalVisible.value = true
}

const executeBatchDelete = async () => {
  batchDeleteLoading.value = true
  try {
    await apiRequest('/api/xiuxian/backup?action=delete', {
      method: 'POST',
      body: JSON.stringify({
        files: selectedRowKeys.value
      })
    })

    message.success(`成功删除 ${selectedRowKeys.value.length} 个备份文件`)
    backupList.value = backupList.value.filter(item => !selectedRowKeys.value.includes(item.filename))
    selectedRowKeys.value = []
    setCachedData(backupList.value)
    batchDeleteModalVisible.value = false
    fetchBackupList(true)
  } catch (error) {
    if (error.message !== '未授权') {
      message.error(error.message || '批量删除失败')
    }
    console.error('Error:', error)
  } finally {
    batchDeleteLoading.value = false
  }
}

const backupModalVisible = ref(false)
const backupLoading = ref(false)
const backupFilename = ref('')

const showBackupModal = () => {
  backupFilename.value = ''
  backupModalVisible.value = true
}

const handleCreateBackup = async () => {
  backupLoading.value = true
  try {
    let url = '/api/xiuxian/backup?action=backup'
    if (backupFilename.value.trim()) {
      url += `&filename=${encodeURIComponent(backupFilename.value.trim())}`
    }
    await apiRequest(url)
    message.success('备份创建成功')
    backupModalVisible.value = false
    fetchBackupList(true)
  } catch (error) {
    if (error.message !== '未授权') {
      message.error(error.message || '备份失败')
    }
  } finally {
    backupLoading.value = false
  }
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    fetchBackupList(true)
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
    backupList.value = cached
    fetchBackupList(true)
  } else {
    fetchBackupList(false)
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.backup-container {
  width: 100%;
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

.backup-table {
  margin-top: 16px;
}

.confirm-content {
  line-height: 1.8;
  font-size: 14px;
}

.confirm-content ul {
  margin: 0;
  padding-left: 20px;
}

.confirm-content li {
  margin-bottom: 4px;
  word-break: break-all;
}

:deep(.ant-table-wrapper) {
  overflow-x: auto;
}

:deep(.ant-table) {
  min-width: 500px;
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