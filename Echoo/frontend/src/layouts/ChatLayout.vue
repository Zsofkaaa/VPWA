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
      @go-to-channel="goToChannel"
      @logout="handleLogout"
      @create-channel="handleCreateChannel"
      @leftChannel="handleChannelLeft"
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

/* FUNKCIA NA ODOSLANIE SPRÁVY */
function onEnterPress(e: KeyboardEvent) {
  if (e.key === 'Enter' && newMessage.value.trim() !== '') {
    const content = newMessage.value.trim()

    // Itt már elérhető a socket a setup-ból
    socket.emit("message", {
      channelId: currentChannelId.value,
      text: content,
      userId: currentUserId.value
    })

    newMessage.value = ""
  }
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
  // 1️⃣ Betöltjük a user ID-t
  const savedUser = localStorage.getItem("user")
  if (savedUser) {
    const user = JSON.parse(savedUser)
    currentUserId.value = user.id
  }

  // 2️⃣ Betöltjük a csatornákat
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

  // 3️⃣ Visibility change listener
  const handleVisibilityChange = () => {
    isAppVisible.value = !document.hidden
    console.log('🔄 App visibility changed:', isAppVisible.value ? 'VISIBLE' : 'HIDDEN')
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  // 4️⃣ Socket setup
  console.log('Socket connected?', socket.connected)

  if (currentChannelId.value) {
    socket.emit('join', `channel_${currentChannelId.value}`)
  }

  socket.on('newMessage', (msg: Message) => {
    console.log('📩 Received message:', msg)
    
    if (msg.channelId === currentChannelId.value) {
      messages.value.push(msg)
    }

    if (msg.userId === currentUserId.value) {
      console.log('⏭️ Skipping notification - own message')
      return
    }

    console.log('👁️ isAppVisible.value:', isAppVisible.value)
    
    if (!isAppVisible.value) {
      console.log('🔔 Showing notification - app is in background')
      
      const channel = [...privateChannels.value, ...publicChannels.value]
        .find(ch => ch.id === msg.channelId)
      
      const channelName = channel ? channel.name : `Channel ${msg.channelId}`
      
      notificationSender.value = `${msg.user} (#${channelName})`
      notificationMessage.value = msg.text
      showNotification.value = true

      setTimeout(() => {
        showNotification.value = false
      }, 5000)
    } else {
      console.log('⏭️ Skipping notification - app is visible')
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
