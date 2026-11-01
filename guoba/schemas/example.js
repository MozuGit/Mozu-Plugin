export default [
  {
    label: '功能插件',
    component: 'SOFT_GROUP_BEGIN',
  },
  {
    component: 'Divider',
    label: '发言统计',
    componentProps: {
      type: 'horizontal',
      style: {
        fontWeight: 'bold',
        color: 'rgb(76, 113, 201)',
        fontSize: '16px',
      },
      orientation: 'left',
      plain: true,
    },
  },
  {
    field: 'example.fayan.enable',
    label: '发言统计开关',
    component: 'Switch',
  },
  {
    field: 'example.fayan.sendMarkdown',
    label: '使用Markdown发送',
    bottomHelpMessage: '是否使用Markdown发送，仅QQBot生效',
    component: 'Switch',
  },
  {
    field: 'example.fayan.count',
    label: '排行榜最多显示数',
    bottomHelpMessage: '排行榜最多显示的排名数，避免刷屏',
    component: 'InputNumber',
    required: true,
    componentProps: {
      placeholder: '请输入数字',
      min: 1,
      style: {
        width: '162px',
      },
    },
  },
  {
    component: 'Divider',
    label: '伪造聊天',
    componentProps: {
      type: 'horizontal',
      style: {
        fontWeight: 'bold',
        color: 'rgb(76, 113, 201)',
        fontSize: '16px',
      },
      orientation: 'left',
      plain: true,
    },
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
  {
    component: 'Divider',
    label: '天选之人',
    componentProps: {
      type: 'horizontal',
      style: {
        fontWeight: 'bold',
        color: 'rgb(76, 113, 201)',
        fontSize: '16px',
      },
      orientation: 'left',
      plain: true,
    },
  },
  {
    field: 'example.whois.enable',
    label: '天选之人开关',
    component: 'Switch',
  },
  {
    field: 'example.whois.self_add_rate',
    label: '发起人概率',
    helpMessage: '发起人增加被选中的概率',
    component: 'Switch',
  },
  {
    component: 'Divider',
    label: '定时点赞',
    componentProps: {
      type: 'horizontal',
      style: {
        fontWeight: 'bold',
        color: 'rgb(76, 113, 201)',
        fontSize: '16px',
      },
      orientation: 'left',
      plain: true,
    },
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
    component: 'GSelectFriend',
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
