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
        <a-button :class="{ active: currentPage === 'cdk' }" @click="navigateTo('cdk')">
          <template #icon>
            <gift-outlined />
          </template>
          兑换码操作
        </a-button>
        <a-button type="primary" :class="{ active: currentPage === 'player' }" @click="navigateTo('player')">
          <template #icon>
            <team-outlined />
          </template>
          玩家管理
        </a-button>
      </div>
    </div>

    <a-card :bordered="false" class="fade-in-card">
      <div class="card-header">
        <span class="card-title">玩家管理</span>
        <div class="player-count-badge">
          <team-outlined style="margin-right: 4px;" />
          <span>当前玩家总数：</span>
          <span class="count-number">{{ totalPlayerCount }}</span>
          <span>人</span>
        </div>
      </div>

      <div class="toolbar">
        <span v-if="isUpdating" class="update-hint">
          <sync-outlined spin /> 更新中...
        </span>
        <span v-else class="update-hint-placeholder"></span>
      </div>

      <a-table 
        :columns="columns" 
        :data-source="playerList" 
        :loading="loading && playerList.length === 0"
        :pagination="pagination"
        :locale="tableLocale" 
        row-key="id" 
        class="player-table"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'currentTitle'">
            <a-tag v-if="record.titleIndex !== undefined && record.titleIndex !== null && record.titleIndex >= 0 && record.titles && record.titles[record.titleIndex]" color="purple">
              {{ record.titles[record.titleIndex].title }}
            </a-tag>
            <span v-else style="color: #999;">-</span>
          </template>

          <template v-if="column.key === 'realm'">
            <span>{{ getRealmName(record.realm) }}</span>
          </template>

          <template v-if="column.key === 'action'">
            <a-button type="link" size="small" @click="showEditModal(record)">
              <template #icon>
                <edit-outlined />
              </template>
              编辑
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal 
      v-model:visible="modalVisible" 
      title="编辑玩家信息" 
      ok-text="保存"
      cancel-text="取消" 
      @ok="handleSubmit" 
      @cancel="handleCancel" 
      :confirm-loading="submitLoading" 
      width="700px"
      :destroyOnClose="true"
    >
      <a-form ref="formRef" :model="formState" :rules="formRules" :label-col="{ span: 5 }" :wrapper-col="{ span: 19 }">
        <a-form-item label="修仙ID">
          <a-input v-model:value="formState.id" disabled />
        </a-form-item>

        <a-form-item label="修为" name="cult">
          <a-input v-model:value="formState.cult" placeholder="请输入修为值" />
        </a-form-item>

        <a-form-item label="灵石" name="ls">
          <a-input v-model:value="formState.ls" placeholder="请输入灵石数量" />
        </a-form-item>

        <a-form-item label="境界" name="realm">
          <a-select 
            v-model:value="formState.realm" 
            placeholder="请选择境界"
            show-search
            option-filter-prop="label"
            :options="realmOptions"
          />
        </a-form-item>

        <a-form-item label="性别" name="sex">
          <a-select v-model:value="formState.sex" placeholder="请选择性别">
            <a-select-option value="男">男</a-select-option>
            <a-select-option value="女">女</a-select-option>
            <a-select-option value="未设置">未设置</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="当前使用称号" name="titleIndex">
          <a-select 
            v-model:value="formState.titleIndex" 
            placeholder="请选择当前使用的称号"
          >
            <a-select-option :value="-1">无</a-select-option>
            <a-select-option 
              v-for="(title, index) in formState.titles" 
              :key="index" 
              :value="index"
              :disabled="!title.title || title.title.trim() === ''"
            >
              {{ title.title || `未命名称号${index + 1}` }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="称号列表">
          <div class="title-editor">
            <div v-for="(title, index) in formState.titles" :key="index" class="title-item">
              <div class="title-row">
                <div class="title-field">
                  <label class="title-label">称号名称：</label>
                  <a-input 
                    v-model:value="title.title" 
                    placeholder="请输入称号名称" 
                    style="flex: 1;"
                    @change="updateTitleOptions"
                  />
                </div>
                
                <div class="title-field">
                  <label class="title-label">获得时间：</label>
                  <div class="time-picker-group">
                    <a-date-picker 
                      v-model:value="title.getDate"
                      show-time
                      format="YYYY-MM-DD HH:mm:ss"
                      placeholder="选择获得时间"
                      style="flex: 1;"
                      @change="(date) => handleGetDateChange(index, date)"
                    />
                    <a-button 
                      size="small" 
                      @click="setCurrentTime(index)"
                      title="设置为当前时间"
                    >
                      现在
                    </a-button>
                  </div>
                </div>
                
                <div class="title-field">
                  <label class="title-label">到期时间：</label>
                  <div class="expire-time-group">
                    <a-switch 
                      v-model:checked="title.isPermanent" 
                      checked-children="永久" 
                      un-checked-children="限时"
                      @change="(checked) => handlePermanentChange(index, checked)"
                    />
                    <a-date-picker 
                      v-if="!title.isPermanent"
                      v-model:value="title.validDate"
                      show-time
                      format="YYYY-MM-DD HH:mm:ss"
                      placeholder="选择到期时间"
                      style="flex: 1;"
                      :disabledDate="disabledDate"
                      @change="(date) => handleValidDateChange(index, date)"
                    />
                  </div>
                </div>
                
                <a-button 
                  type="text" 
                  danger 
                  @click="removeTitle(index)"
                  class="remove-title-btn"
                >
                  <delete-outlined />
                </a-button>
              </div>
            </div>
            
            <a-button type="dashed" block @click="addTitle" style="margin-top: 12px;">
              <template #icon><plus-outlined /></template>
              添加称号
            </a-button>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  HomeOutlined,
  SettingOutlined,
  GiftOutlined,
  TeamOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

const tableLocale = {
  triggerAsc: '',
  triggerDesc: '',
  cancelSort: '取消排序',
  emptyText: '暂无玩家数据'
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
  if (data.success && data.data !== undefined) {
    return data.data
  } else if (data.success) {
    return data
  } else {
    throw new Error(data.message || '操作失败')
  }
}

const currentPage = computed(() => {
  if (route.path === '/xiuxian/config') return 'config'
  if (route.path === '/xiuxian/cdk') return 'cdk'
  if (route.path === '/xiuxian/player') return 'player'
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
    case 'player':
      router.push('/xiuxian/player')
      break
  }
}

const loading = ref(false)
const isUpdating = ref(false)
const playerList = ref([])
const realmMap = ref({})
const realmOptions = ref([])
const totalPlayerCount = ref(0)

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: false,
  showTotal: (total) => `本页 ${playerList.value.length} 条，共 ${totalPlayerCount.value} 名玩家`
})

const columns = [
  {
    title: '修仙ID',
    dataIndex: 'id',
    key: 'id',
    width: 95
  },
  {
    title: '修为',
    dataIndex: 'cult',
    key: 'cult',
    width: 120, 
    ellipsis: true
  },
  {
    title: '灵石',
    dataIndex: 'ls',
    key: 'ls',
    width: 120, 
    ellipsis: true
  },
  {
    title: '境界',
    dataIndex: 'realm',
    key: 'realm',
    width: 130,
    ellipsis: true
  },
  {
    title: '性别',
    dataIndex: 'sex',
    key: 'sex',
    width: 80,
    align: 'center'
  },
  {
    title: '当前称号',
    key: 'currentTitle',
    width: 120,
    ellipsis: true
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
    align: 'center',
    fixed: 'right'
  }
]

const fetchRealmMap = async () => {
  try {
    const data = await apiRequest('/api/xiuxian/player?action=getrealm')
    if (data && typeof data === 'object') {
      realmMap.value = data
      const options = Object.entries(data).map(([key, value]) => ({
        value: key,
        label: value
      }))
      realmOptions.value = options.sort((a, b) => parseInt(a.value) - parseInt(b.value))
    }
  } catch (error) {
    message.warning('境界数据加载失败，将显示原始数值')
  }
}

const getRealmName = (realmValue) => {
  if (!realmValue && realmValue !== '0') return '-'
  const key = String(realmValue)
  return realmMap.value[key] || `未知境界(${key})`
}

const formatTimestamp = (timestamp) => {
  if (!timestamp || timestamp === 0) return '-'
  return dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

const fetchPlayerList = async (page = 1, silent = false) => {
  if (!silent) {
    loading.value = true
  } else {
    isUpdating.value = true
  }
  
  try {
    const data = await apiRequest(`/api/xiuxian/player?action=getlist&page=${page - 1}`)
    
    if (data) {
      if (data.players) {
        playerList.value = data.players.map(player => ({
          ...player,
          titleIndex: player.titleIndex !== undefined ? Number(player.titleIndex) : -1,
          titles: player.titles || []
        }))
      }
      
      if (data.playerCount !== undefined && data.playerCount !== null) {
        totalPlayerCount.value = Number(data.playerCount)
        pagination.total = totalPlayerCount.value
      } else if (pagination.total === 0 || totalPlayerCount.value === 0) {
        const estimatedTotal = Math.max(
          (page - 1) * pagination.pageSize + playerList.value.length,
          playerList.value.length
        )
        totalPlayerCount.value = estimatedTotal
        pagination.total = estimatedTotal
      }
      
      pagination.current = page
    }
  } catch (error) {
    if (error.message !== '未授权') {
      if (!silent) {
        message.error(error.message || '获取玩家列表失败')
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

const handleTableChange = (pag, filters, sorter) => {
  if (pag.current !== pagination.current) {
    fetchPlayerList(pag.current, false)
  }
}

const modalVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref()

const formState = reactive({
  id: '',
  cult: '',
  ls: '',
  realm: '',
  sex: '未设置',
  titleIndex: -1,
  titles: []
})

const formRules = {
  cult: [
    { required: true, message: '请输入修为值', trigger: 'blur' },
    { pattern: /^\d+$/, message: '请输入有效数字', trigger: 'blur' }
  ],
  ls: [
    { required: true, message: '请输入灵石数量', trigger: 'blur' },
    { pattern: /^\d+$/, message: '请输入有效数字', trigger: 'blur' }
  ],
  realm: [
    { required: true, message: '请选择境界', trigger: 'change' }
  ],
  sex: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ]
}

const disabledDate = (current) => {
  return current && current < dayjs().startOf('day')
}

const updateTitleOptions = () => {
}

const setCurrentTime = (index) => {
  const now = dayjs()
  formState.titles[index].getDate = now
  formState.titles[index].getTime = now.unix()
}

const handleGetDateChange = (index, date) => {
  if (date) {
    formState.titles[index].getTime = date.unix()
  } else {
    formState.titles[index].getTime = 0
  }
}

const handlePermanentChange = (index, checked) => {
  if (checked) {
    formState.titles[index].validDate = null
    formState.titles[index].validTime = 0
  } else {
    const defaultDate = dayjs().add(30, 'day')
    formState.titles[index].validDate = defaultDate
    formState.titles[index].validTime = defaultDate.unix()
  }
}

const handleValidDateChange = (index, date) => {
  if (date) {
    formState.titles[index].validTime = date.unix()
  } else {
    formState.titles[index].validTime = 0
  }
}

const showEditModal = (record) => {
  formState.id = record.id
  formState.cult = record.cult || '0'
  formState.ls = record.ls || '0'
  formState.realm = String(record.realm) || '0'
  formState.sex = record.sex || '未设置'
  formState.titleIndex = record.titleIndex !== undefined ? record.titleIndex : -1
  
  formState.titles = (record.titles || []).map(title => ({
    title: title.title || '',
    getTime: title.getTime || 0,
    getDate: title.getTime > 0 ? dayjs.unix(title.getTime) : null, 
    validTime: title.validTime || 0,
    isPermanent: title.validTime === 0,
    validDate: title.validTime > 0 ? dayjs.unix(title.validTime) : null
  }))
  
  modalVisible.value = true
}

const addTitle = () => {
  const now = dayjs()
  formState.titles.push({
    title: '',
    getTime: now.unix(),
    getDate: now,
    validTime: 0,
    isPermanent: true,
    validDate: null
  })
}

const removeTitle = (index) => {
  formState.titles.splice(index, 1)
  
  if (formState.titles.length === 0) {
    formState.titleIndex = -1
  } else if (formState.titleIndex >= formState.titles.length) {
    formState.titleIndex = formState.titles.length - 1
  } else if (formState.titleIndex === index) {
    formState.titleIndex = -1
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    for (let i = 0; i < formState.titles.length; i++) {
      if (!formState.titles[i].title || formState.titles[i].title.trim() === '') {
        message.warning(`请填写第${i + 1}个称号的名称`)
        return
      }
    }
    
    submitLoading.value = true

    const postData = {
      cult: formState.cult,
      ls: formState.ls,
      realm: formState.realm,
      sex: formState.sex,
      titleIndex: formState.titleIndex,
      titles: formState.titles.map(t => ({
        title: t.title,
        getTime: Number(t.getTime),
        validTime: Number(t.validTime)
      }))
    }

    await apiRequest(`/api/xiuxian/player?action=modify&id=${formState.id}`, {
      method: 'POST',
      body: JSON.stringify(postData)
    })

    message.success('玩家信息修改成功')
    modalVisible.value = false
    
    fetchPlayerList(pagination.current, true)
  } catch (error) {
    if (error.errorFields) {
      return
    }
    if (error.message !== '未授权') {
      message.error(error.message || '修改失败')
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
    fetchPlayerList(pagination.current, true)
  }
}

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    message.warning('请先登录')
    router.push('/login')
    document.title = '魔族陌 - 登录'
    return
  }

  await fetchRealmMap()
  fetchPlayerList(1, false)
  
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

.player-count-badge {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.player-count-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
}

.count-number {
  font-size: 20px;
  font-weight: 700;
  margin: 0 4px;
  color: #ffd700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.update-hint {
  color: #1677ff;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.update-hint-placeholder {
  height: 20px;
}

.player-table {
  margin-top: 16px;
}

:deep(.ant-table-wrapper) {
  overflow-x: auto;
}

:deep(.ant-table) {
  min-width: 700px;
}

.title-editor {
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  max-height: 500px;
  overflow-y: auto;
}

.title-item {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #e8e8e8;
}

.title-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.title-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.title-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-label {
  min-width: 70px;
  font-size: 13px;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
}

.time-picker-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.expire-time-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.remove-title-btn {
  position: absolute;
  top: 0;
  right: 0;
  color: #ff4d4f;
}

.remove-title-btn:hover {
  color: #ff7875;
  background: rgba(255, 77, 79, 0.1);
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

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .player-count-badge {
    width: 100%;
    justify-content: center;
  }

  .title-field {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .title-label {
    min-width: auto;
  }
  
  .time-picker-group,
  .expire-time-group {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .remove-title-btn {
    position: static;
    align-self: flex-end;
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

:deep(.ant-modal-body) {
  max-height: 70vh;
  overflow-y: auto;
}
</style>