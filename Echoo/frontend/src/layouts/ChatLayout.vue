<template>
  <q-layout view="hHh Lpr lFf" class="bg-dark text-white">
    <!-- Hlavička aplikácie -->
    <Header
      v-model:drawer-open="drawerOpen"
      :current-channel="currentChannelName"
      :current-channel-id="currentChannelId"
    />

    <!-- Bočný panel s kanálmi -->
    <Sidebar
      v-model:drawer-open="drawerOpen"
      :private-channels="privateChannels"
      :public-channels="publicChannels"
      :active-channel-path="activeChannelPath"
      :invites="invites"
      @go-to-channel="goToChannel"
      @logout="handleLogout"
      @create-channel="handleCreateChannel"
      @left-channel="handleChannelLeft"
      @notification-setting-changed="handleNotificationSettingChanged"
      @invite-updated="loadInvites"
    />

    <!-- Hlavný obsah stránky -->
    <div class="main-wrapper">
      <!-- Kontajner pre chat -->
      <q-page-container class="chat-bg">
        <router-view />
      </q-page-container>

      <!-- Indikátor písania správy -->
      <TypingStatus
        v-if="isTyping"
        :typing-user="typingUser"
        :typing-status-style="typingStatusStyle"
      />

      <!-- Panel pre zadávanie správy -->
      <ChatFooter
        v-if="isChatPage"
        v-model:new-message="newMessage"
        :footer-style="footerStyle"
        @enter-press="onEnterPress"
        @typing="handleTyping"
      />
    </div>

    <!-- Popup pre notifikácie -->
    <NotificationPopUp
      :visible="showNotification"
      :sender="notificationSender"
      :message="notificationMessage"
      logo="/pictures/logo.jpg"
    />

  </q-layout>
</template>



<script lang="ts" setup>
import { ref, computed, watch, provide, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuth } from '../composables/useAuth'
import { useChannelCommands } from 'src/composables/useChannelCommands'
import type { Channel, ChannelResponse, Message } from '@/types'
import axios from 'axios'

// Komponenty
//import NotificationPopUp from 'components/NotificationPopUp.vue'
import Header from 'components/ChatHeader.vue'
import Sidebar from 'components/ChatSidebar.vue'
import ChatFooter from 'components/ChatFooter.vue'
import TypingStatus from 'components/TypingStatus.vue'

// Rozhrania pre typy
interface Invite {
  id: number
  channel_id: number
  channel: {
    id: number
    name: string
  }
}

interface UserChannel {
  id: number
  name: string
  type: 'private' | 'public'
  path: string
  role: 'admin' | 'member'
  notificationSettings?: string
}

interface ChannelData {
  name: string
  type: 'private' | 'public'
  invitedMembers: number[]
  notificationSettings: string
}

interface AxiosErrorLike {
  isAxiosError: boolean
  response?: { status: number }
}

// Konštanta API URL
const API_URL = 'http://localhost:3333'

// Vue a utility
const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const { logout } = useAuth()
const instance = getCurrentInstance()
const socket = instance!.appContext.config.globalProperties.$socket

// Reaktívne premenné pre stav
const userChannels = ref<UserChannel[]>([])
const privateChannels = ref<UserChannel[]>([])
const publicChannels = ref<UserChannel[]>([])
const messages = ref<Message[]>([])
const drawerOpen = ref($q.screen.gt.sm)
const newMessage = ref('')
const isTyping = ref(false)
const showNotification = ref(false)
const currentChannelName = ref('')
const notificationSender = ref('')
const notificationMessage = ref('')
const isAppVisible = ref(!document.hidden)
const currentUserId = ref<number | null>(null)
const currentChannelId = ref<number | null>(null)
const activeChannelPath = ref<string>('')
const invites = ref<Invite[]>([])
const typingUser = ref<string | null>(null)

// Computed properties
const isChatPage = computed(() => route.path.startsWith('/chat/'))

const footerStyle = computed(() => ({
  left: $q.screen.lt.md ? '0' : '300px',
  right: '0',
  bottom: '0',
  position: 'fixed' as const
}))

const typingStatusStyle = computed(() => ({
  position: 'fixed' as const,
  left: $q.screen.lt.md ? '0' : '300px',
  bottom: '80px',
  right: '0',
  padding: '4px 16px',
  color: 'white',
  fontStyle: 'italic',
  zIndex: 2150
}))

const handleTyping = () => {
  const savedUser = localStorage.getItem("user")
  const user = savedUser ? JSON.parse(savedUser) : null
  if (!currentChannelId.value || !user) return
  socket.emit("typing", {
    channelId: currentChannelId.value,
    user: user.nickName
  })
}

const { handleCommand } = useChannelCommands(
  privateChannels,
  publicChannels,
  currentChannelId,
  currentChannelName,
  activeChannelPath,
  messages,
  currentUserId,
  handleChannelLeft,
  $q,
  router
)

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

function handleChannelLeft(channelId: number) {
  const idxPrivate = privateChannels.value.findIndex(c => c.id === channelId)
  if (idxPrivate !== -1) {
    privateChannels.value.splice(idxPrivate, 1)
    return
  }

  const idxPublic = publicChannels.value.findIndex(c => c.id === channelId)
  if (idxPublic !== -1) {
    publicChannels.value.splice(idxPublic, 1)
  }
}

function handleNotificationSettingChanged(channelId: number, newSetting: string) {
  console.log(`[CHAT LAYOUT] Updating notification setting for channel ${channelId} to: ${newSetting}`)

  // Hľadaj v súkromných kanáloch
  const privateChannel = privateChannels.value.find(c => c.id === channelId)
  if (privateChannel) {
    privateChannel.notificationSettings = newSetting
    return
  }

  // Hľadaj vo verejných kanáloch
  const publicChannel = publicChannels.value.find(c => c.id === channelId)
  if (publicChannel) {
    publicChannel.notificationSettings = newSetting
    return
  }

  console.warn(`[CHAT LAYOUT] Channel ${channelId} not found in channels list`)
}

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
    const res = await axios.get<Channel[]>('http://localhost:3333/channels')
    const channelsData: Channel[] = res.data

    const channelDb = channelsData.find(c => c.name === channel.name)
    if (!channelDb) return

    const msgRes = await axios.get<Message[]>(
      `http://localhost:3333/channels/${channelDb.id}/messages`
    )

    messages.value = msgRes.data.reverse()
  } catch (e) {
    console.error("Failed to load messages", e)
  }
}

function goToChannel(ch: { id: number; name: string; path?: string }) {
  currentChannelName.value = ch.name
  currentChannelId.value = ch.id

  if (ch.path) {
    void router.push(ch.path)
  }
}

async function handleLogout() {
  await logout()
  await router.push('/auth')
}

// Pomocné funkcie
function isAxiosError(err: unknown): err is AxiosErrorLike {
  return (
    typeof err === 'object' &&
    err !== null &&
    'isAxiosError' in err &&
    (err as { isAxiosError?: unknown }).isAxiosError === true
  )
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

function onEnterPress(e: KeyboardEvent) {
  if (e.key !== 'Enter' || newMessage.value.trim() === '') return
  const content = newMessage.value.trim()

  if (content.startsWith('/')) {
    void handleCommand(content)
  } else {
    sendMessage(content)
  }

  newMessage.value = ""
}

// Socket a notifikačné funkcie
const handleVisibilityChange = () => {
  isAppVisible.value = !document.hidden
  console.log('App visibility changed:', isAppVisible.value ? 'VISIBLE' : 'HIDDEN')
}

function handleIncomingMessage(msg: Message) {
  if (msg.channelId === currentChannelId.value) {
    messages.value.push(msg)
  }

  if (msg.userId === currentUserId.value) return

  const channel = [...privateChannels.value, ...publicChannels.value]
    .find(ch => ch.id === msg.channelId)

  if (!channel) return

  const notifSettings = channel.notificationSettings || 'all'
  let shouldNotify = false

  switch (notifSettings) {
    case 'none': shouldNotify = false; break
    case 'mentions': shouldNotify = msg.isPing === true; break
    case 'all':
    default: shouldNotify = true
  }

  if (!shouldNotify) return

  if (shouldNotify) {
    // Ak je aplikácia viditeľná, použi in-app popup
    if (isAppVisible.value) {
      /*
      notificationSender.value = `${msg.user} (#${channel.name})`
      notificationMessage.value = msg.text
      showNotification.value = true

      setTimeout(() => {
        showNotification.value = false
      }, 5000)
      */
      return    // AK MAS VLASTNY POP UP TAK TOTO ODKOMENTUJ
    }
    // Ak je aplikácia na pozadí, zobraz systémovú notifikáciu
    else if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`${msg.user} (#${channel.name})`, {
        body: msg.text.length > 100 ? msg.text.substring(0, 100) + '...' : msg.text,
        icon: '/pictures/logo.jpg',
        tag: `channel-${msg.channelId}`, // Zabráni duplicitám
        requireInteraction: false
      })

      // Kliknutím na notifikáciu otvor aplikáciu
      notification.onclick = () => {
        window.focus()
        void router.push(`/chat/${msg.channelId}`)
        notification.close()
      }

      // Automaticky zavrieť po 5 sekundách
      setTimeout(() => notification.close(), 5000)
    }
  }
}

// Lifecycle hooks
onMounted(async () => {
  console.log('[CHAT LAYOUT] Mounting component...')

  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }

  const currentUser = ref<{ id: number; nickName: string } | null>(null)

const savedUser = localStorage.getItem("user")
if (savedUser) {
  const user = JSON.parse(savedUser)
  currentUser.value = user
  currentUserId.value = user.id
}

  try {
    const token = localStorage.getItem('auth_token')
    const userId = currentUserId.value
    if (!token || !userId) return

    // Použitie existujúceho endpointu pre načítanie kanálov používateľa
    const res = await axios.get<UserChannel[]>(
      `${API_URL}/user/channels`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    userChannels.value = res.data

    privateChannels.value = userChannels.value.filter(ch => ch.type === 'private')
    publicChannels.value = userChannels.value.filter(ch => ch.type === 'public')

    const found = userChannels.value.find(ch => ch.path === route.path)
    if (found) {
      currentChannelId.value = found.id
      currentChannelName.value = found.name
      activeChannelPath.value = found.path
    }

  } catch (err) {
    console.error('Failed to load user channels', err)
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  if (currentChannelId.value) {
    socket.emit('join', `channel_${currentChannelId.value}`)
  }

  socket.on('newMessage', handleIncomingMessage)
  void loadInvites()

  socket.on("user_typing", (data: { user: string }) => {
    typingUser.value = data.user
    isTyping.value = true

    // 5 mp után automatikus reset fall-back
    setTimeout(() => {
      isTyping.value = false
      typingUser.value = null
    }, 5000)
  })

  socket.on("user_stop_typing", () => {
    isTyping.value = false
    typingUser.value = null
  })
})

onBeforeUnmount(() => {
  if (socket) {
    socket.off('newMessage')
    socket.off("user_typing")
    socket.off("user_stop_typing")
    if (currentChannelId.value) {
      socket.emit('leave', `channel_${currentChannelId.value}`)
    }
  }

  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

// Vytvorenie kanála
async function handleCreateChannel(data: ChannelData) {
  const formattedName = data.name.replace(/^#/, '')
  const channelPath = `/chat/${data.type}-${data.name.toLowerCase().replace(/\s+/g, '-')}`

  // keby chceme aby channelname bol úplne unique (lehet ehhez még kellene valami)
  /*
  const allChannelNames = [...privateChannels.value, ...publicChannels.value]
    .map(ch => ch.name.toLowerCase())

  if (allChannelNames.includes(formattedName.toLowerCase())) {
    $q.notify({ type: 'negative', message: `Channel already exists!` })
    return
  }
  */

  try {
    const token = localStorage.getItem('auth_token')
    if (!token || !currentUserId.value) throw new Error('User not authenticated')

    const res = await axios.post<ChannelResponse>(
      'http://localhost:3333/channels',
      {
        name: formattedName,
        type: data.type,
        invitedMembers: data.invitedMembers || [],
        notificationSettings: data.notificationSettings
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const newChannelId = res.data.id

    // Použitie existujúceho endpointu pre pridanie používateľa do kanála
    await axios.post(
      `http://localhost:3333/user_channel`,
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

/* LOGIKA PRE DETEKCIU PÍSANIA SPRÁV */
let typingTimeout: ReturnType<typeof setTimeout> | null = null
watch(newMessage, (value) => {
  if (value !== '') {
    isTyping.value = true
    if (typingTimeout) clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
      isTyping.value = false
    }, 1000)
  } else {
    isTyping.value = false
  }
})

// Pri zmene veľkosti obrazovky z malej na veľkú, reštartuj sidebar
watch(
  () => $q.screen.name,
  (newSize, oldSize) => {
    if ((oldSize === 'xs' || oldSize === 'sm') && (newSize === 'md' || newSize === 'lg' || newSize === 'xl')) {
      drawerOpen.value = false

      setTimeout(() => {
        drawerOpen.value = true
      }, 150)
    }
  }
)

// Sleduje zmenu URL a načíta správy pre nový kanál
watch(
  () => route.path,
  async (newPath) => {
    const allChannels = [...privateChannels.value, ...publicChannels.value]
    const found = allChannels.find(ch => ch.path === newPath)

    if (found) {
      currentChannelName.value = found.name
      currentChannelId.value = found.id
      activeChannelPath.value = found.path

      if (typeof currentUserId.value !== 'number' || typeof currentChannelId.value !== 'number') {
        console.warn('Invalid IDs, skip backend query', currentUserId.value, currentChannelId.value)
        return
      }

      await loadMessages(newPath)
    } else {
      currentChannelName.value = ''
      currentChannelId.value = null
      activeChannelPath.value = ''
      messages.value = []
    }
  },
  { immediate: true }
)

// Pri zmene kanála opusť starú roomku a pripoj sa k novej
watch(currentChannelId, (id, oldId) => {
  if (!socket) return

  if (oldId) {
    console.log('Leaving room:', `channel_${oldId}`)
    socket.emit('leave', `channel_${oldId}`)
  }
  if (id) {
    socket.emit('join', `channel_${id}`)
  }
})

// Poskytni dáta všetkým child komponentom cez provide/inject
provide('messages', messages)
provide("currentUserId", currentUserId)
provide('userChannels', userChannels)
provide('currentChannelId', currentChannelId)
provide('currentChannelName', currentChannelName)
provide('activeChannelPath', activeChannelPath)

</script>

<style scoped>
.main-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.chat-bg {
  flex: 1;
  overflow-y: auto;
  background-color: #1E1E1E;
  padding-bottom: 80px;
}
</style>
