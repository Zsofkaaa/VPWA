import { onMounted, onBeforeUnmount, type Ref } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import type { UserChannel, Message, UserStatus } from '@/types'

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
  loadMessages: (channelPath: string) => Promise<void>
  userStatus?: Ref<UserStatus>
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
    router,
    loadMessages,
    userStatus
  } = options

  onMounted(async () => {
    console.log('[APP INIT] Starting initialization...')

    // Request notification permission
    await requestNotificationPermission()

    // Load current user from localStorage
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      const user = JSON.parse(savedUser)
      currentUserId.value = user.id
      console.log('[APP INIT] Current user ID:', currentUserId.value)
    }

    // Load user's channels
    const token = localStorage.getItem('auth_token')
    if (token && currentUserId.value) {
      console.log('[APP INIT] Loading user channels...')
      await loadUserChannels(currentUserId.value, token)
      console.log('[APP INIT] Channels loaded:', {
        private: privateChannels.value.length,
        public: publicChannels.value.length
      })

      // Find channel matching current route
      const found = [...privateChannels.value, ...publicChannels.value].find(
        ch => ch.path === route.path
      )

      console.log('[APP INIT] Current route:', route.path)
      console.log('[APP INIT] Found channel:', found)

      if (found) {
        // SET THESE FIRST - so ChatMessages component can see them
        currentChannelId.value = found.id
        currentChannelName.value = found.name
        activeChannelPath.value = found.path

        console.log('[APP INIT] Channel info set:', {
          id: currentChannelId.value,
          name: currentChannelName.value,
          path: activeChannelPath.value
        })

        // Join channel first
        if (
          typeof currentUserId.value === 'number' &&
          typeof found.id === 'number' &&
          userStatus?.value !== 'offline'
        ) {
          console.log('[APP INIT] Joining channel...')
          joinChannel(found.id)

          // Wait for next tick to ensure reactivity 
          await new Promise(resolve => setTimeout(resolve, 100))

          console.log('[APP INIT] Loading messages...')
          await loadMessages(route.path)
          console.log('[APP INIT] Messages loaded:', messages.value.length)
        }
      }
    }

    // Join user's personal room for invite/kick/ban notifications
    if (currentUserId.value) {
      if (userStatus?.value !== 'offline') {
        console.log('[APP INIT] Joining user room:', currentUserId.value)
        joinUserRoom(currentUserId.value)
      }
    }

    // Setup message listener
    if (userStatus?.value !== 'offline') {
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
    }

    // Load pending invites
    await loadInvites()

    console.log('[APP INIT] Initialization complete!')
  })

  onBeforeUnmount(() => {
    cleanupSocketListeners()
    if (currentChannelId.value) {
      leaveChannel(currentChannelId.value)
    }
  })
}
