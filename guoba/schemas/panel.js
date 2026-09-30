export default [
  {
    label: '魔族陌面版',
    component: 'SOFT_GROUP_BEGIN',
  },
  {
    field: 'panel.login.host',
    label: '服务器地址',
    helpMessage: '修改后需要重启才能生效',
    bottomHelpMessage: 'auto 为自动获取本机IP地址',
    component: 'Input',
    componentProps: {
      placeholder: '请输入服务器地址',
    },
    required: true,
  },
  {
    field: 'panel.login.port',
    label: '监听端口号',
    helpMessage: '修改后需要重启才能生效',
    component: 'InputNumber',
    componentProps: {
      min: 0,
      max: 65535,
      placeholder: '请输入端口号',
    },
    required: true,
  },
  {
    field: 'panel.login.password',
    label: '面版密码',
    component: 'InputPassword',
    componentProps: {
      placeholder: '敏感信息不会展示在前端',
    },
  },
  {
    field: 'panel.login.trustProxy',
    label: '反代/CDN 信任',
    helpMessage: '修改后需要重启才能生效',
    bottomHelpMessage:
      '决定如何识别真实客户端 IP，影响登录限流。不确定就选"直连暴露"，填错只会让限流按反代 IP 统计，不会被绕过',
    component: 'RadioGroup',
    required: true,
    componentProps: {
      optionType: 'button',
      buttonStyle: 'solid',
      options: [
        { label: '直连暴露', value: false },
        { label: '一层反代', value: 1 },
        { label: 'CDN+反代', value: 2 },
        { label: '完全信任头', value: true },
      ],
    },
  },
  {
    field: 'actions',
    label: '强制关闭TOTP',
    component: 'GButtons',
    componentProps: {
      buttons: [
        {
          label: '强制关闭',
          action: 'forceClose',
          type: 'default',
          danger: true,
          icon: 'ant-design:delete-filled',
          confirm: {
            title: '强制关闭',
            content: '可用于验证器无法使用的情况',
          },
        },
      ],
    },
  },
]
