import { createRouter, createWebHashHistory } from 'vue-router'
import login from '../views/login.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: login
  },
  {
    path: '/index',
    name: 'index',
    component: () => import('../views/index.vue')
  },
  {
    path: '/xiuxian',
    name: 'xiuxian',
    component: () => import('../views/xiuxian.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/settings.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next(from.path || '/')
  } else {
    next()
  }
})

export default router