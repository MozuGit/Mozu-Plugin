import { xiuxian } from "../index.js"

async function xiuxianText(msg, user_id, self_id) {
    const id = await xiuxian.init(user_id)
    let Text
    if (msg === '修炼') {
        const value = await xiuxian.xiulian(id)
        const userInfo = await xiuxian.getUserInfo(id)
        if (value.cult && value.addcult) {
            Text = [
                '<@' + user_id.replace(`${self_id}:`, '') + '>',
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
                '<@' + user_id.replace(`${self_id}:`, '') + '>',
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
                '<@' + user_id.replace(`${self_id}:`, '') + '>',
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
                '<@' + user_id.replace(`${self_id}:`, '') + '>',
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
                '<@' + user_id.replace(`${self_id}:`, '') + '>',
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
                '<@' + user_id.replace(`${self_id}:`, '') + '>',
                '***',
                '**今天已经签到过了，明天再来吧**',
                '***',
                '**签到情况**',
                '>签到次数：' + userInfo.signNum + '天',
                '***',
            ].join('\n')
        }
    } else if (msg === "突破") {
        const value = await xiuxian.realmUp(id)
        const userInfo = await xiuxian.getUserInfo(id)
        if (value) {
            if (value === true) {
                Text = [
                    '<@' + user_id.replace(`${self_id}:`, '') + '>',
                    '***',
                    '**突破成功**',
                    '>成功突破到：**' + userInfo.realmName + '**',
                    '***',
                    '>[境界：' + userInfo.realmName + '](mqqapi://aio/inlinecmd?command=突破)',
                    '当前修为：' + userInfo.cult,
                    '下一境界：' + userInfo.realmName2,
                    '距离下一境界：' + ((userInfo.realmNeedExp === 0) ? '已满足[突破](mqqapi://aio/inlinecmd?command=突破)条件' : '还需' + userInfo.realmNeedExp + '点修为'),
                    '***',
                ].join('\n')
            } else {
                Text = [
                    '<@' + user_id.replace(`${self_id}:`, '') + '>',
                    '***',
                    '**突破失败**',
                    '>**修为-' + value + '**',
                    '***',
                    '>[境界：' + userInfo.realmName + '](mqqapi://aio/inlinecmd?command=突破)',
                    '当前修为：' + userInfo.cult,
                    '下一境界：' + userInfo.realmName2,
                    '距离下一境界：' + '还需' + userInfo.realmNeedExp + '点修为',
                    '***',
                ].join('\n')
            }
        } else {
            Text = [
                '<@' + user_id.replace(`${self_id}:`, '') + '>',
                '***',
                '**突破失败**',
                '>**你的修为还不足以突破**',
                '***',
                '>[境界：' + userInfo.realmName + '](mqqapi://aio/inlinecmd?command=突破)',
                '当前修为：' + userInfo.cult,
                '下一境界：' + userInfo.realmName2,
                '距离下一境界：' + '还需' + userInfo.realmNeedExp + '点修为',
                '***',
            ].join('\n')
        }
    } else if (msg = "修仙个人信息") {
        const userInfo = await xiuxian.getUserInfo(id)
        Text = [
            '<@' + user_id.replace(`${self_id}:`, '') + '>',
            '***',
            '**ID：' + id + '**',
            '**[切磋](mqqapi://aio/inlinecmd?command=切磋 ' + id + ')' + '**',
            '***',
            '>**[称号：' + userInfo.title + '](mqqapi://aio/inlinecmd?command=我的称号)**',
            '>**[性别：' + userInfo.sex + '](mqqapi://aio/inlinecmd?command=设置性别)**',
            '>**[宗门：' + userInfo.sectName + '    ID：' + userInfo.sectId + '](mqqapi://aio/inlinecmd?command=我的宗门)**',
            '***',
            '**战力：' + userInfo.power + '**',
            '>**[境界：' + userInfo.realmName + '](mqqapi://aio/inlinecmd?command=突破)**',
            '**[修为：' + userInfo.cult + '](mqqapi://aio/inlinecmd?command=修炼)**',
            '**[灵石：' + userInfo.ls + '](mqqapi://aio/inlinecmd?command=开采)**',
            '***',
            '>灵根：无',
            '灵根加成：0%',
            '功法加成：0%',
            '***'
        ].join('\n')
    } else {
        Text = [
            '<@' + user_id.replace(`${self_id}:`, '') + '>',
            '***',
            '**待更新**',
            '>**[聊天群：976719017](mqqapi://aio/inlinecmd?command=976719017)**',
            '***'
        ].join('\n')
    }
    return Text
}

export { xiuxianText }