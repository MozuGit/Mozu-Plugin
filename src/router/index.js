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
    component: () => import('../views/xiuxian.vue'),
    children: [
      {
        path: '',
        name: 'xiuxian',
        component: () => import('../views/xiuxian/home.vue')
      },
      {
        path: 'home',
        redirect: '/xiuxian'
      },
      {
        path: 'config',
        name: 'xiuxianConfig',
        component: () => import('../views/xiuxian/config.vue')
      },
      {
        path: 'cdk',
        name: 'xiuxianCdk',
        component: () => import('../views/xiuxian/cdk.vue')
      },
      {
        path: 'player',
        name: 'xiuxianPlayer',
        component: () => import('../views/xiuxian/player.vue')
      },
      {
        path: 'backup',
        name: 'xiuxianBackup',
        component: () => import('../views/xiuxian/backup.vue')
      }
    ]
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/settings.vue')
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/about.vue')
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