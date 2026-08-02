<template>
  <div class="cdk-container">
    <a-card title="兑换码操作" class="fade-in-card" :bordered="false">
      <div class="toolbar">
        <a-space :size="[8, 8]" wrap>
          <a-button type="primary" @click="showAddModal">
            <template #icon>
              <plus-outlined />
            </template>
            <span class="btn-text">添加兑换码</span>
          </a-button>
          <a-button danger :disabled="selectedRowKeys.length === 0" @click="showBatchDeleteModal">
            <template #icon>
              <delete-outlined />
            </template>
            <span class="btn-text">批量删除</span>
          </a-button>
        </a-space>
        <span v-if="isUpdating" class="update-hint">
          <sync-outlined spin /> <span class="hint-text">更新中...</span>
        </span>
      </div>

      <a-table :columns="tableColumns" :data-source="cdkList" :loading="loading && cdkList.length === 0"
        :row-selection="rowSelection" :pagination="false" :locale="tableLocale" row-key="name" class="cdk-table"
        :scroll="{ x: 1200 }" @change="handleTableChange">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'genera'">
            <a-tag :color="record.genera ? 'green' : 'default'">
              {{ record.genera ? '通用' : '专属' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'forceSetting'">
            <span class="status-icon">{{ record.forceSetting ? '✅' : '❌' }}</span>
          </template>
          <template v-if="column.key === 'usedStatus'">
            <template v-if="record.genera">
              <a-tag :color="record.useIdList && record.useIdList.length > 0 ? 'red' : 'blue'">
                {{ record.useIdList && record.useIdList.length > 0 ? `${record.useIdList.length}人使用` : '未使用' }}
              </a-tag>
            </template>
            <template v-else>
              <a-tag :color="record.useStatus === 1 ? 'red' : 'blue'">
                {{ record.useStatus === 1 ? '已使用' : '未使用' }}
              </a-tag>
            </template>
          </template>
          <template v-if="column.key === 'usedInfo'">
            <div v-if="record.genera">
              <span v-if="record.useIdList && record.useIdList.length > 0">
                {{ record.useIdList.length }}人使用
              </span>
              <span v-else class="text-muted">未使用</span>
            </div>
            <div v-else>
              <template v-if="record.useStatus === 1">
                <div class="used-info-detail">
                  <div>使用人: {{ record.useId }}</div>
                  <div>时间: {{ formatTime(record.useTime) }}</div>
                </div>
              </template>
              <span v-else class="text-muted">未使用</span>
            </div>
          </template>
          <template v-if="column.key === 'cultList'">
            <span class="list-text">{{ Array.isArray(record.cultList) ? record.cultList.join(', ') : record.cultList ||
              '-' }}</span>
          </template>
          <template v-if="column.key === 'lsList'">
            <span class="list-text">{{ Array.isArray(record.lsList) ? record.lsList.join(', ') : record.lsList || '-'
              }}</span>
          </template>
          <template v-if="column.key === 'action'">
            <a-space :size="[4, 4]" class="action-space">
              <a-button type="link" size="small" @click="showEditModal(record)" class="action-btn">
                <template #icon>
                  <edit-outlined />
                </template>
                <span class="action-text">修改</span>
              </a-button>
              <a-button type="link" danger size="small" @click="showDeleteModal(record)" class="action-btn">
                <template #icon>
                  <delete-outlined />
                </template>
                <span class="action-text">删除</span>
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <div class="mobile-cdk-list">
        <a-card v-for="record in cdkList" :key="record.name" class="cdk-mobile-card"
          :class="{ 'selected-card': selectedRowKeys.includes(record.name) }">
          <div class="mobile-card-header">
            <a-checkbox :checked="selectedRowKeys.includes(record.name)"
              @change="(e) => toggleMobileSelection(record.name, e.target.checked)" />
            <span class="mobile-cdk-name">{{ record.name }}</span>
            <a-tag :color="record.genera ? 'green' : 'orange'" class="mobile-type-tag">
              {{ record.genera ? '通用' : '专属' }}
            </a-tag>
          </div>

          <a-descriptions :column="2" size="small" class="mobile-descriptions">
            <a-descriptions-item label="强制设置">
              <span class="status-icon">{{ record.forceSetting ? '✅' : '❌' }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="使用状态">
              <template v-if="record.genera">
                <a-tag :color="record.useIdList && record.useIdList.length > 0 ? 'red' : 'blue'">
                  {{ record.useIdList && record.useIdList.length > 0 ? `${record.useIdList.length}人使用` : '未使用' }}
                </a-tag>
              </template>
              <template v-else>
                <a-tag :color="record.useStatus === 1 ? 'red' : 'blue'">
                  {{ record.useStatus === 1 ? '已使用' : '未使用' }}
                </a-tag>
              </template>
            </a-descriptions-item>

            <a-descriptions-item label="使用信息" :span="2">
              <div v-if="record.genera">
                <span v-if="record.useIdList && record.useIdList.length > 0">
                  {{ record.useIdList.length }}人使用
                </span>
                <span v-else class="text-muted">未使用</span>
              </div>
              <div v-else-if="record.useStatus === 1">
                <div>使用人: {{ record.useId }}</div>
                <div>时间: {{ formatTime(record.useTime) }}</div>
              </div>
              <span v-else class="text-muted">未使用</span>
            </a-descriptions-item>

            <a-descriptions-item label="修为" :span="2">
              <span class="list-text">{{ Array.isArray(record.cultList) ? record.cultList.join(', ') : record.cultList
                || '-'
                }}</span>
            </a-descriptions-item>
            <a-descriptions-item label="灵石" :span="2">
              <span class="list-text">{{ Array.isArray(record.lsList) ? record.lsList.join(', ') : record.lsList || '-'
                }}</span>
            </a-descriptions-item>
          </a-descriptions>

          <div class="mobile-card-actions">
            <a-button type="link" size="small" @click="showEditModal(record)" class="action-btn">
              <edit-outlined /> 修改
            </a-button>
            <a-button type="link" danger size="small" @click="showDeleteModal(record)" class="action-btn">
              <delete-outlined /> 删除
            </a-button>
          </div>
        </a-card>
      </div>
    </a-card>

    <a-modal v-model:visible="modalVisible" :title="isEdit ? '修改兑换码' : '添加兑换码'" :ok-text="isEdit ? '修改' : '添加'"
      cancel-text="取消" @ok="handleSubmit" @cancel="handleCancel" :confirm-loading="submitLoading"
      :width="isMobile ? '95%' : '800px'" :body-style="{ padding: isMobile ? '16px' : '24px' }">
      <a-form ref="formRef" :model="formState" :rules="formRules" :label-col="isMobile ? { span: 24 } : { span: 6 }"
        :wrapper-col="isMobile ? { span: 24 } : { span: 18 }" :label-align="isMobile ? 'left' : 'right'">
        <a-form-item label="兑换码" name="name">
          <a-input v-model:value="formState.name" placeholder="请输入兑换码" :disabled="isEdit" />
        </a-form-item>

        <a-form-item label="通用开关" name="genera">
          <a-switch v-model:checked="formState.genera" @change="handleGeneraChange" />
          <span style="margin-left: 8px; color: #888; font-size: 12px;">
            {{ formState.genera ? '可被多人使用' : '仅限单人使用' }}
          </span>
        </a-form-item>

        <a-form-item label="强制设置开关" name="forceSetting">
          <a-switch v-model:checked="formState.forceSetting" />
        </a-form-item>

        <a-form-item label="修为" name="cultList">
          <a-textarea v-model:value="cultListText" placeholder="请输入修为值，每行一个" :rows="isMobile ? 3 : 4"
            @change="handleCultListChange" />
        </a-form-item>

        <a-form-item label="灵石" name="lsList">
          <a-textarea v-model:value="lsListText" placeholder="请输入灵石值，每行一个" :rows="isMobile ? 3 : 4"
            @change="handleLsListChange" />
        </a-form-item>

        <template v-if="isEdit">
          <a-divider orientation="left">使用信息管理</a-divider>

          <template v-if="formState.genera">
            <a-form-item label="使用记录" :wrapper-col="isMobile ? { span: 24 } : { span: 18 }">
              <div class="usage-management-inline">
                <a-table :columns="usageTableColumns" :data-source="editUsageList" :pagination="false" size="small"
                  bordered v-if="editUsageList.length > 0">
                  <template #bodyCell="{ column, record, index }">
                    <template v-if="column.key === 'index'">
                      {{ index + 1 }}
                    </template>
                    <template v-if="column.key === 'userId'">
                      <span class="user-id-text">{{ record.userId }}</span>
                    </template>
                    <template v-if="column.key === 'usedTime'">
                      {{ formatTime(record.useTime) }}
                    </template>
                    <template v-if="column.key === 'action'">
                      <a-button type="link" danger size="small" @click="showDeleteUsageModal(index)">
                        <delete-outlined />
                      </a-button>
                    </template>
                  </template>
                </a-table>

                <a-button type="dashed" block @click="showAddUsageModal" style="margin-top: 8px;">
                  <plus-outlined /> 添加使用记录
                </a-button>
              </div>
            </a-form-item>
          </template>

          <template v-else>
            <a-form-item label="使用状态">
              <a-switch v-model:checked="singleUseForm.isUsed" checked-children="已使用" un-checked-children="未使用" />
            </a-form-item>
            <template v-if="singleUseForm.isUsed">
              <a-form-item label="使用人ID">
                <a-input v-model:value="singleUseForm.useId" placeholder="请输入使用人ID" />
              </a-form-item>
              <a-form-item label="使用时间">
                <a-date-picker v-model:value="singleUseForm.useTime" show-time format="YYYY-MM-DD HH:mm:ss"
                  placeholder="选择使用时间" style="width: 100%;" />
              </a-form-item>
            </template>
          </template>
        </template>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="deleteUsageModalVisible" title="确认删除使用记录" ok-text="确认删除" cancel-text="取消"
      @ok="confirmDeleteUsage" @cancel="deleteUsageModalVisible = false" :width="isMobile ? '95%' : '500px'">
      <div class="delete-usage-content">
        <a-alert message="删除确认" description="您确定要删除这条使用记录吗？此操作不可恢复！" type="warning" show-icon :closable="false"
          style="margin-bottom: 16px;" />
        <a-descriptions :column="1" bordered size="small"
          v-if="deleteUsageTarget !== null && editUsageList[deleteUsageTarget]">
          <a-descriptions-item label="使用人ID">
            <span class="user-id-text">{{ editUsageList[deleteUsageTarget].userId }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="使用时间">
            {{ formatTime(editUsageList[deleteUsageTarget].useTime) }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>

    <a-modal v-model:visible="addUsageModalVisible" title="添加使用记录" ok-text="确认添加" cancel-text="取消" @ok="confirmAddUsage"
      @cancel="addUsageModalVisible = false" :width="isMobile ? '95%' : '500px'">
      <a-form :model="newUsageForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="使用人ID" required>
          <a-input v-model:value="newUsageForm.userId" placeholder="请输入使用人ID" />
        </a-form-item>
        <a-form-item label="使用时间" required>
          <a-date-picker v-model:value="newUsageForm.useTime" show-time format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择使用时间" style="width: 100%;" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="deleteModalVisible" title="确认删除" ok-text="确认删除" cancel-text="取消" @ok="confirmDelete"
      @cancel="cancelDelete" :confirm-loading="deleteLoading" :width="isMobile ? '95%' : '500px'"
      :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <div class="delete-confirm-content">
        <a-alert message="删除确认" description="您确定要删除以下兑换码吗？此操作不可恢复！" type="warning" show-icon :closable="false"
          style="margin-bottom: 16px;" />
        <a-descriptions :column="isMobile ? 1 : 2" bordered size="small" class="delete-descriptions">
          <a-descriptions-item label="兑换码">
            <a-tag color="red">{{ deleteTarget?.name }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="类型">
            <a-tag :color="deleteTarget?.genera ? 'green' : 'orange'">
              {{ deleteTarget?.genera ? '通用' : '专属' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="使用状态">
            <template v-if="deleteTarget?.genera">
              <a-tag :color="deleteTarget?.useIdList && deleteTarget.useIdList.length > 0 ? 'red' : 'blue'">
                {{ deleteTarget?.useIdList && deleteTarget.useIdList.length > 0 ? '已使用' : '未使用' }}
              </a-tag>
            </template>
            <template v-else>
              <a-tag :color="deleteTarget?.useStatus === 1 ? 'red' : 'blue'">
                {{ deleteTarget?.useStatus === 1 ? '已使用' : '未使用' }}
              </a-tag>
            </template>
          </a-descriptions-item>
          <a-descriptions-item label="强制设置">
            {{ deleteTarget?.forceSetting ? '✅ 开启' : '❌ 关闭' }}
          </a-descriptions-item>
          <a-descriptions-item label="修为列表" :span="isMobile ? 1 : 2">
            {{ deleteTarget?.cultList?.length ? deleteTarget.cultList.join(', ') : '无' }}
          </a-descriptions-item>
          <a-descriptions-item label="灵石列表" :span="isMobile ? 1 : 2">
            {{ deleteTarget?.lsList?.length ? deleteTarget.lsList.join(', ') : '无' }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>

    <a-modal v-model:visible="batchDeleteModalVisible" title="确认批量删除"
      :ok-text="isMobile ? `删除(${selectedRowKeys.length})` : '确认删除'" cancel-text="取消" @ok="confirmBatchDelete"
      @cancel="cancelBatchDelete" :confirm-loading="batchDeleteLoading" :width="isMobile ? '95%' : '800px'"
      :body-style="{ padding: isMobile ? '12px' : '24px' }">
      <div class="delete-confirm-content">
        <a-alert :message="`即将删除 ${selectedRowKeys.length} 个兑换码`" description="此操作不可恢复，请仔细核对以下兑换码信息！" type="error"
          show-icon :closable="false" style="margin-bottom: 16px;" />

        <a-table v-if="!isMobile" :columns="batchDeleteTableColumns" :data-source="batchDeleteList" :pagination="false"
          size="small" :scroll="{ y: 300 }" bordered>
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'genera'">
              <a-tag :color="record.genera ? 'green' : 'orange'" size="small">
                {{ record.genera ? '通用' : '专属' }}
              </a-tag>
            </template>
            <template v-if="column.key === 'usedStatus'">
              <template v-if="record.genera">
                <a-tag :color="record.useIdList && record.useIdList.length > 0 ? 'red' : 'blue'" size="small">
                  {{ record.useIdList && record.useIdList.length > 0 ? `${record.useIdList.length}人` : '未使用' }}
                </a-tag>
              </template>
              <template v-else>
                <a-tag :color="record.useStatus === 1 ? 'red' : 'blue'" size="small">
                  {{ record.useStatus === 1 ? '已使用' : '未使用' }}
                </a-tag>
              </template>
            </template>
            <template v-if="column.key === 'forceSetting'">
              <span>{{ record.forceSetting ? '✅' : '❌' }}</span>
            </template>
            <template v-if="column.key === 'cultList'">
              <span>{{ record.cultList?.length ? record.cultList.join(', ') : '-' }}</span>
            </template>
            <template v-if="column.key === 'lsList'">
              <span>{{ record.lsList?.length ? record.lsList.join(', ') : '-' }}</span>
            </template>
          </template>
        </a-table>

        <div v-else class="mobile-delete-list">
          <a-card v-for="record in batchDeleteList" :key="record.name" size="small" class="delete-mobile-card">
            <div class="delete-card-item">
              <span class="delete-label">兑换码：</span>
              <a-tag color="red" class="delete-value">{{ record.name }}</a-tag>
            </div>
            <div class="delete-card-item">
              <span class="delete-label">类型：</span>
              <a-tag :color="record.genera ? 'green' : 'orange'" size="small">{{ record.genera ? '通用' : '专属' }}</a-tag>
            </div>
            <div class="delete-card-item">
              <span class="delete-label">使用状态：</span>
              <template v-if="record.genera">
                <a-tag :color="record.useIdList && record.useIdList.length > 0 ? 'red' : 'blue'" size="small">
                  {{ record.useIdList && record.useIdList.length > 0 ? `${record.useIdList.length}人` : '未使用' }}
                </a-tag>
              </template>
              <template v-else>
                <a-tag :color="record.useStatus === 1 ? 'red' : 'blue'" size="small">
                  {{ record.useStatus === 1 ? '已使用' : '未使用' }}
                </a-tag>
              </template>
            </div>
            <div class="delete-card-item">
              <span class="delete-label">强制：</span>
              <span class="delete-value">{{ record.forceSetting ? '✅' : '❌' }}</span>
            </div>
            <div class="delete-card-item">
              <span class="delete-label">修为：</span>
              <span class="delete-value">{{ record.cultList?.length ? record.cultList.join(', ') : '-' }}</span>
            </div>
            <div class="delete-card-item">
              <span class="delete-label">灵石：</span>
              <span class="delete-value">{{ record.lsList?.length ? record.lsList.join(', ') : '-' }}</span>
            </div>
          </a-card>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()

const CACHE_KEY = 'xiuxian_cdk_list_cache'
const CACHE_TIME_KEY = 'xiuxian_cdk_list_cache_time'
const CACHE_DURATION = 5 * 60 * 1000

const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const tableLocale = {
  triggerAsc: '',
  triggerDesc: '',
  cancelSort: '取消排序'
}

const usageTableColumns = [
  {
    title: '序号',
    key: 'index',
    width: 60,
    align: 'center'
  },
  {
    title: '使用人ID',
    key: 'userId',
    ellipsis: true
  },
  {
    title: '使用时间',
    key: 'usedTime',
    width: 180
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    align: 'center'
  }
]

const deleteModalVisible = ref(false)
const deleteTarget = ref(null)
const deleteLoading = ref(false)

const batchDeleteModalVisible = ref(false)
const batchDeleteLoading = ref(false)

const deleteUsageModalVisible = ref(false)
const deleteUsageTarget = ref(null)
const addUsageModalVisible = ref(false)
const editUsageList = ref([])
const newUsageForm = reactive({
  userId: '',
  useTime: null
})

const singleUseForm = reactive({
  isUsed: false,
  useId: '',
  useTime: null
})

const batchDeleteTableColumns = [
  {
    title: '兑换码',
    dataIndex: 'name',
    key: 'name',
    width: 120
  },
  {
    title: '类型',
    key: 'genera',
    width: 70,
    align: 'center'
  },
  {
    title: '使用状态',
    key: 'usedStatus',
    width: 80,
    align: 'center'
  },
  {
    title: '强制',
    key: 'forceSetting',
    width: 60,
    align: 'center'
  },
  {
    title: '修为',
    key: 'cultList',
    width: 120,
    ellipsis: true
  },
  {
    title: '灵石',
    key: 'lsList',
    width: 120,
    ellipsis: true
  }
]

const batchDeleteList = computed(() => {
  return cdkList.value.filter(item => selectedRowKeys.value.includes(item.name))
})

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
  let parsedValue = {}
  if (typeof cdk.value === 'string') {
    try {
      parsedValue = JSON.parse(cdk.value)
    } catch (error) {
      console.error('解析value失败:', error)
    }
  } else if (typeof cdk.value === 'object') {
    parsedValue = cdk.value
  }

  const useStatus = cdk.useStatus !== undefined ? parseInt(cdk.useStatus) : (cdk['使用状态'] ? parseInt(cdk['使用状态']) : 0)

  let useId = cdk.useId || cdk['使用ID'] || ''
  let useIdList = []

  if (useId) {
    if (typeof useId === 'string' && useId.startsWith('[')) {
      try {
        useIdList = JSON.parse(useId)
      } catch (error) {
        useIdList = [useId]
      }
    } else if (Array.isArray(useId)) {
      useIdList = useId
    } else {
      useIdList = [String(useId)]
    }
  }

  let useTime = cdk.useTime || cdk['使用时间'] || ''
  let useTimeList = []

  if (useTime) {
    if (typeof useTime === 'string' && useTime.startsWith('[')) {
      try {
        useTimeList = JSON.parse(useTime)
      } catch (error) {
        useTimeList = [useTime]
      }
    } else if (Array.isArray(useTime)) {
      useTimeList = useTime
    } else {
      useTimeList = [String(useTime)]
    }
  }

  return {
    ...cdk,
    genera: parsedValue.genera || false,
    forceSetting: parsedValue.forceSetting || false,
    cultList: parsedValue.cultList || [],
    lsList: parsedValue.lsList || [],
    useStatus: useStatus,
    useId: Array.isArray(useId) ? '' : String(useId),
    useIdList: useIdList,
    useTime: Array.isArray(useTime) ? '' : String(useTime),
    useTimeList: useTimeList
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
const cdkList = ref([])
const selectedRowKeys = ref([])
const isUpdating = ref(false)

const tableColumns = [
  {
    title: '兑换码',
    dataIndex: 'name',
    key: 'name',
    width: 120,
    ellipsis: true,
    sorter: (a, b) => a.name.localeCompare(b.name),
    sortDirections: ['ascend', 'descend']
  },
  {
    title: '类型',
    key: 'genera',
    width: 80,
    align: 'center',
    sorter: (a, b) => (a.genera === b.genera ? 0 : a.genera ? -1 : 1),
    sortDirections: ['ascend', 'descend']
  },
  {
    title: '强制设置',
    key: 'forceSetting',
    width: 90,
    align: 'center',
    sorter: (a, b) => (a.forceSetting === b.forceSetting ? 0 : a.forceSetting ? -1 : 1),
    sortDirections: ['ascend', 'descend']
  },
  {
    title: '使用状态',
    key: 'usedStatus',
    width: 100,
    align: 'center'
  },
  {
    title: '使用信息',
    key: 'usedInfo',
    width: 180
  },
  {
    title: '修为',
    key: 'cultList',
    width: 150,
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
    width: 150,
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
    align: 'center',
    fixed: 'right'
  }
]

const rowSelection = computed(() => {
  if (isMobile.value) {
    return null
  }
  return {
    selectedRowKeys: selectedRowKeys,
    onChange: (keys) => {
      selectedRowKeys.value = keys
    }
  }
})

const toggleMobileSelection = (name, checked) => {
  if (checked) {
    if (!selectedRowKeys.value.includes(name)) {
      selectedRowKeys.value = [...selectedRowKeys.value, name]
    }
  } else {
    selectedRowKeys.value = selectedRowKeys.value.filter(key => key !== name)
  }
}

const handleTableChange = (pag, filters, sorter) => {
  console.log('排序变化:', sorter)
}

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const time = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
  if (isNaN(time)) return '-'
  return dayjs.unix(time).format('YYYY-MM-DD HH:mm:ss')
}

const handleGeneraChange = (checked) => {
  if (!checked) {
    editUsageList.value = []
    singleUseForm.isUsed = false
    singleUseForm.useId = ''
    singleUseForm.useTime = null
  }
}

const showAddUsageModal = () => {
  newUsageForm.userId = ''
  newUsageForm.useTime = null
  addUsageModalVisible.value = true
}

const confirmAddUsage = () => {
  if (!newUsageForm.userId.trim()) {
    message.warning('请输入使用人ID')
    return
  }
  if (!newUsageForm.useTime) {
    message.warning('请选择使用时间')
    return
  }

  editUsageList.value.push({
    userId: newUsageForm.userId.trim(),
    useTime: String(newUsageForm.useTime.unix())
  })

  addUsageModalVisible.value = false
  message.success('添加成功')
}

const showDeleteUsageModal = (index) => {
  deleteUsageTarget.value = index
  deleteUsageModalVisible.value = true
}

const confirmDeleteUsage = () => {
  if (deleteUsageTarget.value !== null) {
    editUsageList.value.splice(deleteUsageTarget.value, 1)
    message.success('删除成功')
  }
  deleteUsageModalVisible.value = false
  deleteUsageTarget.value = null
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

const showDeleteModal = (record) => {
  deleteTarget.value = { ...record }
  deleteModalVisible.value = true
}

const confirmDelete = async () => {
  deleteLoading.value = true
  try {
    await apiRequest('/api/xiuxian/cdk?action=delete', {
      method: 'POST',
      body: JSON.stringify({
        list: [deleteTarget.value.name]
      })
    })

    message.success('删除成功')
    cdkList.value = cdkList.value.filter(item => item.name !== deleteTarget.value.name)
    selectedRowKeys.value = selectedRowKeys.value.filter(key => key !== deleteTarget.value.name)
    setCachedData(cdkList.value)
    deleteModalVisible.value = false
    deleteTarget.value = null
    fetchCdkList(true)
  } catch (error) {
    if (error.message !== '未授权') {
      message.error(error.message || '删除失败')
    }
    console.error('Error:', error)
  } finally {
    deleteLoading.value = false
  }
}

const cancelDelete = () => {
  deleteModalVisible.value = false
  deleteTarget.value = null
}

const showBatchDeleteModal = () => {
  batchDeleteModalVisible.value = true
}

const confirmBatchDelete = async () => {
  batchDeleteLoading.value = true
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
    batchDeleteModalVisible.value = false
    fetchCdkList(true)
  } catch (error) {
    if (error.message !== '未授权') {
      message.error(error.message || '批量删除失败')
    }
    console.error('Error:', error)
  } finally {
    batchDeleteLoading.value = false
  }
}

const cancelBatchDelete = () => {
  batchDeleteModalVisible.value = false
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
    { required: true, message: '请输入兑换码', trigger: 'blur' }
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

  if (data.genera) {
    editUsageList.value = data.useIdList.map((userId, index) => ({
      userId: userId,
      useTime: data.useTimeList[index] || ''
    }))
    singleUseForm.isUsed = false
    singleUseForm.useId = ''
    singleUseForm.useTime = null
  } else {
    editUsageList.value = []
    singleUseForm.isUsed = data.useStatus === 1
    singleUseForm.useId = data.useId || ''
    singleUseForm.useTime = data.useTime ? dayjs.unix(typeof data.useTime === 'string' ? parseInt(data.useTime) : data.useTime) : null
  }
}

const showAddModal = () => {
  isEdit.value = false
  setFormData({
    name: '',
    genera: false,
    forceSetting: false,
    cultList: [],
    lsList: [],
    useStatus: 0,
    useId: '',
    useIdList: [],
    useTime: '',
    useTimeList: []
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

    if (isEdit.value || formState.genera) {
      if (formState.genera) {
        postData.useStatus = 0
        postData.useId = editUsageList.value.length > 0
          ? JSON.stringify(editUsageList.value.map(item => item.userId))
          : '[]'
        postData.useTime = editUsageList.value.length > 0
          ? JSON.stringify(editUsageList.value.map(item => parseInt(item.useTime)))
          : '[]'
      } else {
        postData.useStatus = singleUseForm.isUsed ? 1 : 0
        postData.useId = singleUseForm.isUsed ? singleUseForm.useId : ''
        postData.useTime = singleUseForm.isUsed ? String(singleUseForm.useTime.unix()) : ''
      }
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

const handleResize = () => {
  checkMobile()
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)

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
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.cdk-container {
  width: 100%;
}

.toolbar {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
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

.used-info-detail {
  font-size: 12px;
  line-height: 1.5;
}

.usage-management-inline {
  width: 100%;
}

.usage-management-inline .ant-btn-dashed {
  border-style: dashed;
  color: #1677ff;
  border-color: #1677ff;
}

.usage-management-inline .ant-btn-dashed:hover {
  color: #4096ff;
  border-color: #4096ff;
}

.user-id-text {
  font-family: monospace;
  font-size: 12px;
}

.delete-usage-content {
  padding: 8px 0;
}

.mobile-cdk-list {
  display: none;
}

.cdk-mobile-card {
  margin-bottom: 12px;
  border-radius: 8px;
}

.cdk-mobile-card.selected-card {
  border-color: #1677ff;
  background-color: #f0f7ff;
}

.mobile-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.mobile-cdk-name {
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  flex: 1;
}

.mobile-type-tag {
  flex-shrink: 0;
}

.mobile-descriptions {
  margin-bottom: 12px;
}

.mobile-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.mobile-delete-list {
  max-height: 400px;
  overflow-y: auto;
}

.delete-mobile-card {
  margin-bottom: 8px;
  border-radius: 6px;
}

.delete-card-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;
  padding: 2px 0;
}

.delete-card-item:last-child {
  margin-bottom: 0;
}

.delete-label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
  flex-shrink: 0;
}

.delete-value {
  color: #1a1a1a;
  word-break: break-all;
}

.delete-confirm-content {
  padding: 8px 0;
}

.action-space {
  display: flex;
  flex-wrap: wrap;
}

.action-btn {
  padding: 4px 8px;
}

.action-text {
  margin-left: 4px;
}

.status-icon {
  font-size: 16px;
}

.list-text {
  word-break: break-all;
}

.text-muted {
  color: #999;
  font-size: 12px;
}

@media screen and (max-width: 768px) {
  .cdk-table {
    display: none;
  }

  .mobile-cdk-list {
    display: block;
    margin-top: 16px;
  }

  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-text {
    display: inline;
  }

  .hint-text {
    display: inline;
  }

  .action-text {
    display: none;
  }

  .action-btn {
    padding: 4px;
  }

  :deep(.ant-modal) {
    max-width: 100%;
    margin: 0;
    padding: 0 8px;
  }

  :deep(.ant-modal-content) {
    border-radius: 12px;
  }

  :deep(.ant-modal-header) {
    padding: 16px 16px 0;
  }

  :deep(.ant-modal-body) {
    padding: 16px;
  }

  :deep(.ant-modal-footer) {
    padding: 12px 16px;
  }

  :deep(.ant-descriptions-item-label) {
    font-size: 13px;
  }

  :deep(.ant-descriptions-item-content) {
    font-size: 13px;
  }

  .delete-descriptions {
    font-size: 13px;
  }

  .delete-mobile-card {
    padding: 8px;
  }

  .delete-card-item {
    font-size: 13px;
  }
}

@media screen and (min-width: 769px) {
  .mobile-cdk-list {
    display: none;
  }

  .cdk-table {
    display: block;
  }
}

@media screen and (min-width: 769px) and (max-width: 1024px) {
  :deep(.ant-modal) {
    max-width: 90%;
  }
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

:deep(.ant-tag) {
  font-weight: 500;
}

:deep(.ant-table-body) {
  max-height: 300px;
  overflow-y: auto;
}

@media screen and (max-width: 768px) {
  :deep(.ant-btn) {
    font-size: 13px;
    padding: 4px 12px;
  }

  :deep(.ant-btn-sm) {
    font-size: 12px;
    padding: 2px 8px;
  }

  :deep(.ant-form-item) {
    margin-bottom: 16px;
  }

  :deep(.ant-form-item-label) {
    padding-bottom: 4px;
  }

  :deep(.ant-input) {
    font-size: 16px;
  }

  :deep(.ant-switch) {
    min-width: 44px;
  }

  .action-btn,
  :deep(.ant-checkbox-wrapper) {
    min-height: 44px;
    display: flex;
    align-items: center;
  }
}
</style>