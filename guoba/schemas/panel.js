export default [
  {
    label: '魔族陌面版',
    component: 'SOFT_GROUP_BEGIN'
  },
  {
    field: 'panel.login.host',
    label: '服务器地址',
    helpMessage: '修改后需要重启才能生效',
    bottomHelpMessage: 'auto 为自动获取本机IP地址',
    component: 'Input',
    componentProps: {
      placeholder: '请输入服务器地址'
    },
    required: true
  },
  {
    field: 'panel.login.port',
    label: '监听端口号',
    helpMessage: '修改后需要重启才能生效',
    component: 'InputNumber',
    componentProps: {
      min: 0,
      max: 65535,
      placeholder: '请输入端口号'
    },
    required: true
  },
  {
    field: 'panel.login.password',
    label: '面版密码',
    component: 'Input',
    componentProps: {
      placeholder: '敏感信息不会展示在前端'
    }
  }
]