import { ref, type Ref } from 'vue'
import type { Message, UserChannel } from '@/types'
import axios from 'axios'
import type { QVueGlobals } from 'quasar'
import type io from "socket.io-client"
import API_URL from '../config/api'

export function useMessages(
  currentChannelId: Ref<number | null>,
  currentUserId: Ref<number | null>,
  privateChannels: Ref<UserChannel[]>,
  publicChannels: Ref<UserChannel[]>,
  $q: QVueGlobals,
  socket: ReturnType<typeof io>
  ){

  const messages = ref<Message[]>([])
  const newMessage = ref('')

  async function loadMessages(channelPath: string) {
    console.log('[LOAD MESSAGES] Called with path:', channelPath)

    const channelIdStr = channelPath.split('/chat/')[1]
    const channelId = Number(channelIdStr)
    console.log('[LOAD MESSAGES] Channel ID:', channelId)

    const channel = [...privateChannels.value, ...publicChannels.value]
      .find(c => c.id === channelId)

    console.log('[LOAD MESSAGES] Found channel:', channel)

    if (!channel) {
      console.warn('[LOAD MESSAGES] Channel not found!')
      messages.value = []
      return
    }

    try {
      // ⭐ FIXED: Use backtick and limit parameter ⭐
      const msgRes = await axios.get<Message[]>(
        `${API_URL}/channels/${channelId}/messages?limit=30`
      )

      console.log('[LOAD MESSAGES] Received messages:', msgRes.data.length)
      messages.value = msgRes.data.reverse()
      console.log('[LOAD MESSAGES] Messages set to:', messages.value.length)
    } catch (e) {
      console.error("[LOAD MESSAGES] Failed to load messages", e)
      messages.value = []
    }
  }

  // Metódy pre prácu so správami
  function sendMessage(text: string) {
    if (!currentChannelId.value || !currentUserId.value) {
      $q.notify({ type: 'negative', message: 'You are not in a channel or not authenticated' })
      return
    }

    socket.emit('message', {
      channelId: currentChannelId.value,
      text,
      userId: currentUserId.value
    })
  }

  return {
    messages,
    newMessage,
    loadMessages,
    sendMessage
  }
}
