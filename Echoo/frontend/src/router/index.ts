import { route } from 'quasar/wrappers'
import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
  createWebHashHistory
} from 'vue-router'
import routes from './routes'

/*
 * This file creates the router instance for your app.
 * Changes to the router mode or base path should be done in quasar.config.js
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Important: use Quasar config for base path
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('auth_token')

    // Ak prejdete na chránenú stránku bez tokenu
    if (to.meta.requiresAuth && !token) {
      next('/auth')
    }
    // Ak prejdete na prihlasovaciu stránku s tokenom (už ste prihlásený)
    else if (to.meta.requiresGuest && token) {
      next('/chat')
    }
    // ostatné prípady
    else {
      next()
    }
  })

  return Router
})
