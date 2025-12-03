// composables/useChannelManagement.ts
import { ref, type Ref } from 'vue'
import type { Router } from 'vue-router'
import type { QVueGlobals } from 'quasar'
import axios from 'axios'
import type { ChannelData, AxiosErrorLike, ChannelResponse, UserChannel } from '@/types'

const API_URL = 'http://localhost:3333'

function isAxiosError(err: unknown): err is AxiosErrorLike {
  return (
    typeof err === 'object' &&
    err !== null &&
    'isAxiosError' in err &&
    (err as { isAxiosError?: unknown }).isAxiosError === true
  )
}

export function useChannelManagement(
  currentUserId: Ref<number | null>,
  router: Router,
  $q: QVueGlobals
) {
  const privateChannels = ref<UserChannel[]>([])
  const publicChannels = ref<UserChannel[]>([])
  const currentChannelId = ref<number | null>(null)
  const currentChannelName = ref('')
  const activeChannelPath = ref<string>('')

  async function loadUserChannels(userId: number, token: string) {
    try {
      const res = await axios.get<UserChannel[]>(
        `${API_URL}/user/channels`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const allChannels = res.data
      privateChannels.value = allChannels.filter(ch => ch.type === 'private')
      publicChannels.value = allChannels.filter(ch => ch.type === 'public')
    } catch (err) {
      console.error('Failed to load user channels', err)
    }
  }

  function goToChannel(ch: { id: number; name: string; path?: string }) {
    currentChannelName.value = ch.name
    currentChannelId.value = ch.id

    if (ch.path) {
      void router.push(ch.path)
    }
  }

  async function handleCreateChannel(data: ChannelData) {
    const formattedName = data.name.replace(/^#/, '')
    const channelPath = `/chat/${data.type}-${data.name.toLowerCase().replace(/\s+/g, '-')}`

    try {
      const token = localStorage.getItem('auth_token')
      if (!token || !currentUserId.value) throw new Error('User not authenticated')

      const res = await axios.post<ChannelResponse>(
        `${API_URL}/channels`,
        {
          name: formattedName,
          type: data.type,
          invitedMembers: data.invitedMembers || [],
          notificationSettings: data.notificationSettings
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const newChannelId = res.data.id

      await axios.post(
        `${API_URL}/user_channel`,
        {
          channelId: newChannelId,
          userId: currentUserId.value,
          role: 'admin',
          notificationSettings: data.notificationSettings
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const newChannel: UserChannel = {
        id: newChannelId,
        name: formattedName,
        path: channelPath,
        role: 'admin',
        type: data.type
      }

      if (data.type === 'private') privateChannels.value.push(newChannel)
      else publicChannels.value.push(newChannel)

      $q.notify({
        type: 'positive',
        message: `Channel "${newChannel.name}" created!`,
        position: 'top',
        timeout: 2000
      })
      currentChannelName.value = newChannel.name
      void router.push(channelPath)

    } catch (err: unknown) {
      let message = 'Channel creation failed!'

      if (isAxiosError(err)) {
        if (err.response?.status === 409) {
          message = `Channel "${formattedName}" already exists!`
        }
      }

      console.error('Failed to create channel', err)
      $q.notify({
        type: 'negative',
        message,
        position: 'top',
        timeout: 2000
      })
    }
  }

  function handleChannelLeft(channelId: number) {
    const idxPrivate = privateChannels.value.findIndex((c: UserChannel) => c.id === channelId)
    if (idxPrivate !== -1) {
      privateChannels.value.splice(idxPrivate, 1)
      return
    }

    const idxPublic = publicChannels.value.findIndex((c: UserChannel) => c.id === channelId)
    if (idxPublic !== -1) {
      publicChannels.value.splice(idxPublic, 1)
    }
  }

  function handleNotificationSettingChanged(channelId: number, newSetting: string) {
    console.log(`[useChannelManagement] Updating notification setting for channel ${channelId} to: ${newSetting}`)

    const privateChannel = privateChannels.value.find((c: UserChannel) => c.id === channelId)
    if (privateChannel) {
      privateChannel.notificationSettings = newSetting
      return
    }

    const publicChannel = publicChannels.value.find((c: UserChannel) => c.id === channelId)
    if (publicChannel) {
      publicChannel.notificationSettings = newSetting
      return
    }

    console.warn(`[useChannelManagement] Channel ${channelId} not found in channels list`)
  }

  return {
    privateChannels,
    publicChannels,
    currentChannelId,
    currentChannelName,
    activeChannelPath,
    loadUserChannels,
    goToChannel,
    handleCreateChannel,
    handleChannelLeft,
    handleNotificationSettingChanged
  }
}
