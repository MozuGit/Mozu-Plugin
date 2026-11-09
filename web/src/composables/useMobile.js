import { onMounted, onUnmounted, ref } from 'vue'

/**
 * 响应式移动端判断
 * @param {number} [breakpoint]
 * @returns {{ isMobile: import('vue').Ref<boolean>, update: () => void }}
 */
export function useMobile(breakpoint = 768) {
  const isMobile = ref(window.innerWidth <= breakpoint)

  const update = () => {
    isMobile.value = window.innerWidth <= breakpoint
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return { isMobile, update }
}
