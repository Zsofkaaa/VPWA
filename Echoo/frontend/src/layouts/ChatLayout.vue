<template>
  <q-layout view="hHh Lpr lFf" class="bg-dark text-white">

    <!-- HEADER -->
    <Header
      v-model:drawer-open="drawerOpen"
      :current-channel="currentChannelName"
      :current-channel-id="currentChannelId"
    />

    <!-- SIDEBAR -->
    <Sidebar
      v-model:drawer-open="drawerOpen"
      :private-channels="privateChannels"
      :public-channels="publicChannels"
      :active-channel-path="activeChannelPath"
      :invites="invites"
      @go-to-channel="goToChannel"
      @logout="handleLogout"
      @create-channel="handleCreateChannel"
      @leftChannel="handleChannelLeft"
      @invite-updated="loadInvites"
    />

    <!-- MAIN CONTENT WRAPPER -->
    <div class="main-wrapper">
      <!-- MAIN CONTENT -->
      <q-page-container class="chat-bg">
        <router-view />
      </q-page-container>

      <!-- TYPING STATUS -->
      <TypingStatus
        v-if="isTyping"
        :typing-status-style="typingStatusStyle"
      />

      <!-- FOOTER -->
      <ChatFooter
        v-if="isChatPage"
        v-model:new-message="newMessage"
        :footer-style="footerStyle"
        @enter-press="onEnterPress"
      />
    </div>

    <!-- NOTIFICATION POPUP -->
    <NotificationPopUp
      :visible="showNotification"
      :sender="notificationSender"
      :message="notificationMessage"
      logo="/pictures/logo.jpg"
    />

  </q-layout>
</template>



<script lang="ts" setup>

// KELL A SCROLLING ÉS A NOTIFICATION LOGIKA, MEG A PING LOGIKA IS

import { ref, computed, watch, provide, onMounted, getCurrentInstance } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuth } from '../composables/useAuth'
import NotificationPopUp from 'components/NotificationPopUp.vue'
import Header from 'components/ChatHeader.vue'
import Sidebar from 'components/ChatSidebar.vue'
import ChatFooter from 'components/ChatFooter.vue'
import TypingStatus from 'components/TypingStatus.vue'
import axios from 'axios'

/* NASTAVENIE MENA KOMPONENTU */
defineOptions({ name: 'ChatLayout' })

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
}

/* ROZHRANIE PRE NEWCHANNELDIALOG */
interface ChannelData {
  name: string
  type: 'private' | 'public'
  invitedMembers: number[]
  notificationSettings: string
}

interface ChannelResponse {
  id: number
  name: string
  type: 'private' | 'public'
}

/* ROZHRANIE PRE SPRÁVY */
interface Message {
  id: number
  userId: number
  user: string
  text: string
  channelId: number
  isPing?: boolean | undefined
}

interface Channel {
  id: number
  name: string
  type: 'private' | 'public'
  createdBy: number
  lastActiveAt: string
}

interface AxiosErrorLike {
  isAxiosError: boolean
  response?: { status: number }
}

const userChannels = ref<UserChannel[]>([])

const privateChannels = ref<UserChannel[]>([])
const publicChannels = ref<UserChannel[]>([])

/* ZÁKLADNÉ INŠTANCIE */
const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const { logout } = useAuth() // ← POUŽIJ useAuth

/* REAKTÍVNE DÁTA PRE SPRÁVY */
const messages = ref<Message[]>([])

/* STAVY A PREMENNÉ */
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

const instance = getCurrentInstance()
const socket = instance!.appContext.config.globalProperties.$socket

const isChatPage = computed(() => route.path.startsWith('/chat/'))

/* ŠTÝL PRE FOOTER – POZÍCIA DOLNÉHO PANELU */
const footerStyle = computed(() => ({
  left: $q.screen.lt.md ? '0' : '300px',
  right: '0',
  bottom: '0',
  position: 'fixed' as const
}))

/* ŠTÝL PRE STATUS PÍSANIA – NAD FOOTEROM */
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

const invites = ref<Invite[]>([])

const API_URL = 'http://localhost:3333'
const token = localStorage.getItem('auth_token')

async function loadInvites() {
  try {
    const res = await axios.get<Invite[]>(`${API_URL}/invites/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    invites.value = res.data
  } catch (err) {
    console.error('Failed to load invites', err)
  }
}

onMounted(() => {
  void loadInvites()
})

function handleChannelLeft(channelId: number) {
  const idxPrivate = privateChannels.value.findIndex(c => c.id === channelId)
  if (idxPrivate !== -1) {
    privateChannels.value.splice(idxPrivate, 1)
    return
  }

  const idxPublic = publicChannels.value.findIndex(c => c.id === channelId)
  if (idxPublic !== -1) {
    publicChannels.value.splice(idxPublic, 1)
    return
  }
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

/* FUNKCIA NA ZMENU KANÁLU */
function goToChannel(ch: { id: number; name: string; path?: string }) {
  currentChannelName.value = ch.name
  currentChannelId.value = ch.id // ← EZ HIÁNYZIK!

  if (ch.path) {
    void router.push(ch.path)
  }
}

/* FUNKCIA NA ODHLÁSENIE POUŽÍVATEĽA */
async function handleLogout() {
  await logout()
  await router.push('/auth')
}

function isAxiosError(err: unknown): err is AxiosErrorLike {
  return (
    typeof err === 'object' &&
    err !== null &&
    'isAxiosError' in err &&
    (err as { isAxiosError?: unknown }).isAxiosError === true
  )
}

/* FUNKCIA NA VYTVORENIE NOVÉHO KANÁLU */
async function handleCreateChannel(data: ChannelData) {
  const formattedName = data.name.replace(/^#/, '')
  const channelPath = `/chat/${data.type}-${data.name.toLowerCase().replace(/\s+/g, '-')}`

  // Frontend oldali ellenőrzés, hogy a channel név már létezik-e
  const allChannelNames = [...privateChannels.value, ...publicChannels.value].map(ch => ch.name.toLowerCase())
  if (allChannelNames.includes(formattedName.toLowerCase())) {
    $q.notify({
      type: 'negative',
      message: `Channel "${formattedName}" already exists!`,
      position: 'top',
      timeout: 2000
    })
    return
  }

  try {
    const token = localStorage.getItem('auth_token')
    if (!token || !currentUserId.value) throw new Error('User not authenticated')

    // POST request az új csatorna létrehozásához
    const res = await axios.post<ChannelResponse>(
      'http://localhost:3333/channels',
      { name: formattedName,
        type: data.type,
        invitedMembers: data.invitedMembers || [],
        notificationSettings: data.notificationSettings},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const newChannelId = res.data.id

    // Mentés a user_channel táblába a notificationSettings-szel
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

    // Hozzáadás a frontend csatorna listához
    const newChannel: UserChannel = {
      id: newChannelId,
      name: formattedName,
      path: channelPath,
      role: 'admin',
      type: data.type
    }

    if (data.type === 'private') privateChannels.value.push(newChannel)
    else publicChannels.value.push(newChannel)

    // Értesítés a felhasználónak és navigáció
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

function sendMessage(text: string) {
  socket.emit('message', {
    channelId: currentChannelId.value,
    text,
    userId: currentUserId.value
  })
}

async function handleCancelCommand() {
  if (!currentChannelId.value) {
    $q.notify({ type: 'negative', message: 'You are not in any channel!' })
    return
  }

  const channelId = currentChannelId.value

  // Megkeressük a user szerepét
  const allChannels = [...privateChannels.value, ...publicChannels.value]
  const channel = allChannels.find(ch => ch.id === channelId)

  if (!channel) {
    $q.notify({ type: 'negative', message: 'Channel not found!' })
    return
  }

  const isAdmin = channel.role === 'admin'
  const token = localStorage.getItem('auth_token')

  try {
    if (isAdmin) {
      // 🔥 CSATORNA TÖRLÉSE
      await axios.delete(`${API_URL}/channels/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Frontend listából is töröljük
      privateChannels.value = privateChannels.value.filter(c => c.id !== channelId)
      publicChannels.value = publicChannels.value.filter(c => c.id !== channelId)

      $q.notify({
        type: 'positive',
        message: `Channel "${channel.name}" deleted.`,
      })

    } else {
      // 🚪 MEMBER → kilép
      await axios.delete(`${API_URL}/channels/${channelId}/leave`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // frontend listából removed
      handleChannelLeft(channelId)

      $q.notify({
        type: 'positive',
        message: `You left channel "${channel.name}".`,
      })
    }

    // Kiürítjük az állapotokat
    currentChannelId.value = null
    currentChannelName.value = ''
    activeChannelPath.value = ''
    messages.value = []

    // Navigáció
    void router.push('/')

  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Failed to process /cancel command!',
    })
  }
}

async function handleCommand(cmd: string) {
  const parts = cmd.trim().split(' ')
  const command = parts[0]

    if (command === '/cancel') {
    return await handleCancelCommand()
  }

  if (command !== '/join') {
    $q.notify({ type: 'warning', message: 'Unknown command' })
    return
  }

  // Ellenőrizzük a [private] flag-et
  const isPrivate = parts.includes('[private]')

  // Vegyük ki a parancsot és a [private]-t
  const nameParts = parts.slice(1).filter(p => p !== '[private]')
  const channelName = nameParts.join(' ')

  if (!channelName) {
    $q.notify({ type: 'negative', message: 'Channel name is required!' })
    return
  }

  try {
    const token = localStorage.getItem('auth_token')
    if (!token || !currentUserId.value) throw new Error('Not authenticated')

    // Megnézzük, hogy létezik-e már a csatorna
    const channelList = isPrivate ? privateChannels.value : publicChannels.value
    const existingChannel = channelList.find(
      c => c.name.toLowerCase() === channelName.toLowerCase()
    )
    let channelId: number

    if (existingChannel) {
      // Ha már létezik → csatlakozás
      await axios.post(
        `${API_URL}/user_channel`,
        {
          channelId: existingChannel.id,
          userId: currentUserId.value,
          role: isPrivate ? 'admin' : 'member',
          notificationSettings: 'all'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      channelId = existingChannel.id
      currentChannelName.value = existingChannel.name
      currentChannelId.value = channelId
      $q.notify({ type: 'positive', message: `Joined channel "${existingChannel.name}"` })

    } else {
      // Ha nem létezik → létrehozás
      const res = await axios.post<ChannelResponse>(
        `${API_URL}/channels`,
        {
          name: channelName,
          type: isPrivate ? 'private' : 'public',
          invitedMembers: [],
          notificationSettings: 'all'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      channelId = res.data.id

      // Hozzáadás user_channel táblához
      await axios.post(
        `${API_URL}/user_channel`,
        {
          channelId,
          userId: currentUserId.value,
          role: isPrivate ? 'admin' : 'member',
          notificationSettings: 'all'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const newChannel: UserChannel = {
        id: channelId,
        name: channelName,
        path: `/chat/${channelId}`,
        type: isPrivate ? 'private' : 'public',
        role: isPrivate ? 'admin' : 'member'
      }

      if (isPrivate) privateChannels.value.push(newChannel)
      else publicChannels.value.push(newChannel)

      currentChannelName.value = newChannel.name
      currentChannelId.value = newChannel.id
      $q.notify({ type: 'positive', message: `Channel "${channelName}" created!` })
    }

    // Navigáció a csatornához
    void router.push(`/chat/${channelId}`)

  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Failed to join or create channel!' })
  }
}

/* FUNKCIA NA ODOSLANIE SPRÁVY */
function onEnterPress(e: KeyboardEvent) {
  if (e.key !== 'Enter' || newMessage.value.trim() === '') return
  const content = newMessage.value.trim()

  // 1. Check if it's a command
  if (content.startsWith('/')) {
    void handleCommand(content)
  } else {
    // normál üzenet
    sendMessage(content)
  }

  newMessage.value = ""
}

/* LOGIKA PRE DETEKCIU PÍSANIA SPRÁV */
let typingTimeout: NodeJS.Timeout | null = null
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

/* WATCH PRE SIDEBAR */
watch(
  () => $q.screen.name,
  (newSize, oldSize) => {
    // Ak zmením malý view na velký view
    if ((oldSize === 'xs' || oldSize === 'sm') && (newSize === 'md' || newSize === 'lg' || newSize === 'xl')) {
      // Zatváram sidebar manuálne
      drawerOpen.value = false

      // Po krátkom čakaní ho opäť otvoríme, aby Quasar mohol znovu zostaviť layout
      setTimeout(() => {
        drawerOpen.value = true
      }, 150)
    }
  }
)

/* SLEDOVANIE ROUTE: KEĎ SA MENÍ KANÁL ALEBO VSTÚPIME PRIAMO CEZ ROUTE */
watch(
  () => route.path,
  async (newPath) => {
    const allChannels = [...privateChannels.value, ...publicChannels.value]
    const found = allChannels.find(ch => ch.path === newPath)

    if (found) {
      currentChannelName.value = found.name
      currentChannelId.value = found.id
      activeChannelPath.value = found.path

      // Biztonsági ellenőrzés
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

onMounted(async () => {
  // 1️. Načítanie ID aktuálneho používateľa zo storage
  const savedUser = localStorage.getItem("user")
  if (savedUser) {
    const user = JSON.parse(savedUser)
    currentUserId.value = user.id
  }

  // 2. Načítanie používateľských kanálov
  try {
    const token = localStorage.getItem('auth_token')
    const userId = currentUserId.value
    if (!token || !userId) return

    const res = await axios.get<UserChannel[]>(
      'http://localhost:3333/user/channels',
      { headers: { Authorization: `Bearer ${token}` } }
    )

    userChannels.value = res.data.map(ch => ({
      ...ch,
      path: `/chat/${ch.id}`
    }))

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

  // 3. Listener pre zmenu viditeľnosti aplikácie
  const handleVisibilityChange = () => {
    isAppVisible.value = !document.hidden
    console.log('App visibility changed:', isAppVisible.value ? 'VISIBLE' : 'HIDDEN')
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // 4️. Inicializácia socket pripojenia
  if (currentChannelId.value) {
    socket.emit('join', `channel_${currentChannelId.value}`)
  }

  socket.on('newMessage', (msg: Message) => {
    /*console.log('📩 Received message:', msg)*/

    // Ak správa patrí aktuálnemu kanálu, pridaj ju do zoznamu
    if (msg.channelId === currentChannelId.value) {
      messages.value.push(msg)
    }

    // Ignoruj vlastné správy pre notifikácie
    if (msg.userId === currentUserId.value) return

    // Ak aplikácia nie je viditeľná, zobraz notifikáciu
    if (!isAppVisible.value) {
      console.log('Showing notification - app is in background')

      const channel = [...privateChannels.value, ...publicChannels.value]
        .find(ch => ch.id === msg.channelId)

      const channelName = channel ? channel.name : `Channel ${msg.channelId}`

      notificationSender.value = `${msg.user} (#${channelName})`
      notificationMessage.value = msg.text
      showNotification.value = true

      setTimeout(() => {
        showNotification.value = false
      }, 5000)
    }
  })
})

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

/* SPRÁVY DOSTUPNÉ PRE VŠETKY DIEŤA KOMPONENTY */
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
