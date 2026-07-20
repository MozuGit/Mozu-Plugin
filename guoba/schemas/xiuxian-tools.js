import Redis from '#Redis'

export default [
  {
    component: "SOFT_GROUP_BEGIN",
    label: "修仙工具"
  },
  {
    component: "Divider",
    label: "兑换码操作",
    componentProps: {
      type: "horizontal",
      style: {
        fontWeight: "bold",
        color: "rgb(76, 113, 201)",
        fontSize: "16px"
      },
      orientation: "left",
      plain: true
    }
  },
  {
    field: "tools.cdk",
    label: "兑换码",
    bottomHelpMessage: "兑换码列表",
    component: "Select",
    componentProps: {
      options: await getCdks()
    }
  },
  {
    field: 'actions',
    label: '操作',
    component: 'GButtons',
    componentProps: {
      buttons: [
        {
          label: '删除',
          action: 'removeCdk',
          type: 'default',
          danger: true,
          icon: "ant-design:delete-filled",
          confirm: {
            title: '确认删除',
            content: '确认该兑换码吗？此操作不可撤销！'
          },
          args: ['#{tools.cdk}']
        }
      ]
    }
  },
  {
    component: "Divider",
    label: "称号操作",
    componentProps: {
      type: "horizontal",
      style: {
        fontWeight: "bold",
        color: "rgb(76, 113, 201)",
        fontSize: "16px"
      },
      orientation: "left",
      plain: true
    }
  },
  {
    field: "tools.title.id",
    label: "修仙ID",
    bottomHelpMessage: "要给予称号的修仙ID",
    component: "InputNumber",
    componentProps: {
      placeholder: "请输入修仙ID",
      min: 1,
      style: {
        width: "180px"
      }
    }
  },
  {
    field: "tools.title.title",
    label: "称号文本",
    bottomHelpMessage: "要给予称号的文本",
    component: "Input",
    componentProps: {
      placeholder: "请输入称号",
      style: {
        width: "180px"
      }
    }
  },
  {
    field: "tools.title.validDay",
    label: "称号有效期",
    bottomHelpMessage: "要给予称号的有效期（单位：天，0表示永久）",
    component: "InputNumber",
    componentProps: {
      placeholder: "称号有效期（天）",
      min: 0,
      style: {
        width: "180px"
      }
    }
  },
  {
    field: 'actions',
    label: '操作',
    component: 'GButtons',
    componentProps: {
      buttons: [
        {
          label: '给予',
          action: 'addTitle',
          type: 'primary',
          icon: "ant-design:plus-circle-filled",
          args: ['#{tools.title.title}', '#{tools.title.id}', '#{tools.title.validDay}']
        }
      ]
    }
  }
]

async function getCdks() {
  const stream = Redis.scanStream({
    match: "Mozu:xiuxian:cdk:*",
    count: 100
  })
  const cdks = []
  for await (const keys of stream) {
    if (keys.length) {
      keys.forEach(key => {
        cdks.push(key.replace("Mozu:xiuxian:cdk:", ""))
      })
    }
  }
  return cdks.map(cdk => ({
    label: cdk,
    value: cdk
  }))
}