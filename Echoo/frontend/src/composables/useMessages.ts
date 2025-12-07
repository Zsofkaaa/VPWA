import { ref, type Ref } from 'vue'
import type { Message, Channel, UserChannel } from '@/types'
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
    const channelIdStr = channelPath.split('/chat/')[1]
    const channelId = Number(channelIdStr)

    const channel = [...privateChannels.value, ...publicChannels.value]
      .find(c => c.id === channelId)

    if (!channel) {
      messages.value = []
      return
    }

    try {
      const res = await axios.get<Channel[]>('${API_URL}/channels')
      const channelsData: Channel[] = res.data

      const channelDb = channelsData.find(c => c.name === channel.name)
      if (!channelDb) return

      const msgRes = await axios.get<Message[]>(
        `${API_URL}/channels/${channelDb.id}/messages`
      )

      messages.value = msgRes.data.reverse()
    } catch (e) {
      console.error("Failed to load messages", e)
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
