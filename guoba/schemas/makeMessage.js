export default [
  {
    label: '伪造聊天',
    component: 'SOFT_GROUP_BEGIN',
  },
  {
    field: 'example.makeMessage.enable',
    label: '伪造聊天开关',
    component: 'Switch',
  },
  {
    field: 'example.makeMessage.onlyMaster',
    label: '仅主人使用',
    component: 'Switch',
  },
  {
    field: 'example.makeMessage.whiteQQList',
    label: '白名单QQ',
    bottomHelpMessage: '防止白名单QQ被伪造',
    component: 'GSelectFriend',
  },
  {
    field: 'example.makeMessage.repeatCount',
    label: '默认复读次数',
    bottomHelpMessage: '伪造复读时未填写参数默认次数',
    component: 'InputNumber',
    required: true,
    componentProps: {
      placeholder: '请输入默认复读次数',
      min: 0,
      style: {
        width: '162px',
      },
    },
  },
]
