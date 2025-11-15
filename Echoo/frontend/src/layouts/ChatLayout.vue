<template>

  <!-- HLAVNÝ CHAT LAYOUT (ZÁKLADNÁ ŠTRUKTÚRA STRÁNKY) -->
  <q-layout view="hHh Lpr lFf" class="bg-dark text-white">

    <!-- HEADER -->
    <Header
    v-model:drawer-open="drawerOpen"
    :current-channel="currentChannelName"
    />

    <!-- SIDEBAR -->
    <Sidebar
    v-model:drawer-open="drawerOpen"
    :private-channels="privateChannels"
    :public-channels="publicChannels"
    @go-to-channel="goToChannel"
    @logout="handleLogout"
    @create-channel="handleCreateChannel"
    />

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
    v-model:new-message="newMessage"
    :footer-style="footerStyle"
    @enter-press="onEnterPress"
    />

    <!-- NOTIFICATION POPUP -->
    <NotificationPopUp
    :visible="showNotification"
    sender="User 1"
    message="Message sent!"
    logo="/pictures/logo.jpg"
    />

  </q-layout>

</template>



<script lang="ts" setup>

// KELL A SCROLLING ÉS A NOTIFICATION LOGIKA, MEG A PING LOGIKA IS

import { ref, computed, watch, provide, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import NotificationPopUp from 'components/NotificationPopUp.vue'
import Header from 'components/ChatHeader.vue'
import Sidebar from 'components/ChatSidebar.vue'
import ChatFooter from 'components/ChatFooter.vue'
import TypingStatus from 'components/TypingStatus.vue'
import axios from 'axios'

/* NASTAVENIE MENA KOMPONENTU */
defineOptions({ name: 'ChatLayout' })

/* ROZHRANIA PRE TYPY DÁT */
interface ChannelData {
  name: string
  visibility: 'private' | 'public'
  description: string
  invitedMembers: string[]
  notificationLevel: string
}

/* ROZHRANIE PRE SPRÁVY */
interface Message {
  id: number
  user: string
  text: string
  isPing?: boolean | undefined
}

interface Channel {
  id: number
  name: string
  type: 'private' | 'public'
  createdBy: number
  lastActiveAt: string
}

// Add interface for the API response
interface MessageResponse {
  id: number
  text: string
  user: string
  hasPing?: boolean
  // Add other response properties if needed
}

const privateChannels = ref<{ id: number; name: string; path: string }[]>([])
const publicChannels = ref<{ id: number; name: string; path: string }[]>([])

/* ZÁKLADNÉ INŠTANCIE */
const router = useRouter()
const route = useRoute()
const $q = useQuasar()

/* REAKTÍVNE DÁTA PRE SPRÁVY */
const messages = ref<Message[]>([])

/* STAVY A PREMENNÉ */
const drawerOpen = ref($q.screen.gt.sm)
const newMessage = ref('')
const isTyping = ref(false)
const showNotification = ref(false)
const currentChannelName = ref('')

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

async function loadMessages(channelPath: string) {
  const channelName = channelPath.split('/chat/')[1]

  // Add validation for channelName
  if (!channelName) {
    console.warn('Invalid channel path:', channelPath)
    messages.value = []
    return
  }

  const channel = [...privateChannels.value, ...publicChannels.value]
    .find((c) => c.path.includes(channelName))

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
function goToChannel(ch: { name: string; path?: string }) {
  currentChannelName.value = ch.name

  if (ch.path) {
    void router.push(ch.path)
  } else {
    console.warn(`Channel path is undefined for "${ch.name}"`)
  }
}

/* FUNKCIA NA ODHLÁSENIE POUŽÍVATEĽA */
function handleLogout() {
  localStorage.removeItem('userToken')
  void router.push('/')
}

/* FUNKCIA NA VYTVORENIE NOVÉHO KANÁLU */
function handleCreateChannel(data: ChannelData) {
  // Formátovanie channel name
  const formattedName = data.name.startsWith('#') ? data.name : `#${data.name}`

  // Kontrola, či názov kanála už existuje v oboch kategóriách
  const allChannels = [...privateChannels.value, ...publicChannels.value]
  const nameExists = allChannels.some(ch => ch.name.toLowerCase() === formattedName.toLowerCase())

  if (nameExists) {
    $q.notify({
      type: 'negative',
      message: `Channel "${formattedName}" already exists!`,
      position: 'top',
      timeout: 2500
    })
    return
  }

  // Generovanie pathu pre nový channel
  const channelPath = `/chat/${data.visibility}-${data.name.toLowerCase().replace(/\s+/g, '-')}`

  const newChannel = {
    id: Date.now(),       // EZ HELYETT KI KELL MAJD VALAMIT TALÁLNI
    // Ha később a backend visszaadja a tényleges id-t a channel létrehozáskor, akkor frissítENI KELL ÚGYIS
    name: formattedName,
    path: channelPath
  }

  // Pridanie do kategórie na základe visibility
  if (data.visibility === 'private') {
    privateChannels.value.push(newChannel)
  } else {
    publicChannels.value.push(newChannel)
  }

  // Zobraziť oznámenie o úspechu
  $q.notify({
    type: 'positive',
    message: `Channel "${newChannel.name}" created successfully!`,
    position: 'top',
    timeout: 2000
  })

  // Navigácia do nového channela
  currentChannelName.value = newChannel.name
  void router.push(channelPath)
}

/* FUNKCIA NA ODOSLANIE SPRÁVY */
async function onEnterPress(e: KeyboardEvent) {
  if (e.key === 'Enter' && newMessage.value.trim() !== '') {
    e.preventDefault()

    const content = newMessage.value.trim()

    try {
      // Feltételezzük, hogy currentChannelName alapján megvan a channelId
      const allChannels = [...privateChannels.value, ...publicChannels.value]
      const channel = allChannels.find(ch => ch.name === currentChannelName.value)
      if (!channel) return

      // POST request a backendre with proper typing
      const res = await axios.post<MessageResponse>(
        `http://localhost:3333/channels/${channel.id}/messages`,
        { content }
      )

      // Hozzáadjuk a visszakapott üzenetet a chathez
      messages.value.push({
        id: res.data.id,
        user: res.data.user, // vagy name
        text: res.data.text,
        isPing: res.data.hasPing
      })

      // Reset input
      newMessage.value = ''

    } catch (err) {
      console.error('Failed to send message', err)
      $q.notify({
        type: 'negative',
        message: 'Message could not be sent!',
        position: 'top',
        timeout: 2000
      })
    }
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

/* AUTOMATICKÉ SCROLLOVANIE PO ZMENE KANÁLU */
watch(currentChannelName, async () => {
  await nextTick()
  const chatMessagesEl = document.querySelector('.chat-messages')
  if (chatMessagesEl) {
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight
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

      await loadMessages(newPath)

    } else {
      currentChannelName.value = ''
      messages.value = []
    }
  },
  { immediate: true }
)

onMounted(async () => {
  try {
    const response = await axios.get<Channel[]>('http://localhost:3333/channels')
    const channels: Channel[] = response.data

    privateChannels.value = channels
      .filter(ch => ch.type === 'private')
      .map(ch => ({
        id: ch.id,
        name: ch.name,
        path: `/chat/${ch.type}-${ch.name.replace(/\s+/g, '-')}`
      }))

    publicChannels.value = channels
      .filter(ch => ch.type === 'public')
      .map(ch => ({
        id: ch.id,
        name: ch.name,
        path: `/chat/${ch.type}-${ch.name.replace(/\s+/g, '-')}`
      }))
  } catch (err) {
    console.error('Failed to load channels', err)
  }
})

/* SPRÁVY DOSTUPNÉ PRE VŠETKY DIEŤA KOMPONENTY */
provide('messages', messages)

</script>



<style>

/* HLAVNÝ šTÝL */
.chat-bg {
  background-color: #1E1E1E;
}

</style>
