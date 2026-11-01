export default [
  {
    label: '官机群管',
    component: 'SOFT_GROUP_BEGIN',
  },
  {
    field: 'groupAdmin.setting.enable',
    label: '启用群管',
    bottomHelpMessage: '启用官机（QQBot）群管',
    component: 'Switch',
  },
  {
    field: 'groupAdmin.setting.priority',
    label: '群管优先级',
    bottomHelpMessage: '官机群管指令优先级',
    component: 'InputNumber',
    componentProps: {
      placeholder: '数字越低，优先级越高',
      style: {
        width: '120px',
      },
    },
  },
]
