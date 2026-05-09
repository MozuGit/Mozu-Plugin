const patterns = [
    "修炼",
    "开采",
    "修仙个人信息",
    "修仙签到",
    "突破",
    "渡劫",
    "开始闭关",
    "结束闭关",
    "确定开始闭关",
    "确定结束闭关"
]

export default new class {
    async getRegExp() {
        return `#?${patterns.join('|')}$`
    }
}