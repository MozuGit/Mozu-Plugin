import { Version } from '../model/Config/Version.js'

export default {
  name: Version.Plugin_Name,
  title: "魔族陌插件（Mozu-Plugin）",
  author: Version.Plugin_pkg.author,
  authorLink: "https://github.com/MozuGit",
  link: Version.Plugin_pkg.repository.url,
  isV3: true,
  isV2: false,
  description: Version.Plugin_pkg.description,
  showInMenu: 'true',
  iconPath: `${Version.Plugin_Path}/Mo.png`
}
