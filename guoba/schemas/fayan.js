export default [
  {
    label: '发言统计',
    component: 'SOFT_GROUP_BEGIN'
  },
  {
    field: 'fayan.enable',
    label: '发言统计开关',
    component: 'Switch'
  },
  {
    field: 'fayan.sendMarkdown',
    label: '使用Markdown发送',
    bottomHelpMessage: '是否使用Markdown发送，仅QQBot生效',
    component: 'Switch'
  },
  {
    field: 'fayan.count',
    label: '排行榜最多显示数',
    bottomHelpMessage: '排行榜最多显示的排名数，避免刷屏',
    component: 'InputNumber',
    required: true,
    componentProps: {
      placeholder: '请输入数字',
      min: 1,
      style: {
        width: "162px"
      }
    }
  }
]