const Button = {
  get xiuxian() {
    return segment.button(
      [
        { text: "修炼", input: "修炼" },
        { text: "开采", input: "开采" },
        { text: "信息", input: "修仙个人信息" },
        { text: "签到", input: "修仙签到" }
      ], [
        { text: "切磋", input: "切磋" },
        { text: "妖兽", input: "妖兽列表" },
        { text: "闭关", input: "开始闭关" },
        { text: "出关", input: "结束闭关" }
      ], [
        { text: "突破", input: "突破" },
        { text: "渡劫", input: "渡劫" },
        { text: "查询", input: "查询修仙者" },
        { text: "宗门", input: "我的宗门" }
       ], [
        { text: "秘境", input: "秘境列表" },
        { text: "排行", input: "修仙排行" },
        { text: "储物", input: "储物袋" },
        { text: "更多", input: "修仙更多" }
      ]
    )
  },
  get zongmen() {
    return segment.button(
      [
        { text: "测试", input: "测试" }
      ]
    )
  }
}
export default Button