import { onMounted, onBeforeUnmount, type Ref } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import type { UserChannel, Message } from '@/types'

interface AppInitializationOptions {
  currentUserId: Ref<number | null>
  currentChannelId: Ref<number | null>
  currentChannelName: Ref<string>
  activeChannelPath: Ref<string>
  privateChannels: Ref<UserChannel[]>
  publicChannels: Ref<UserChannel[]>
  messages: Ref<Message[]>
  route: RouteLocationNormalizedLoaded
  requestNotificationPermission: () => Promise<void>
  loadUserChannels: (userId: number, token: string) => Promise<void>
  loadInvites: () => Promise<void>
  joinChannel: (channelId: number) => void
  joinUserRoom: (userId: number) => void
  leaveChannel: (channelId: number) => void
  setupSocketListeners: (callback: (msg: Message) => void) => void
  cleanupSocketListeners: () => void
  handleIncomingMessage: (
    msg: Message,
    channels: UserChannel[],
    userId: number | null,
    channelId: number | null,
    messages: Ref<Message[]>,
    router: Router
  ) => void
  router: Router
}

export function useAppInitialization(options: AppInitializationOptions) {
  const {
    currentUserId,
    currentChannelId,
    currentChannelName,
    activeChannelPath,
    privateChannels,
    publicChannels,
    messages,
    route,
    requestNotificationPermission,
    loadUserChannels,
    loadInvites,
    joinChannel,
    joinUserRoom,
    leaveChannel,
    setupSocketListeners,
    cleanupSocketListeners,
    handleIncomingMessage,
    router
  } = options

  onMounted(async () => {
    // Request notification permission
    await requestNotificationPermission()

    // Load current user from localStorage
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      const user = JSON.parse(savedUser)
      currentUserId.value = user.id
    }

    // Load user's channels
    const token = localStorage.getItem('auth_token')
    if (token && currentUserId.value) {
      await loadUserChannels(currentUserId.value, token)

      // Find channel matching current route
      const found = [...privateChannels.value, ...publicChannels.value].find(
        ch => ch.path === route.path
      )

      if (found) {
        currentChannelId.value = found.id
        currentChannelName.value = found.name
        activeChannelPath.value = found.path
      }
    }

    // Setup socket listeners and join rooms
    if (currentChannelId.value) {
      joinChannel(currentChannelId.value)
    }

    // Join user's personal room for invite/kick/ban notifications
    if (currentUserId.value) {
      joinUserRoom(currentUserId.value)
    }

    // Setup message listener
    setupSocketListeners((msg: Message) => {
      handleIncomingMessage(
        msg,
        [...privateChannels.value, ...publicChannels.value],
        currentUserId.value,
        currentChannelId.value,
        messages,
        router
      )
    })

    // Load pending invites
    await loadInvites()
  })

  onBeforeUnmount(() => {
    cleanupSocketListeners()
    if (currentChannelId.value) {
      leaveChannel(currentChannelId.value)
    }
  })
}
