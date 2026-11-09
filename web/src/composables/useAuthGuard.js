import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { TOKEN_KEY } from '../api/http'

/**
 * 页面级登录检查
 * @returns {{ ensureAuth: () => boolean }}
 */
export function useAuthGuard() {
  const router = useRouter()

  const ensureAuth = () => {
    if (localStorage.getItem(TOKEN_KEY)) return true
    message.warning('请先登录')
    router.push('/login')
    document.title = '魔族陌 - 登录'
    return false
  }

  return { ensureAuth }
}
