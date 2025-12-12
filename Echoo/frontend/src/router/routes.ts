import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // Prihlasovacia trasa
  {
    path: '/auth',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { 
        path: '', 
        component: () => import('pages/AuthPage.vue'),
        meta: { requiresGuest: true }
      }
    ]
  },

  // ROOT - presmerovanie na vhodnú stránku
  {
    path: '/',
    redirect: () => {
      const token = localStorage.getItem('auth_token')
      return token ? '/chat' : '/auth'
    }
  },

  // CHAT
  {
    path: '/chat',
    component: () => import('layouts/ChatLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', component: () => import('pages/HomePage.vue') },
      { path: ':id', component: () => import('pages/ChatPage.vue') },
    ]
  },

  // 404 fallback
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
