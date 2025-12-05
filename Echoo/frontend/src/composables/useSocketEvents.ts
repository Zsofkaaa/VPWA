import { ref, type Ref, computed } from 'vue'
import type { Message, TypingData, TypingContentData, TypingUser, InviteNotification, ChannelUpdateNotification, ChannelDeletedNotification, UserKickedNotification, UserBannedNotification } from '@/types'
import type io from "socket.io-client"

export function useSocketEvents(
  socket: ReturnType<typeof io>,
  currentChannelId: Ref<number | null>,
  onInviteReceived?: (invite: InviteNotification) => void,
  onChannelJoined?: (channelData: ChannelUpdateNotification) => void,
  onChannelDeleted?: (data: ChannelDeletedNotification) => void,
  onUserKicked?: (data: UserKickedNotification) => void,
  onUserBanned?: (data: UserBannedNotification) => void
) {
  const typingUsersMap = ref<Map<string, TypingUser>>(new Map())
  const isSocketReady = ref(socket.connected)

  let lastTypingTime = 0
  let typingStopTimeout: ReturnType<typeof setTimeout> | null = null
  let lastContentEmitTime = 0
  let cleanupInterval: ReturnType<typeof setInterval> | null = null

  // Computed pre reactive array typing users
  const typingUsers = computed(() => {
    return Array.from(typingUsersMap.value.values())
  })

  const isTyping = computed(() => typingUsers.value.length > 0)

  socket.on('connect', () => {
    console.log('[SOCKET EVENTS] Socket connected, ready for communication')
    isSocketReady.value = true
  })

  socket.on('disconnect', () => {
    console.log('[SOCKET EVENTS] Socket disconnected')
    isSocketReady.value = false
  })

  // Cleanup starých typing záznamov (po 5 sekundách)
  function startCleanupInterval() {
    if (cleanupInterval) return

    cleanupInterval = setInterval(() => {
      const now = Date.now()
      const toRemove: string[] = []

      typingUsersMap.value.forEach((value, key) => {
        if (now - value.timestamp > 5000) {
          toRemove.push(key)
        }
      })

      toRemove.forEach(key => {
        typingUsersMap.value.delete(key)
      })
    }, 1000)
  }

  function handleTyping() {
    const savedUser = localStorage.getItem("user")
    const user = savedUser ? JSON.parse(savedUser) : null

    if (!currentChannelId.value || !user || !isSocketReady.value) return

    if (!isSocketReady.value) {
      console.warn('[TYPING] Socket not ready yet, skipping emit')
      return
    }

    const now = Date.now()

    if (now - lastTypingTime > 2000) {
      console.log('[TYPING] Emitting typing event for user:', user.nickName, 'channel:', currentChannelId.value)
      socket.emit("typing", {
        channelId: currentChannelId.value,
        user: user.nickName
      })
      lastTypingTime = now
    }

    if (typingStopTimeout) {
      clearTimeout(typingStopTimeout)
    }

    typingStopTimeout = setTimeout(() => {
      socket.emit("stop_typing", {
        channelId: currentChannelId.value,
        user: user.nickName
      })
    }, 3000)
  }

  function handleTypingContent(content: string) {
    const savedUser = localStorage.getItem("user")
    const user = savedUser ? JSON.parse(savedUser) : null

    if (!currentChannelId.value || !user || !isSocketReady.value) return

    const now = Date.now()

    if (now - lastContentEmitTime > 200) {
      socket.emit("typing_content", {
        channelId: currentChannelId.value,
        user: user.nickName,
        content: content
      })
      lastContentEmitTime = now
    }
  }

  function setupSocketListeners(onMessageReceived: (msg: Message) => void) {
    socket.on('newMessage', onMessageReceived)

    // Real-time invite notification
    if (onInviteReceived) {
      socket.on('new_invite', (inviteData: InviteNotification) => {
        console.log('[SOCKET] Received new invite:', inviteData)
        onInviteReceived(inviteData)
      })
    }

    // Real-time channel join notification (when someone accepts your invite)
    if (onChannelJoined) {
      socket.on('channel_joined', (channelData: ChannelUpdateNotification) => {
        console.log('[SOCKET] Channel joined notification:', channelData)
        onChannelJoined(channelData)
      })
    }

    // Real-time channel deleted notification
    if (onChannelDeleted) {
      socket.on('channel_deleted', (data: ChannelDeletedNotification) => {
        console.log('[SOCKET] Channel deleted notification:', data)
        onChannelDeleted(data)
      })
    }

    // Real-time user kicked notification
    if (onUserKicked) {
      socket.on('user_kicked', (data: UserKickedNotification) => {
        console.log('[SOCKET] User kicked notification:', data)
        onUserKicked(data)
      })
    }

    // Real-time user banned notification
    if (onUserBanned) {
      socket.on('user_banned', (data: UserBannedNotification) => {
        console.log('[SOCKET] User banned notification:', data)
        onUserBanned(data)
      })
    }

    socket.on("user_typing", (data: TypingData) => {
      console.log("[SOCKET] CLIENT GOT TYPING EVENT:", data, "current channel:", currentChannelId.value)

      if (data.channelId === currentChannelId.value) {
        typingUsersMap.value.set(data.user, {
          user: data.user,
          content: '',
          timestamp: Date.now()
        })

        setTimeout(() => {
          typingUsersMap.value.delete(data.user)
        }, 3000)
      }
    })

    socket.on("user_typing_content", (data: TypingContentData) => {
      console.log("[SOCKET] Got typing content:", data)

      if (data.channelId === currentChannelId.value) {
        typingUsersMap.value.set(data.user, {
          user: data.user,
          content: data.content,
          timestamp: Date.now()
        })
      }
    })

    socket.on("user_stop_typing", (data: { user: string }) => {
      console.log("[SOCKET] CLIENT GOT STOP_TYPING EVENT for:", data.user)
      if (data.user) {
        typingUsersMap.value.delete(data.user)
      }
    })

    startCleanupInterval()
  }

  function cleanupSocketListeners() {
    socket.off('newMessage')
    socket.off('user_typing')
    socket.off('user_stop_typing')
    socket.off('user_typing_content')
    socket.off('new_invite')
    socket.off('channel_joined')
    socket.off('channel_deleted')
    socket.off('user_kicked')
    socket.off('user_banned')

    if (typingStopTimeout) {
      clearTimeout(typingStopTimeout)
    }

    if (cleanupInterval) {
      clearInterval(cleanupInterval)
      cleanupInterval = null
    }

    typingUsersMap.value.clear()
  }

  function joinChannel(channelId: number) {
    if (!isSocketReady.value) {
      console.warn('[JOIN] Socket not ready, waiting...')
      socket.once('connect', () => {
        console.log('[JOIN] Socket now ready, joining room:', `channel_${channelId}`)
        socket.emit('join', `channel_${channelId}`)
      })
      return
    }

    console.log('[JOIN] Joining room:', `channel_${channelId}`)
    socket.emit('join', `channel_${channelId}`)
  }

  function leaveChannel(channelId: number) {
    console.log('[LEAVE] Leaving room:', `channel_${channelId}`)
    socket.emit('leave', `channel_${channelId}`)

    typingUsersMap.value.clear()

    if (typingStopTimeout) {
      clearTimeout(typingStopTimeout)
    }
  }

  function joinUserRoom(userId: number) {
    if (!isSocketReady.value) {
      console.warn('[JOIN USER ROOM] Socket not ready, waiting...')
      socket.once('connect', () => {
        console.log('[JOIN USER ROOM] Socket now ready, joining user room:', userId)
        socket.emit('join_user_room', userId)
      })
      return
    }

    console.log('[JOIN USER ROOM] Joining user room:', userId)
    socket.emit('join_user_room', userId)
  }

  return {
    isTyping,
    typingUsers,
    handleTyping,
    handleTypingContent,
    setupSocketListeners,
    cleanupSocketListeners,
    joinChannel,
    leaveChannel,
    joinUserRoom
  }
}
