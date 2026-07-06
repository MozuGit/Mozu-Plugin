export default [
  {
    component: "SOFT_GROUP_BEGIN",
    label: "修仙设置"
  },
  {
    component: "Divider",
    label: "修仙基础设置",
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
    field: "xiuxian.setting.enable",
    label: "修仙全局开关",
    component: "Switch"
  },
  {
    field: "xiuxian.setting.priority",
    label: "指令优先级",
    helpMessage: "修改后需要重启才能生效",
    bottomHelpMessage: "数字越小，优先级越大",
    component: "InputNumber",
    componentProps: {
      placeholder: "5000",
      step: 1000,
      style: {
        width: "150px"
      }
    }
  },
  {
    field: "xiuxian.setting.cronBackup",
    label: "定时备份cron",
    helpMessage: "修改后需要重启才能生效",
    bottomHelpMessage: "修仙定时备份",
    component: "EasyCron",
    componentProps: {
      placeholder: "*表示任意，?表示不指定（月日和星期互斥）"
    }
  },
  {
    field: "xiuxian.setting.master_no_cd",
    label: "主人不受冷却限制",
    bottomHelpMessage: "主人不受任何冷却限制",
    component: "Switch"
  },
  {
    field: "xiuxian.setting.forceSharp",
    label: "强制用#触发",
    helpMessage: "修改后需要重启才能生效",
    bottomHelpMessage: "前缀必须有#或/才能触发指令",
    component: "Switch"
  },
  {
    field: "xiuxian.setting.group",
    label: "是否启用群黑白名单",
    component: "RadioGroup",
    required: true,
    componentProps: {
      options: [
        { label: "不启用", value: 0 },
        { label: "黑名单", value: 1 },
        { label: "白名单", value: 2 },
      ]
    }
  },
  {
    field: "xiuxian.setting.blackGroup",
    label: "黑名单群",
    bottomHelpMessage: "黑名单群不触发任何指令",
    component: "GSelectGroup"
  },
  {
    field: "xiuxian.setting.whiteGroup",
    label: "白名单群",
    bottomHelpMessage: "仅白名单群能触发指令",
    component: "GSelectGroup"
  },
  {
    field: "xiuxian.setting.TextStyle",
    label: "输出文本样式",
    bottomHelpMessage: "发送消息的文本",
    component: "RadioGroup",
    required: true,
    componentProps: {
      options: [
        { label: "普通文本", value: 0 },
        { label: "Markdown", value: 1 },
      ]
    }
  },
  {
    component: "Divider",
    label: "修仙玩法设置",
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
    field: "xiuxian.xiuxian.xiulian",
    label: "修炼CD",
    bottomHelpMessage: "修炼冷却时间（单位：秒）",
    component: "InputNumber",
    componentProps: {
      placeholder: "请输入修炼冷却时间（单位：秒）",
      min: 0,
      step: 10
    }
  },
  {
    field: "xiuxian.xiuxian.kaicai",
    label: "开采CD",
    bottomHelpMessage: "开采冷却时间（单位：秒）",
    component: "InputNumber",
    componentProps: {
      placeholder: "请输入开采冷却时间（单位：秒）",
      min: 0,
      step: 10
    }
  },
  {
    field: 'xiuxian.xiuxian.powerFormula',
    label: '战力计算公式',
    bottomHelpMessage: '变量：修为cult 境界realm',
    component: 'Input',
    componentProps: {
      placeholder: '请输入战力计算公式'
    }
  },
  {
    field: "xiuxian.xiuxian.range",
    label: "上限下限",
    component: "GSubForm",
    componentProps: {
      modalProps: {
        title: "修为&灵石的上限下限"
      },
      style: {
        maxHeight: "200px",
        overflowY: "auto"
      },
      schemas: [
        {
          field: "maxcult",
          label: "修为上限",
          bottomHelpMessage: "修炼单次随机修为上限",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入修为上限",
            min: 0,
            step: 100,
            style: {
              width: "180px"
            }
          }
        },
        {
          field: "mincult",
          label: "修为下限",
          bottomHelpMessage: "修炼单次随机修为下限",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入修为下限",
            min: 0,
            step: 100,
            style: {
              width: "180px"
            }
          }
        },
        {
          field: "maxls",
          label: "灵石上限",
          bottomHelpMessage: "开采单次随机灵石上限",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入灵石上限",
            min: 0,
            step: 100,
            style: {
              width: "180px"
            }
          }
        },
        {
          field: "minls",
          label: "灵石下限",
          bottomHelpMessage: "开采单次随机灵石下限",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入灵石下限",
            min: 0,
            step: 100,
            style: {
              width: "180px"
            }
          }
        }
      ]
    }
  },
  {
    field: "xiuxian.xiuxian.retreat",
    label: "闭关配置",
    component: "GSubForm",
    componentProps: {
      modalProps: {
        title: "闭关配置"
      },
      style: {
        maxHeight: "100px",
        overflowY: "auto"
      },
      schemas: [
        {
          field: "cult",
          label: "每小时闭关修为",
          bottomHelpMessage: "每小时闭关获得的修为",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入每小时闭关获得的修为",
            min: 0,
            step: 100,
            style: {
              width: "180px"
            }
          }
        },
        {
          field: "max",
          label: "闭关上限",
          bottomHelpMessage: "单次闭关时间上限（上限后奖励不能再叠加）",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入闭关时间上限（单位：时）",
            min: 0,
            step: 1,
            style: {
              width: "100px"
            }
          }
        }
      ]
    }
  },
  {
    field: "xiuxian.xiuxian.sign",
    label: "签到配置",
    component: "GSubForm",
    componentProps: {
      modalProps: {
        title: "修仙签到配置"
      },
      style: {
        maxHeight: "100px",
        overflowY: "auto"
      },
      schemas: [
        {
          field: "cult",
          label: "修为",
          bottomHelpMessage: "每天签到获得的修为",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入每天签到的修为",
            min: 0,
            step: 100,
            style: {
              width: "180px"
            }
          }
        },
        {
          field: "ls",
          label: "灵石",
          bottomHelpMessage: "每天签到获得的灵石",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入每天签到的灵石",
            min: 0,
            step: 100,
            style: {
              width: "180px"
            }
          }
        }
      ]
    }
  },
  {
    field: "xiuxian.xiuxian.pvp",
    label: "切磋配置",
    component: "GSubForm",
    componentProps: {
      modalProps: {
        title: "修仙切磋配置"
      },
      style: {
        maxHeight: "100px",
        overflowY: "auto"
      },
      schemas: [
        {
          field: "atk_cd",
          label: "发起方CD",
          bottomHelpMessage: "发起方CD内只能发起一次切磋",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入发起方CD",
            min: 0,
            step: 10,
            style: {
              width: "180px"
            }
          }
        },
        {
          field: "def_cd",
          label: "被动方CD",
          bottomHelpMessage: "被动方CD内只能被切磋一次",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入被动方CD",
            min: 0,
            step: 10,
            style: {
              width: "180px"
            }
          }
        }
      ]
    }
  },
  {
    component: "Divider",
    label: "修仙境界设置",
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
    field: "xiuxian.realm",
    label: "修仙境界配置",
    helpMessage: "修改后需要重启才能生效",
    component: "GSubForm",
    componentProps: {
      multiple: true,
      schemas: [
        {
          field: "name",
          label: "境界名称",
          component: "Input",
          bottomHelpMessage: "修仙境界名称",
          componentProps: {
            placeholder: "请输入境界名称"
          },
          required: true
        },
        {
          field: "value",
          label: "修为",
          bottomHelpMessage: "突破境界所需的修为",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入突破境界所需修为",
            min: 0,
            step: 100,
            style: {
              width: "180px"
            }
          },
          required: true
        },
        {
          field: "success",
          label: "成功概率",
          bottomHelpMessage: "突破境界的概率（0-100）",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入突破境界的概率",
            min: 0,
            max: 100
          },
          required: true
        },
        {
          field: "failed",
          label: "突破失败",
          bottomHelpMessage: "突破失败扣除的修为",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入扣除的修为",
            min: 0,
            step: 100,
            style: {
              width: "180px"
            }
          },
          required: true
        }
      ]
    }
  },
  {
    component: "Divider",
    label: "修仙宗门设置",
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
    field: "xiuxian.sect.sect_up_reset",
    label: "宗门升级经验重置",
    component: "Switch",
    bottomHelpMessage: "宗门升级后经验设置为0"
  },
  {
    field: "xiuxian.sect.create_sect_ls",
    label: "创建宗门需要灵石",
    component: "InputNumber",
    bottomHelpMessage: "创建宗门需要的灵石",
    componentProps: {
      placeholder: "请输入创建宗门需要的灵石",
      min: 0,
      step: 1000,
      style: {
        width: "180px"
      }
    },
    required: true
  },
  {
    field: "xiuxian.sect.sect_level",
    label: "宗门等级配置",
    bottomHelpMessage: "宗门等级配置一行一级",
    component: "GSubForm",
    componentProps: {
      multiple: true,
      schemas: [
        {
          field: "up_exp",
          label: "宗门升级经验",
          bottomHelpMessage: "宗门升级所需的经验",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入宗门升级经验",
            min: 0,
            step: 100,
            style: {
              width: "180px"
            }
          },
          required: true
        },
        {
          field: "memberMax",
          label: "宗门人数上限",
          component: "InputNumber",
          componentProps: {
            placeholder: "请输入宗门人数上限",
            min: 0,
            step: 1,
            style: {
              width: "180px"
            }
          },
          required: true
        },
        {
          field: "sign",
          label: "宗门签到奖励",
          component: "GSubForm",
          componentProps: {
            modalProps: {
              title: "宗门签到奖励"
            },
            style: {
              maxHeight: "200px",
              overflowY: "auto"
            },
            schemas: [
              {
                field: "cult",
                label: "修为",
                bottomHelpMessage: "宗门每日签到获取的修为",
                component: "InputNumber",
                componentProps: {
                  placeholder: "请输入宗门签到修为",
                  min: 0,
                  step: 1000,
                  style: {
                    width: "180px"
                  }
                },
                required: true
              },
              {
                field: "ls",
                label: "灵石",
                bottomHelpMessage: "宗门每日签到获取的灵石",
                component: "InputNumber",
                componentProps: {
                  placeholder: "请输入宗门签到灵石",
                  min: 0,
                  step: 1000,
                  style: {
                    width: "180px"
                  }
                },
                required: true
              },
              {
                field: "sectExp",
                label: "宗门经验",
                bottomHelpMessage: "宗门每日签到获取的宗门经验",
                component: "InputNumber",
                componentProps: {
                  placeholder: "请输入宗门签到经验",
                  min: 0,
                  step: 1000,
                  style: {
                    width: "180px"
                  }
                },
                required: true
              }
            ]
          }
        }
      ]
    },
    required: true
  }
]