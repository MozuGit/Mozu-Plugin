import { onMounted, onUnmounted } from 'vue'
import { TOKEN_KEY } from '../api/http'

/**
 * 页面回到前台时刷新数据
 * @param {() => void} callback
 */
export function useVisibilityRefresh(callback) {
  const handler = () => {
    if (document.visibilityState === 'visible') callback()
  }

  onMounted(() => {
    if (localStorage.getItem(TOKEN_KEY)) {
      document.addEventListener('visibilitychange', handler)
    }
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handler)
  })
}
