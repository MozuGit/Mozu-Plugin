import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import './styles/liquid-glass.css'
import './styles/appearance.css'
import './styles/settings.css'
const app = createApp(App)
app.use(router)
app.use(Antd)
app.mount('#app')
