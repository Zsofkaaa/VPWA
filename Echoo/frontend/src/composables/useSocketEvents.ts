import { ref, type Ref } from 'vue'
import type { Message, TypingData, TypingContentData } from '@/types'
import type io from "socket.io-client"

export function useSocketEvents(socket: ReturnType<typeof io>, currentChannelId: Ref<number | null>) {
  const isTyping = ref(false)
  const typingUser = ref<string | null>(null)
  const isSocketReady = ref(socket.connected)
  const typingContent = ref<string>('')

  let lastTypingTime = 0
  let typingStopTimeout: ReturnType<typeof setTimeout> | null = null
  let lastContentEmitTime = 0

  socket.on('connect', () => {
    console.log('[SOCKET EVENTS] Socket connected, ready for communication')
    isSocketReady.value = true
  })

  socket.on('disconnect', () => {
    console.log('[SOCKET EVENTS] Socket disconnected')
    isSocketReady.value = false
  })

  function handleTyping() {
    const savedUser = localStorage.getItem("user")
    const user = savedUser ? JSON.parse(savedUser) : null

    //if (!currentChannelId.value || !user) return
      if (!currentChannelId.value || !user || !isSocketReady.value) return

    // ⬅️ Ellenőrizd hogy a socket ready-e
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
        channelId: currentChannelId.value
      })
    }, 3000)
  }

  function handleTypingContent(content: string) {
    const savedUser = localStorage.getItem("user")
    const user = savedUser ? JSON.parse(savedUser) : null

    if (!currentChannelId.value || !user || !isSocketReady.value) return

    const now = Date.now()

    // Throttle: csak 200ms-enként küldjön (ne spammelje)
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

    socket.on("user_typing", (data: TypingData) => {
      console.log("[SOCKET] CLIENT GOT TYPING EVENT:", data, "current channel:", currentChannelId.value)

      if (data.channelId === currentChannelId.value) {
        typingUser.value = data.user
        isTyping.value = true

        setTimeout(() => {
          isTyping.value = false
          typingUser.value = null
          typingContent.value = ''
        }, 2000)
      }
    })

    socket.on("user_typing_content", (data: TypingContentData) => {
      console.log("[SOCKET] Got typing content:", data)

      if (data.channelId === currentChannelId.value) {
        typingUser.value = data.user
        typingContent.value = data.content
        isTyping.value = true
      }
    })

    socket.on("user_stop_typing", () => {
      console.log("[SOCKET] CLIENT GOT STOP_TYPING EVENT")
      isTyping.value = false
      typingUser.value = null
      typingContent.value = ''
    })
  }

  function cleanupSocketListeners() {
    socket.off('newMessage')
    socket.off('user_typing')
    socket.off('user_stop_typing')
    socket.off('user_typing_content')

    if (typingStopTimeout) {
      clearTimeout(typingStopTimeout)
    }
  }

  function joinChannel(channelId: number) {
    // ⬅️ Várj amíg a socket ready
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

    isTyping.value = false
    typingUser.value = null
    typingContent.value = ''

    if (typingStopTimeout) {
      clearTimeout(typingStopTimeout)
    }
  }

  return {
    isTyping,
    typingUser,
    handleTyping,
    typingContent,
    handleTypingContent,
    setupSocketListeners,
    cleanupSocketListeners,
    joinChannel,
    leaveChannel
  }
}
