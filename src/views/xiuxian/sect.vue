<template>
    <div class="sect-container">
        <a-card :bordered="false" class="fade-in-card">
            <div class="card-header">
                <span class="card-title">宗门管理</span>
                <div class="sect-count-badge">
                    <team-outlined style="margin-right: 4px;" />
                    <span>当前宗门总数：</span>
                    <span class="count-number">{{ totalSectCount }}</span>
                    <span>个</span>
                </div>
            </div>

            <div class="toolbar">
                <span v-if="isUpdating" class="update-hint">
                    <sync-outlined spin /> 更新中...
                </span>
                <span v-else class="update-hint-placeholder"></span>
            </div>

            <a-table :columns="columns" :data-source="sectList" :loading="loading && sectList.length === 0"
                :pagination="pagination" :locale="tableLocale" row-key="id" class="sect-table"
                @change="handleTableChange">
                <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'level'">
                        <a-tag color="blue">{{ record.level }} 级</a-tag>
                    </template>

                    <template v-if="column.key === 'noAudit'">
                        <a-tag :color="record.noAudit === 1 ? 'green' : 'default'">
                            {{ record.noAudit === 1 ? '是' : '否' }}
                        </a-tag>
                    </template>

                    <template v-if="column.key === 'desc'">
                        <span :style="{ color: record.desc === '未设置' ? '#999' : 'inherit' }">
                            {{ record.desc }}
                        </span>
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

        <a-modal v-model:visible="modalVisible" title="编辑宗门信息" ok-text="保存" cancel-text="取消" @ok="handleSubmit"
            @cancel="handleCancel" :confirm-loading="submitLoading" width="600px" :destroyOnClose="true">
            <a-form ref="formRef" :model="formState" :rules="formRules" :label-col="{ span: 4 }"
                :wrapper-col="{ span: 20 }">
                <a-form-item label="宗门ID">
                    <a-input v-model:value="formState.id" disabled />
                </a-form-item>

                <a-form-item label="宗门名称" name="name">
                    <a-input v-model:value="formState.name" placeholder="请输入宗门名称" />
                </a-form-item>

                <a-form-item label="宗门等级" name="level">
                    <a-input-number v-model:value="formState.level" :min="1" :max="maxLevel"
                        :placeholder="`请输入宗门等级（最高${maxLevel}级）`" style="width: 100%" />
                </a-form-item>

                <a-form-item label="宗门描述" name="desc">
                    <a-textarea v-model:value="formState.desc" placeholder="请输入宗门描述" :rows="4" />
                </a-form-item>

                <a-form-item label="宗门经验" name="exp">
                    <a-input-number v-model:value="formState.exp" :min="0" placeholder="请输入宗门经验值" style="width: 100%" />
                </a-form-item>

                <a-form-item label="无需审核" name="noAudit">
                    <a-switch v-model:checked="formState.noAudit" checked-children="是" un-checked-children="否" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
    TeamOutlined,
    EditOutlined,
    SyncOutlined
} from '@ant-design/icons-vue'

const router = useRouter()

const tableLocale = {
    triggerAsc: '',
    triggerDesc: '',
    cancelSort: '取消排序',
    emptyText: '暂无宗门数据'
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

const loading = ref(false)
const isUpdating = ref(false)
const sectList = ref([])
const totalSectCount = ref(0)
const maxLevel = ref(10)

const pagination = reactive({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: false,
    showTotal: (total) => `本页 ${sectList.value.length} 条，共 ${totalSectCount.value} 个宗门`
})

const columns = [
    {
        title: '宗门ID',
        dataIndex: 'id',
        key: 'id',
        width: 100,
        align: 'center'
    },
    {
        title: '宗门名称',
        dataIndex: 'name',
        key: 'name',
        width: 200,
        ellipsis: true
    },
    {
        title: '等级',
        dataIndex: 'level',
        key: 'level',
        width: 100,
        align: 'center'
    },
    {
        title: '描述',
        dataIndex: 'desc',
        key: 'desc',
        width: 250,
        ellipsis: true
    },
    {
        title: '经验值',
        dataIndex: 'exp',
        key: 'exp',
        width: 120,
        align: 'right'
    },
    {
        title: '无需审核',
        dataIndex: 'noAudit',
        key: 'noAudit',
        width: 100,
        align: 'center'
    },
    {
        title: '操作',
        key: 'action',
        width: 100,
        align: 'center',
        fixed: 'right'
    }
]

const fetchSectList = async (page = 1, silent = false) => {
    if (!silent) {
        loading.value = true
    } else {
        isUpdating.value = true
    }

    try {
        const data = await apiRequest(`/api/xiuxian/sect?action=getlist&page=${page - 1}`)

        if (data) {
            sectList.value = (data.sects || []).map(sect => ({
                ...sect,
                noAudit: sect.noAudit !== undefined ? Number(sect.noAudit) : 0
            }))
            totalSectCount.value = Number(data.sectCount) || 0
            pagination.total = totalSectCount.value
            pagination.current = page

            if (data.max_level !== undefined && data.max_level !== null) {
                maxLevel.value = Number(data.max_level)
            }
        }
    } catch (error) {
        if (error.message !== '未授权') {
            if (!silent) {
                message.error(error.message || '获取宗门列表失败')
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

const handleTableChange = (pag) => {
    if (pag.current !== pagination.current) {
        fetchSectList(pag.current, false)
    }
}

const modalVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref()

const formState = reactive({
    id: null,
    name: '',
    level: 1,
    desc: '',
    exp: 0,
    noAudit: false
})

const formRules = {
    name: [
        { required: true, message: '请输入宗门名称', trigger: 'blur' }
    ],
    level: [
        { required: true, message: '请输入宗门等级', trigger: 'change' },
        { type: 'number', min: 1, message: '等级不能小于1', trigger: 'change' }
    ],
    exp: [
        { required: true, message: '请输入宗门经验值', trigger: 'change' },
        { type: 'number', min: 0, message: '经验值不能为负数', trigger: 'change' }
    ]
}

const showEditModal = (record) => {
    formState.id = record.id
    formState.name = record.name || ''
    formState.level = Number(record.level) || 1
    formState.desc = record.desc === '未设置' ? '' : (record.desc || '')
    formState.exp = Number(record.exp) || 0
    formState.noAudit = record.noAudit === 1
    modalVisible.value = true
}

const handleSubmit = async () => {
    try {
        await formRef.value.validate()

        submitLoading.value = true

        const postData = {
            name: formState.name,
            level: String(formState.level),
            desc: formState.desc || '未设置',
            exp: String(formState.exp),
            noAudit: formState.noAudit ? 1 : 0
        }

        await apiRequest(`/api/xiuxian/sect?action=modify&sectid=${formState.id}`, {
            method: 'POST',
            body: JSON.stringify(postData)
        })

        message.success('宗门信息修改成功')
        modalVisible.value = false
        fetchSectList(pagination.current, true)
    } catch (error) {
        if (error.errorFields) {
            return
        }
        if (error.message !== '未授权') {
            message.error(error.message || '修改失败')
        }
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
        fetchSectList(pagination.current, true)
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

    fetchSectList(1, false)
    document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.sect-container {
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

.sect-count-badge {
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

.sect-count-badge:hover {
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

.sect-table {
    margin-top: 16px;
}

:deep(.ant-table-wrapper) {
    overflow-x: auto;
}

:deep(.ant-table) {
    min-width: 900px;
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

@media (max-width: 768px) {
    .card-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
    }

    .sect-count-badge {
        width: 100%;
        justify-content: center;
    }
}
</style>