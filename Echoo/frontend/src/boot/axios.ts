/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import { boot } from 'quasar/wrappers'
import axios from 'axios'
import API_URL from '../config/api' // Import z configu

// Typová definícia pre kompatibilitu so starším Axiosom
type AxiosInstance = ReturnType<typeof axios.create>

// Rozšírenie typov pre Vue komponenty, aby bolo možné používať $axios a $api
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: typeof axios
    $api: AxiosInstance
  }
}

// DEBUG: Vypíš API_URL z configu do konzoly
console.log('[AXIOS] Using API_URL from config:', API_URL)

const api = axios.create({
  baseURL: API_URL, // Použi hodnotu z config/api.ts
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
})

// Interceptory požiadaviek a odpovedí
// Pridanie tokenu do hlavičky každej požiadavky, ak je prihlásený používateľ
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Ak server vráti 401 (neautorizovaný), odstráni token a presmeruje na prihlasovaciu stránku
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  }
)

// Registrácia $axios a $api do globálnych vlastností Vue aplikácie
export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api, axios }
