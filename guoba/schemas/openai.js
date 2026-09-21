export default [
  {
    label: 'OpenAI',
    component: 'SOFT_GROUP_BEGIN'
  },
  {
    field: 'config.openai.baseURL',
    label: 'API链接',
    component: 'Input',
    componentProps: {
      placeholder: '请输入OpenAI链接'
    }
  },
  {
    field: 'config.openai.model',
    label: '模型名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入模型名称'
    }
  },
  {
    field: 'config.openai.apiKey',
    label: 'API密钥',
    bottomHelpMessage: 'sk-***',
    component: 'Input',
    componentProps: {
      placeholder: '请输入apiKey'
    }
  }
]