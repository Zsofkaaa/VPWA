import { ref } from 'vue'
import axios from 'axios'
import type { Invite } from '@/types'

const API_URL = 'http://localhost:3333'

export function useInvites() {
  const invites = ref<Invite[]>([])

  // Metódy pre správu kanálov
  async function loadInvites() {
    try {
      const token = localStorage.getItem('auth_token')
      const res = await axios.get<Invite[]>(`${API_URL}/invites/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      invites.value = res.data
    } catch (err) {
      console.error('Failed to load invites', err)
    }
  }

  return {
    invites,
    loadInvites
  }
}
