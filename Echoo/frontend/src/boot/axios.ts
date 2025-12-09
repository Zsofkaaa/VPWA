/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import { boot } from 'quasar/wrappers'
import axios from 'axios'
import API_URL from '../config/api' // ⭐ IMPORT a config-ból!

// Typová definícia pre kompatibilitu so starším Axiosom
type AxiosInstance = ReturnType<typeof axios.create>

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: typeof axios
    $api: AxiosInstance
  }
}

// ⭐ DEBUG: Log the API URL from config
console.log('[AXIOS] Using API_URL from config:', API_URL)

const api = axios.create({
  baseURL: API_URL, // ⭐ Használd a config/api.ts-ből!
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
})

// Interceptory
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

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api, axios }
