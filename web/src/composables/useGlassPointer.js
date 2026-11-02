/**
 * 液态玻璃指针镜面高光
 *
 * 在 window 上挂「一个」pointermove 监听，用 event.target.closest() 找到当前
 * 指针下的玻璃元素，把相对坐标写入 CSS 变量 --lg-spec-x / --lg-spec-y。
 * 样式层（liquid-glass.css）用这两个变量画 radial-gradient 高光。
 *
 * 为什么不给每个元素单独挂 listener：表格页一屏就有几十个卡片/表头，
 * 每个都挂监听会拖慢事件派发，而且移动端根本没这个需求（CSS 里已禁用）。
 *
 * @param {object}  [options]
 * @param {string}  [options.selector]  参与高光的元素选择器
 * @param {boolean} [options.enabled]   是否启用（移动端可传 false）
 * @returns {{ destroy: () => void }}
 */
export function useGlassPointer(options = {}) {
  const { selector = '.ant-card, .ant-modal-content, .lg-glass', enabled = true } = options

  if (!enabled || typeof window === 'undefined') {
    return { destroy: () => {} }
  }

  // 触屏设备没有 hover 镜面高光，直接跳过，省掉一个常驻监听
  if (window.matchMedia?.('(hover: none)').matches) {
    return { destroy: () => {} }
  }

  let frame = null
  let active = null
  let pending = null

  const apply = () => {
    frame = null
    if (!active || !pending) return
    active.style.setProperty('--lg-spec-x', `${pending.x}%`)
    active.style.setProperty('--lg-spec-y', `${pending.y}%`)
    pending = null
  }

  const onPointerMove = (event) => {
    const target = event.target?.closest?.(selector)

    if (target !== active) {
      // 指针换到别的玻璃元素上：清掉上一个的内联变量，回落到 :root 默认值
      if (active) {
        active.style.removeProperty('--lg-spec-x')
        active.style.removeProperty('--lg-spec-y')
      }
      active = target
    }

    if (!active) return

    const rect = active.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    pending = {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    }

    // rAF 节流：一帧内多次 pointermove 只写一次样式
    if (frame === null) {
      frame = requestAnimationFrame(apply)
    }
  }

  const onPointerLeave = () => {
    if (active) {
      active.style.removeProperty('--lg-spec-x')
      active.style.removeProperty('--lg-spec-y')
      active = null
    }
    pending = null
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  document.addEventListener('pointerleave', onPointerLeave)

  const destroy = () => {
    window.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerleave', onPointerLeave)
    if (frame !== null) cancelAnimationFrame(frame)
    onPointerLeave()
  }

  return { destroy }
}
