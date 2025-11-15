// src/composables/useAuth.ts
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from 'boot/axios'

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
  status: string
}

interface AuthResponse {
  type: string
  token: string
  user: User
}

export function useAuth() {
  const router = useRouter()
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Prihlásenie používateľa */
  async function login(data: LoginCredentials): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      console.log('Sending login request...') // ← ÚJ
      const response = await api.post<AuthResponse>('/auth/login', data)
      console.log('Login response:', response.data) // ← ÚJ
      
      const { token, user } = response.data

      console.log('Token:', token) // ← ÚJ
      console.log('User:', user) // ← ÚJ

      localStorage.setItem('auth_token', token)
      localStorage.setItem('user', JSON.stringify(user))

      console.log('Login successful, returning true') // ← ÚJ
      return true
    } catch (err: unknown) {
      console.error('Login error details:', err) // ← MÓDOSÍTOTT
      
      if (typeof err === 'object' && err && 'response' in err) {
        const errorResponse = err as { response?: { data?: { error?: string } } }
        error.value = errorResponse.response?.data?.error || 'Login failed'
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Unexpected error occurred'
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

    // Store token and user immediately
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user', JSON.stringify(user))

    return true

    } catch (err: unknown) {
        if (typeof err === 'object' && err && 'response' in err) {
            const errorResponse = err as { response?: { data?: { message?: string } } }
            error.value = errorResponse.response?.data?.message || 'Registration failed'
        } else if (err instanceof Error) {
            error.value = err.message
        } else {
            error.value = 'Unexpected error occurred'
        }
        console.error('Registration error:', err)
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
      await router.push('/auth')
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
