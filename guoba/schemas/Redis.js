export default [
  {
    label: 'Redis配置',
    component: 'SOFT_GROUP_BEGIN'
  },
  {
    field: 'redis.global',
    label: '全局Redis',
    helpMessage: '修改后需要重启才能生效',
    bottomHelpMessage: '挂载到云崽global.Redis不和global.redis冲突',
    component: 'Switch'
  },
  {
    field: 'redis.host',
    label: '服务器地址',
    helpMessage: '修改后需要重启才能生效',
    bottomHelpMessage: 'Redis服务器IP地址',
    component: 'Input',
    componentProps: {
      placeholder: '请输入Redis服务器地址，例如：127.0.0.1'
    }
  },
  {
    field: 'redis.port',
    label: '端口号',
    helpMessage: '修改后需要重启才能生效',
    bottomHelpMessage: 'Redis端口号',
    component: 'InputNumber',
    required: true,
    componentProps: {
      min: 1,
      max: 65535,
      placeholder: '请输入端口号'
    }
  },
  {
    field: 'redis.database',
    label: '数据库编号',
    helpMessage: '修改后需要重启才能生效',
    bottomHelpMessage: 'Redis数据库编号',
    component: 'InputNumber',
    required: true,
    componentProps: {
      min: 0,
      max: 15,
      placeholder: '请输入数据库编号'
    }
  },
  {
    field: 'redis.connectTimeout',
    label: '连接超时时间',
    helpMessage: '修改后需要重启才能生效',
    bottomHelpMessage: '连接超过时间重连',
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入连接超时时间（毫秒）',
      min: 0,
      step: 1000,
      style: {
        width: "180px"
      }
    }
  },
  {
    field: 'redis.keepAlive',
    label: '心跳间隔',
    helpMessage: '修改后需要重启才能生效',
    bottomHelpMessage: '心跳间隔',
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入心跳间隔（毫秒）',
      min: 0,
      step: 100,
      style: {
        width: "180px"
      }
    }
  },
  {
    field: 'redis.noDelay',
    label: '禁用Nagle算法',
    helpMessage: '修改后需要重启才能生效',
    bottomHelpMessage: '禁用Nagle算法，降低延迟',
    component: 'Switch'
  }
]