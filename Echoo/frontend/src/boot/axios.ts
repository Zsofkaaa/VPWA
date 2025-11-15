import { boot } from 'quasar/wrappers'
import axios from 'axios'

// Typová definícia pre kompatibilitu so starším Axiosom
type AxiosInstance = ReturnType<typeof axios.create>

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: typeof axios
    $api: AxiosInstance
  }
}

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3333'

const api = axios.create({
  baseURL,
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
  (error) => Promise.reject(new Error(error))

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
    return Promise.reject(new Error(error))
  }
)

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api, axios }
