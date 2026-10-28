<div align="center">

<img src="./public/Mo.png" width="256" height="256" alt="Mozu-Plugin" /><br>

# Mozu-Plugin

[![Stars](https://img.shields.io/github/stars/MozuGit/Mozu-Plugin?style=flat)](https://github.com/MozuGit/Mozu-Plugin/stargazers)
[![Version](https://img.shields.io/github/package-json/v/MozuGit/Mozu-Plugin?style=flat)](package.json)
[![License](https://img.shields.io/github/license/MozuGit/Mozu-Plugin?style=flat)](LICENSE)
[![Docs](https://img.shields.io/badge/Docs-mozumiao.com-1677ff?style=flat)](https://mozumiao.com)

</div>

> [!TIP]
> 如果您觉得我们的项目有帮助，请给我们一个星星（Starred）！您的支持对我们非常重要，将激励我们不断改进和提供更好的内容。谢谢！🙏

<br><img src="https://count.getloli.com/get/@:Mozu-Plugin?theme=rule34" alt="访问计数" /><br>

一个适用于 [TRSS-Yunzai](https://github.com/TimeRainStarSky/Yunzai) 的 **自用向** 机器人娱乐插件，主打 [魔族陌修仙](apps/xiuxian/)，并自带 [魔族陌面版](server/) 管理台。

- **玩法**：修仙（境界 / 宗门 / 妖兽 / 秘境 / 兑换码）、官机群管、天选之人、伪造聊天、发言统计、定时点赞、QQBot 接口
- **配置**：支持锅巴面板，也可以用自带面版管理修仙数据
- **文档**：<https://mozumiao.com>（[目录导航](https://mozumiao.com/guide/)）
- **反馈**：代码未经过深度测试，有问题请提交 [Issues](https://github.com/MozuGit/Mozu-Plugin/issues)

> [!IMPORTANT]
> 修仙、官机群管、天选之人、修仙备份仅支持 **QQBot 适配器**；发言统计、伪造聊天等普通 OneBot 适配器即可（伪造聊天在 QQBot 下不可用）。

## 安装教程

需要 **TRSS-Yunzai**、**Node.js >= 21** 和 **Redis**；修仙等功能还需要 QQBot 适配器。

1. 在 Yunzai 根目录克隆：

```sh
git clone https://github.com/MozuGit/Mozu-Plugin ./plugins/Mozu-Plugin
```

<details>
<summary>GitHub 打不开？点这里换源</summary>

```sh
# Gitee
git clone https://gitee.com/MozuGit/Mozu-Plugin ./plugins/Mozu-Plugin

# GitCode
git clone https://gitcode.com/MozuGit/Mozu-Plugin ./plugins/Mozu-Plugin
```

</details>

2. 安装依赖：

```sh
cd ./plugins/Mozu-Plugin
pnpm install
```

3. 重启 Yunzai，看到 `Mozu-Plugin 载入成功` 即完成；普通群发 `#发言榜`、QQBot 群发 `#修仙帮助` 验证。

> [!NOTE]
> 首次启动会自动生成 `config/<模块>/config/*.yaml`，请改这份配置（`default` 只是模板）；也可以用锅巴面板修改。

## 功能介绍

| 功能                                      | 一句话说明                                                     | 要求           |
| ----------------------------------------- | -------------------------------------------------------------- | -------------- |
| [魔族陌修仙](apps/xiuxian/)               | 修炼、突破、宗门、妖兽、秘境、灵根、称号、排行、兑换码         | QQBot          |
| [魔族陌面版](server/)                     | 修仙数据管理台：总览、玩家、宗门、CDK、配置、备份               | Web            |
| [发言统计](apps/example/fayan.js)         | 日 / 周 / 月发言榜与记录清除                                   | 任意           |
| [伪造聊天](apps/example/makeMessage.js)   | 伪造转发聊天记录与群复读                                       | 非 QQBot       |
| [官机群管](apps/groupAdmin/groupAdmin.js) | 禁言、解禁、踢人、解除全部禁言、我要自闭                       | QQBot          |
| [天选之人](apps/example/whois.js)         | 随机禁言一位群友 5–60 秒                                       | QQBot          |
| [定时点赞](apps/example/like.js)          | 按 cron 定时给指定 QQ 点赞                                     | 支持点赞 API   |
| [QQBot 接口](apps/interface.js)           | 补齐群信息、禁言、踢人等接口                                   | QQBot          |
| [插件更新](apps/update.js)                | 群内更新插件（主人）、查看更新日志                             | —              |

官机群管、定时点赞、QQBot 接口默认关闭，其余功能默认开启。

常用指令：

- 修仙：`#修仙帮助` 查看完整指令；玩家、宗门、CDK、备份可在面版管理
- 伪造聊天：`#伪造聊天 123456789,消息内容,2026-01-01 20:00`；复读 `#伪造复读 内容 10`
- 发言统计：`#发言榜` / `#发言榜周榜` / `#发言榜月榜`；`#清除发言 @成员`（主人）
- 官机群管：`#禁言 @成员 10分钟`、`#解禁 @成员`、`#踢黑 @成员`；需机器人为管理员，由群管理使用，并开启 `config/config/config/interface.yaml`
- 天选之人：`#天选之人`（需机器人为管理员）
- 更新：`#魔族陌更新`（主人）、`#魔族陌更新日志`

## 魔族陌面版

默认地址 `http://<服务器IP>:11451`。首次使用先在锅巴面板或 `config/panel/config/login.yaml` 设置密码。

- 功能：修仙总览、玩家 / 宗门 / CDK 管理、修仙配置、备份与还原、外观、2FA
- 忘记密码：登录页「忘记密码」→ 在控制台查看 `[魔族陌面版][验证码]` 的 8 位数字
- 公网使用：设置强密码并开启 2FA；有 Nginx / CDN 时配置 `trustProxy`

## 常见问题

- **修仙 / 群管 / 天选没反应？** 仅支持 QQBot 适配器；检查对应 `enable`，修仙还要看群黑白名单
- **面版打不开？** 检查 `11451` 端口、防火墙和启动日志；未设置密码时会提示「未设置密码」
- **更新后报错？** 进入插件目录重新执行 `pnpm install`
- **修仙数据备份？** `#修仙备份`（主人，QQBot）或面版「备份」，文件在 `backup/xiuxian/`

更多内容（配置字段、开发、排错）见 [文档站](https://mozumiao.com/guide/)。

## 联系方式

- **QQ：** [魔族陌](https://qm.qq.com/q/5fKlztbHHG)
- **QQ群：** [陌陌的猫窝](https://qm.qq.com/q/G0BdsqHQ4M)
- **GitHub：** [MozuGit](https://github.com/MozuGit)
- **爱发电：** [赞助开发者](https://www.ifdian.net/a/Mozumo)

## 鸣谢

- [TRSS-Yunzai](https://github.com/TimeRainStarSky/Yunzai) / [Yunzai-Bot](https://github.com/Le-niao/Yunzai-Bot)
- [Guoba-Plugin](https://github.com/guoba-yunzai/guoba-plugin)
- [yenai-plugin](https://github.com/yeyang52/yenai-plugin)

---

本项目基于 [GPL-3.0](LICENSE) 许可开源，仅供学习交流使用。
