const Button = {
  get xiuxian() {
    return segment.button(
      [
        { text: "修炼", input: "修炼" },
        { text: "开采", input: "开采" },
        { text: "信息", input: "修仙个人信息" },
        { text: "签到", input: "修仙签到" }
      ],
      [
        { text: "切磋", input: "切磋" },
        { text: "妖兽", input: "妖兽列表" },
        { text: "闭关", input: "开始闭关" },
        { text: "出关", input: "结束闭关" }
      ],
      [
        { text: "突破", input: "突破" },
        { text: "渡劫", input: "渡劫" },
        { text: "查询", input: "查询修仙者" },
        { text: "宗门", input: "我的宗门" }
      ],
      [
        { text: "秘境", input: "秘境列表" },
        { text: "排行", input: "修仙排行" },
        { text: "储物", input: "储物袋" },
        { text: "更多", input: "修仙更多" }
      ]
    )
  },
  get sect() {
    return segment.button(
      [
        { text: "创建", input: "创建宗门" },
        { text: "加入", input: "加入宗门" },
        { text: "撤回", input: "撤销加入宗门申请" },
        { text: "退出", input: "退出宗门" }
      ],
      [
        { text: "签到", input: "宗门签到" },
        { text: "查询", input: "查询宗门" },
        { text: "列表", input: "宗门列表" },
        { text: "成员", input: "宗门成员" }
      ],
      [
        { text: "管理", input: "宗门管理" },
        { text: "供奉", input: "宗门供奉" },
        { text: "商店", input: "宗门商店" },
        { text: "排行", input: "宗门排行" }
      ],
      [
        { text: "修炼", input: "修炼" },
        { text: "开采", input: "开采" },
        { text: "信息", input: "修仙个人信息" },
        { text: "签到", input: "修仙签到" }
      ]
    )
  },
  get sectAdmin() {
    return segment.button(
      [
        { text: "成员", input: "宗门成员" },
        { text: "宗门", input: "我的宗门" },
        { text: "审核", input: "宗门审核" },
        { text: "转让", input: "转让宗门" }
      ],
      [
        { text: "商店", input: "宗门商店" },
        { text: "改名字", input: "宗门设置名称" },
        { text: "改简介", input: "宗门设置简介" },
        { text: "解散", input: "解散宗门" }
      ],
      [
        { text: "设副宗", input: "宗门设置副宗主" },
        { text: "设长老", input: "宗门设置长老" },
        { text: "设成员", input: "宗门设置成员" },
        { text: "设精英", input: "宗门设置精英" }
      ],
      [
        { text: "修炼", input: "修炼" },
        { text: "开采", input: "开采" },
        { text: "信息", input: "修仙个人信息" },
        { text: "签到", input: "修仙签到" }
      ]
    )
  },
  get startRetreat() {
    return segment.button(
      [
        { text: "确认开始闭关", input: "确认开始闭关", style: 4 }
      ],
      [
        { text: "结束闭关", input: "结束闭关" },
        { text: "查询修仙者", input: "查询修仙者" }
      ],
      [
        { text: "修炼", input: "修炼" },
        { text: "开采", input: "开采" },
        { text: "信息", input: "修仙个人信息" },
        { text: "签到", input: "修仙签到" }
      ]
    )
  },
  get stopRetreat() {
    return segment.button(
      [
        { text: "确认结束闭关", input: "确认结束闭关", style: 4 }
      ],
      [
        { text: "开始闭关", input: "开始闭关" },
        { text: "查询修仙者", input: "查询修仙者" }
      ],
      [
        { text: "修炼", input: "修炼" },
        { text: "开采", input: "开采" },
        { text: "信息", input: "修仙个人信息" },
        { text: "签到", input: "修仙签到" }
      ]
    )
  },
  get rank() {
    return segment.button(
      [
        { text: "修为榜", input: "修为榜" },
        { text: "灵石榜", input: "灵石榜" },
        { text: "战力榜", input: "战力榜" }
      ],
      [
        { text: "切磋榜", input: "切磋榜" },
        { text: "签到榜", input: "签到榜" },
        { text: "闭关榜", input: "闭关榜" }
      ]
    )
  },
  get cdk() {
    return segment.button(
      [
        { text: "生成", input: "生成兑换码" },
        { text: "使用", input: "使用兑换码" },
        { text: "删除", input: "删除兑换码" }
      ]
    )
  },
  get author() {
    return segment.button(
      [
        { text: "修仙群", link: "https://qun.qq.com/universal-share/share?ac=1&authKey=13%2FWEfX0G3PO77HgYt3w8yg8K%2BCSE3fYXzuA%2FOH0Vnzv5HDrENZctaRM1qkC07eD&busi_data=eyJncm91cENvZGUiOiI5NzY3MTkwMTciLCJ0b2tlbiI6Inl0NHY2b01BRTlMeHR4MXBYbWJqYWxpbmU5Wk9kT3VqZE1nM0dNYVZET1pBcjVPTVZ5WDVLMnVCaFpHNTFWVUgiLCJ1aW4iOiIzMzQzNzEyNTg5In0%3D&data=uDBsYAg-ZA2RbnkK_3yJFYKmiPRZg-XmEhn6iJ1tWmOfRPEeEIiA6N1o1e5p9-dqSJDSxCk44qnx92h62ZlrmQ&svctype=4&tempid=h5_group_info" },
        { text: "喵喵喵", input: "喵喵喵", style: 4 },
        { text: "魔族陌", link: "https://qm.qq.com/q/5fKlztbHHG" }
      ]
    )
  }
}
export default Button