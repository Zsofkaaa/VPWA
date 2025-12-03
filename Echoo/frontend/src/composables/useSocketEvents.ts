import { ref, type Ref } from 'vue'
import type { Message, TypingData } from '@/types'
import type io from "socket.io-client"

export function useSocketEvents(socket: ReturnType<typeof io>, currentChannelId: Ref<number | null>) {
  const isTyping = ref(false)
  const typingUser = ref<string | null>(null)

  function handleTyping() {
    const savedUser = localStorage.getItem("user")
    const user = savedUser ? JSON.parse(savedUser) : null
    if (!currentChannelId.value || !user) return

    socket.emit("typing", {
      channelId: currentChannelId.value,
      user: user.nickName
    })
  }

  function setupSocketListeners(onMessageReceived: (msg: Message) => void) {
    socket.on('newMessage', onMessageReceived)

    socket.on("user_typing", (data: TypingData) => {
      typingUser.value = data.user
      isTyping.value = true

      // 5 sec után automatikus reset fall-back
      setTimeout(() => {
        isTyping.value = false
        typingUser.value = null
      }, 5000)
    })

    socket.on("user_stop_typing", () => {
      isTyping.value = false
      typingUser.value = null
    })
  }

  function cleanupSocketListeners() {
    socket.off('newMessage')
    socket.off('user_typing')
    socket.off('user_stop_typing')
  }

  function joinChannel(channelId: number) {
    console.log('Joining room:', `channel_${channelId}`)
    socket.emit('join', `channel_${channelId}`)
  }

  function leaveChannel(channelId: number) {
    console.log('Leaving room:', `channel_${channelId}`)
    socket.emit('leave', `channel_${channelId}`)
  }

  return {
    isTyping,
    typingUser,
    handleTyping,
    setupSocketListeners,
    cleanupSocketListeners,
    joinChannel,
    leaveChannel
  }
}
