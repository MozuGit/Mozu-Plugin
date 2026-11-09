import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd, { message } from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import './styles/liquid-glass.css'
import './styles/appearance.css'
import './styles/page.css'
import { setUnauthorizedHandler } from './api/http'

let redirectingToLogin = false
setUnauthorizedHandler(() => {
  if (redirectingToLogin) return
  redirectingToLogin = true
  message.error('token过期或无效')
  document.title = '魔族陌 - 登录'
  router
    .push('/login')
    .catch(() => {})
    .finally(() => {
      redirectingToLogin = false
    })
})

const app = createApp(App)
app.use(router)
app.use(Antd)
app.mount('#app')
