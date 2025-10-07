import type { RouteRecordRaw } from 'vue-router'



const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('src/layouts/ChatLayout.vue'),
    children: [
      { path: '', redirect: '/chat/1' },
      { path: 'chat/:id', component: () => import('pages/ChatPage.vue') },
    ]
  }
]



export default routes
