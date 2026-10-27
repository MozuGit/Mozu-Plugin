/** 普通文本分隔线 */
const plainTextDivider = '──────────────'

/**
 * 将 Markdown 文本转换为普通文本样式
 * @param {string} text Markdown 文本
 * @returns {string} 普通文本
 */
function toPlainText(text) {
  const lines = []
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = convertLine(rawLine)
    if (line !== null) lines.push(line)
  }
  return lines.join('\n')
}

/**
 * 转换单行 Markdown 文本
 * @param {string} rawLine Markdown 行
 * @returns {string|null} 普通文本行，null 表示丢弃该行
 */
function convertLine(rawLine) {
  let line = rawLine.trimEnd()
  line = line.replace(/<@[^>]*>/g, '')
  line = line.replace(/\[(.*?)\]\(mqqapi:\/\/[^)]*\)/g, '$1')
  line = line.replace(/\$([^$]*\\textcolor[^$]*)\$/g, (_, content) =>
    content.replace(/\\textcolor\{[^{}]*\}\{([^{}]*)\}/g, '$1')
  )
  const fence = line.match(/^\s*`{3,}\s*(.*?)\s*$/)
  if (fence) {
    if (!fence[1]) return null
    line = fence[1]
  }
  if (/^\s*\*{3,}\s*$/.test(line)) return plainTextDivider
  line = line.replace(/\*\*/g, '')
  line = line.replace(/^\s*>\s?/, '')
  line = line.replace(/^\s*#{1,6}\s*/, '')
  line = line.replace(/^\s+/, '')
  if (!line) return null
  return '│' + line
}

export { toPlainText, plainTextDivider }
