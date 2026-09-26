export default [
  {
    label: '定时点赞',
    component: 'SOFT_GROUP_BEGIN',
  },
  {
    field: 'example.like.enable',
    label: '定时点赞开关',
    component: 'Switch',
  },
  {
    field: 'example.like.cron',
    label: '定时点赞cron',
    component: 'EasyCron',
    componentProps: {
      placeholder: '*表示任意，?表示不指定（月日和星期互斥）',
    },
  },
  {
    field: 'example.like.targets',
    label: '点赞目标',
    bottomHelpMessage: '机器人定时点赞的目标QQ',
    component: 'GSelectGroup',
  },
  {
    field: 'example.like.batchCount',
    label: '点赞批次',
    bottomHelpMessage: '发起点赞的次数',
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入批次',
      min: 0,
      style: {
        width: '120px',
      },
    },
  },
  {
    field: 'example.like.times',
    label: '点赞次数',
    bottomHelpMessage: '单次点赞的次数',
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入次数',
      min: 1,
      style: {
        width: '120px',
      },
    },
  },
  {
    field: 'example.like.interval',
    label: '批次间隔',
    bottomHelpMessage: '批次间隔，避免请求频率过高（单位：ms）',
    component: 'InputNumber',
    componentProps: {
      placeholder: '请输入间隔',
      min: 0,
      step: 100,
      style: {
        width: '162px',
      },
    },
  },
]
