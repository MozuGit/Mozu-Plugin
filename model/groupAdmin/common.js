export default {
  /**
   * 获取用户权限
   * @param {*} e - 接收到的事件对象
   * @param {"master"|"member"|"admin"|"owner"} permission - 用户所需的权限
   * @param {"member"|"admin"} role - Bot所需的权限
   * @param {boolean} - 是否发送消息
   * @returns {boolean} 是否具有权限
   */
  checkPermission(e, permission = 'member', role = 'member', isReply = true) {
    let msg = []
    if (role === 'admin' && !e.group?.is_admin) {
      msg.push('- Bot权限不足，需要管理员权限')
    }
    if (!e.isMaster) {
      if (permission === 'master') {
        msg.push('- 该命令仅限主人可用')
      } else if (permission === 'owner' && e.raw.author.member_role !== 'owner') {
        msg.push('- 该命令仅限群主可用')
      } else if (
        permission === 'admin' &&
        e.raw.author.member_role !== 'owner' &&
        e.raw.author.member_role !== 'admin'
      ) {
        msg.push('- 该命令仅限群管理员可用')
      }
    }
    if (isReply && msg.length) {
      e.reply(['***', '**操作失败**', '>造成的原因如下：', '>' + msg.join('\n'), '***'].join('\n'))
    }
    return !msg.length
  },
}
