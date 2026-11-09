/**
 * 统一的表格文案配置
 * @param {string} [emptyText]
 * @returns {object}
 */
export function createTableLocale(emptyText) {
  const locale = {
    triggerAsc: '',
    triggerDesc: '',
    cancelSort: '取消排序'
  }
  if (emptyText) locale.emptyText = emptyText
  return locale
}
