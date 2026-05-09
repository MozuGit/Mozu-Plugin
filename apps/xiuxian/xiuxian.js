import { xxRegExp, xiuxian, Button } from "../../model/xiuxian/index.js"
import { Config } from "../../model/xiuxian/tool/Config/Config.js"
import Redis from '#Redis'

const prefix = Config.setting.forceSharp ? '^#' : '^#?'
const xiuxianRegExp = new RegExp(`${prefix}${await xxRegExp.getRegExp()}$`)

export class MozuXiuxian extends plugin {
	constructor() {
		super({
			name: '魔族陌修仙',
			dsc: '魔族陌修仙',
			event: 'message',
			priority: -Infinity,
		})
		this.rule.push(
			{
				reg: xiuxianRegExp,
				fnc: 'xiuxian'
			},
			{
				reg: '^#?重置修仙数据$',
				fnc: 'clear'
			}
		)
	}

    async xiuxian(e) {
		if (!['QQBot'].includes(e?.bot?.adapter?.name)) return false
		return await this.e.reply([await this.xiuxianText(e), Button.xiuxian])
	}

	async clear(e) {
		if(this.e.isMaster && ['QQBot'].includes(e?.bot?.adapter?.name)) {
			const keys = await Redis.keys("Mozu:xiuxian:*")
        	if (keys.length) await Redis.del(keys)
			this.e.reply([`重置成功，清除了${keys.length}个键`, segment.button([{ text: "重置修仙数据", callback: "重置修仙数据" }])])
		}
	}

	/**
	 * 修仙文本处理函数
	 */
	async xiuxianText(e) {
		const msg = e.msg
		const id = await xiuxian.init(this.e.user_id)
		let Text
		if (msg === '修炼') {
			const value = await xiuxian.xiulian(id)
			const userInfo = await xiuxian.getUserInfo(id)
			if (value.cult && value.addcult) {
				Text = [
					'<@' + this.e.user_id.replace(`${this.e.self_id}:`, '') + '>',
					'***',
					'**ID：' + id + '**',
					'**[切磋](mqqapi://aio/inlinecmd?command=切磋 ' + id + ')' + '**',
					'***',
					'**[修炼完成](mqqapi://aio/inlinecmd?command=修炼)**',
					'>获得修为' + value.addcult + '点',
					'***',
					'>**[称号：' + userInfo.title + '](mqqapi://aio/inlinecmd?command=我的称号)**',
					'>**[性别：' + userInfo.sex + '](mqqapi://aio/inlinecmd?command=设置性别)**',
					'>**[宗门：' + userInfo.sectName + '    ID：' + userInfo.sectId + '](mqqapi://aio/inlinecmd?command=我的宗门)**',
					'***',
					'>[境界：' + userInfo.realmName + '](mqqapi://aio/inlinecmd?command=突破)',
					'当前修为：' + userInfo.cult,
					'下一境界：' + userInfo.realmName2,
					'距离下一境界：' + ((userInfo.realmNeedExp === 0) ? '已满足[突破](mqqapi://aio/inlinecmd?command=突破)条件' : '还需' + userInfo.realmNeedExp + '点修为'),
					'***'
				].join('\n')
			} else {
				Text = [
					'<@' + this.e.user_id.replace(`${this.e.self_id}:`, '') + '>',
					'***',
					'**当前正在CD中...**',
					'>剩余：' + value.outTime + '秒',
					'***',
				].join('\n')
			}
		} else if (msg === '开采') {
			const value = await xiuxian.kaicai(id)
			const userInfo = await xiuxian.getUserInfo(id)
			if (value.ls && value.addls) {
				Text = [
					'<@' + this.e.user_id.replace(`${this.e.self_id}:`, '') + '>',
					'***',
					'**ID：' + id + '**',
					'**[切磋](mqqapi://aio/inlinecmd?command=切磋 ' + id + ')' + '**',
					'***',
					'**[开采完成](mqqapi://aio/inlinecmd?command=开采)**',
					'>获得' + value.addls + '灵石',
					'***',
					'>**[称号：' + userInfo.title + '](mqqapi://aio/inlinecmd?command=我的称号)**',
					'>**[性别：' + userInfo.sex + '](mqqapi://aio/inlinecmd?command=设置性别)**',
					'>**[宗门：' + userInfo.sectName + '    ID：' + userInfo.sectId + '](mqqapi://aio/inlinecmd?command=我的宗门)**',
					'***'
				].join('\n')
			} else {
				Text = [
					'<@' + this.e.user_id.replace(`${this.e.self_id}:`, '') + '>',
					'***',
					'**当前正在CD中...**',
					'>剩余：' + value.outTime + '秒',
					'***',
				].join('\n')
			}
		} else if (msg === '修仙签到') {
			const value = await xiuxian.sign(id)
			const userInfo = await xiuxian.getUserInfo(id)
			if (value) {
				Text = [
					'<@' + this.e.user_id.replace(`${this.e.self_id}:`, '') + '>',
					'***',
					'**ID：' + id + '**',
					'**[切磋](mqqapi://aio/inlinecmd?command=切磋 ' + id + ')' + '**',
					'***',
					'**[今日签到成功](mqqapi://aio/inlinecmd?command=修仙签到)**',
					'***',
					'**签到情况**',
					'>签到次数：' + userInfo.signNum + '天',
					'***',
					'**每日签到奖励**',
					'>修为' + value.addcult,
					'灵石' + value.addls,
					'***'
				].join('\n')
			} else {
				Text = [
					'<@' + this.e.user_id.replace(`${this.e.self_id}:`, '') + '>',
					'***',
					'**今天已经签到过了，明天再来吧**',
					'***',
					'**签到情况**',
					'>签到次数：' + userInfo.signNum + '天',
					'***',
				].join('\n')
			}
		} else {
			Text = [
					'<@' + this.e.user_id.replace(`${this.e.self_id}:`, '') + '>',
					'***',
					'**待更新**',
					'>**[聊天群：976719017](mqqapi://aio/inlinecmd?command=976719017)**',
					'***'
				].join('\n')
		}
		return Text
	}

}