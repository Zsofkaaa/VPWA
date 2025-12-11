import { ref } from 'vue'
import { api } from 'boot/axios'
import type { UserStatus } from '@/types'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  firstName: string
  lastName: string
  nickname: string
  email: string
  password: string
}

interface User {
  id: number
  firstName: string
  lastName: string
  nickName: string
  email: string
  status?: UserStatus
}

interface AuthResponse {
  type: string
  token: string
  user: User
}

interface ErrorResponse {
  message?: string
  error?: string
}

// Type guard for Axios errors
function isAxiosError(error: unknown): error is { response?: { data?: ErrorResponse } } {
  return typeof error === 'object' && error !== null && 'response' in error
}

export function useAuth() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Prihlásenie používateľa */
  async function login(data: LoginCredentials): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await api.post<AuthResponse>('/auth/login', data)
      const { token, user } = response.data

      localStorage.setItem('auth_token', token)
      localStorage.setItem('user', JSON.stringify(user))

      return true
    } catch (err: unknown) {
      console.error('Login error:', err)

      // Check if it's an Axios error
      if (isAxiosError(err) && err.response?.data) {
        const errorData = err.response.data
        error.value = errorData.message || errorData.error || 'Invalid email or password'
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'An unexpected error occurred'
      }

      return false
    } finally {
      loading.value = false
    }
  }

  /** Registrácia používateľa */
  async function register(data: RegisterData): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await api.post<AuthResponse>('/auth/register', data)
      const { token, user } = response.data

      localStorage.setItem('auth_token', token)
      localStorage.setItem('user', JSON.stringify(user))

      return true
    } catch (err: unknown) {
      console.error('Registration error:', err)

      // Check if it's an Axios error
      if (isAxiosError(err) && err.response?.data) {
        const errorData = err.response.data
        error.value = errorData.message || errorData.error || 'Registration failed'
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'An unexpected error occurred'
      }

      return false
    } finally {
      loading.value = false
    }
  }

  /** Odhlásenie používateľa */
  async function logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      delete api.defaults.headers.common['Authorization']
    }
  }

  /** Kontrola, či je používateľ prihlásený */
  function isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token')
  }

  /** Získanie aktuálneho používateľa */
  function getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }

  return {
    login,
    register,
    logout,
    isAuthenticated,
    getCurrentUser,
    loading,
    error,
  }
}
