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
      @goToChannel="goToChannel"
      @logout="handleLogout"
      @createChannel="handleCreateChannel"
      @leftChannel="handleChannelLeft"
      @notification-setting-changed="handleNotificationSettingChanged"
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
import { ref, computed, watch, provide, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuth } from '../composables/useAuth'
import NotificationPopUp from 'components/NotificationPopUp.vue'
import Header from 'components/ChatHeader.vue'
import Sidebar from 'components/ChatSidebar.vue'
import ChatFooter from 'components/ChatFooter.vue'
import TypingStatus from 'components/TypingStatus.vue'
import axios from 'axios'

defineOptions({ name: 'ChatLayout' })

// Typy pre kanály a správy
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

interface ChannelResponse {
  id: number
  name: string
  type: 'private' | 'public'
}

interface Message {
  id: number
  userId: number
  user: string
  text: string
  channelId: number
  isPing?: boolean | undefined
  mentionedUserIds?: number[]
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

// Zoznamy kanálov rozdelené podľa typu
const userChannels = ref<UserChannel[]>([])
const privateChannels = ref<UserChannel[]>([])
const publicChannels = ref<UserChannel[]>([])

// Vue router a utility
const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const { logout } = useAuth()

// Správy v aktuálnom kanáli
const messages = ref<Message[]>([])

// Stavy UI komponentov
const drawerOpen = ref($q.screen.gt.sm) // Sidebar otvorený/zatvorený
const newMessage = ref('') // Text novej správy
const isTyping = ref(false) // Indikátor písania
const showNotification = ref(false) // Zobrazenie notifikácie
const currentChannelName = ref('') // Názov aktívneho kanála
const notificationSender = ref('') // Odosielateľ notifikácie
const notificationMessage = ref('') // Text notifikácie
const isAppVisible = ref(!document.hidden) // Je aplikácia viditeľná?
const currentUserId = ref<number | null>(null) // ID prihláseného používateľa
const currentChannelId = ref<number | null>(null) // ID aktívneho kanála

// Handler pre zmenu viditeľnosti aplikácie (musí byť mimo onMounted kvôli cleanup)
const handleVisibilityChange = () => {
  isAppVisible.value = !document.hidden
  console.log('App visibility changed:', isAppVisible.value ? 'VISIBLE' : 'HIDDEN')
}

const activeChannelPath = ref<string>('') // Cesta aktívneho kanála

// Socket.io inštancia
const instance = getCurrentInstance()
const socket = instance!.appContext.config.globalProperties.$socket

// Kontrola či sme na chat stránke
const isChatPage = computed(() => route.path.startsWith('/chat/'))

// Pozícia footera (posúva sa podľa sidebaru)
const footerStyle = computed(() => ({
  left: $q.screen.lt.md ? '0' : '300px',
  right: '0',
  bottom: '0',
  position: 'fixed' as const
}))

// Pozícia indikátora písania (nad footerom)
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

// Odstráni kanál zo zoznamu po opustení/vymazaní
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

// Aktualizuje notifikačné nastavenia v pamäti po zmene v dialógu
function handleNotificationSettingChanged(channelId: number, newSetting: string) {
  console.log(`[CHAT LAYOUT] Updating notification setting for channel ${channelId} to: ${newSetting}`)
  
  // Hľadaj v súkromných kanáloch
  const privateChannel = privateChannels.value.find(c => c.id === channelId)
  if (privateChannel) {
    privateChannel.notificationSettings = newSetting
    console.log(`[CHAT LAYOUT] Updated private channel:`, privateChannel)
    return
  }
  
  // Hľadaj vo verejných kanáloch
  const publicChannel = publicChannels.value.find(c => c.id === channelId)
  if (publicChannel) {
    publicChannel.notificationSettings = newSetting
    console.log(`[CHAT LAYOUT] Updated public channel:`, publicChannel)
    return
  }
  
  console.warn(`[CHAT LAYOUT] Channel ${channelId} not found in channels list`)
}

// Načíta správy pre daný kanál z backendu
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

// Prepne na iný kanál
function goToChannel(ch: { id: number; name: string; path?: string }) {
  currentChannelName.value = ch.name
  currentChannelId.value = ch.id

  if (ch.path) {
    void router.push(ch.path)
  }
}

// Odhlási používateľa a presmeruje na auth stránku
async function handleLogout() {
  await logout()
  await router.push('/auth')
}

// Type guard pre axios chyby
function isAxiosError(err: unknown): err is AxiosErrorLike {
  return (
    typeof err === 'object' &&
    err !== null &&
    'isAxiosError' in err &&
    (err as { isAxiosError?: unknown }).isAxiosError === true
  )
}

// Vytvorí nový kanál
async function handleCreateChannel(data: ChannelData) {
  const formattedName = data.name.replace(/^#/, '')
  const channelPath = `/chat/${data.type}-${data.name.toLowerCase().replace(/\s+/g, '-')}`

  // Kontrola či kanál už existuje
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

    // Vytvor kanál na backende
    const res = await axios.post<ChannelResponse>(
      'http://localhost:3333/channels',
      { name: formattedName,
        type: data.type,
        invitedMembers: data.invitedMembers || [],
        notificationSettings: data.notificationSettings},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const newChannelId = res.data.id

    // Pridaj používateľa do kanála ako admina
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

    // Pridaj kanál do lokálneho zoznamu
    const newChannel: UserChannel = {
      id: newChannelId,
      name: formattedName,
      path: channelPath,
      role: 'admin',
      type: data.type
    }

    if (data.type === 'private') privateChannels.value.push(newChannel)
    else publicChannels.value.push(newChannel)

    // Zobraz úspešnú notifikáciu a presmeruj
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

// Odošle správu cez socket pri stlačení Enter
function onEnterPress(e: KeyboardEvent) {
  if (e.key === 'Enter' && newMessage.value.trim() !== '') {
    const content = newMessage.value.trim()

    socket.emit("message", {
      channelId: currentChannelId.value,
      text: content,
      userId: currentUserId.value
    })

    newMessage.value = ""
  }
}

// Detekcia písania - zobrazí indikátor "typing..." na 1 sekundu
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

// Pri načítaní komponentu nastav všetko potrebné
onMounted(async () => {
  console.log('[CHAT LAYOUT] Mounting component...')
  
  // Načítaj ID používateľa z localStorage
  const savedUser = localStorage.getItem("user")
  if (savedUser) {
    const user = JSON.parse(savedUser)
    currentUserId.value = user.id
  }

  // Načítaj všetky kanály používateľa z backendu
  try {
    const token = localStorage.getItem('auth_token')
    const userId = currentUserId.value
    if (!token || !userId) return

    const res = await axios.get<UserChannel[]>(
      'http://localhost:3333/user/channels',
      { headers: { Authorization: `Bearer ${token}` } }
    )

    // Pridaj cestu a predvolené notifikačné nastavenia
    userChannels.value = res.data.map(ch => ({
      ...ch,
      path: `/chat/${ch.id}`,
      notificationSettings: ch.notificationSettings ?? 'all'
    }))

    // Rozdeľ kanály na súkromné a verejné
    privateChannels.value = userChannels.value.filter(ch => ch.type === 'private')
    publicChannels.value = userChannels.value.filter(ch => ch.type === 'public')

    // Ak používateľ je už na nejakej chat stránke, nastav aktívny kanál
    const found = userChannels.value.find(ch => ch.path === route.path)
    if (found) {
      currentChannelId.value = found.id
      currentChannelName.value = found.name
      activeChannelPath.value = found.path
    }

  } catch (err) {
    console.error('Failed to load user channels', err)
  }

  // Počúvaj zmeny viditeľnosti aplikácie (tab hidden/visible)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // Pripoj sa k socket roomke pre aktuálny kanál
  if (currentChannelId.value) {
    socket.emit('join', `channel_${currentChannelId.value}`)
  }

  // Počúvaj nové správy zo socketu
  socket.on('newMessage', (msg: Message) => {
    // Pridaj správu do zoznamu ak patrí do aktuálneho kanála
    if (msg.channelId === currentChannelId.value) {
      messages.value.push(msg)
    }

    // Ignoruj notifikácie pre vlastné správy
    if (msg.userId === currentUserId.value) {
      console.log('Ignoring own message')
      return
    }

    // Ak je aplikácia viditeľná, neposielaj notifikáciu
    if (isAppVisible.value) {
      console.log('App is visible, skipping notification')
      return
    }

    // Nájdi kanál v pamäti
    const channel = [...privateChannels.value, ...publicChannels.value]
      .find(ch => ch.id === msg.channelId)
    
    if (!channel) {
      console.warn('Channel not found for message', msg.channelId)
      return
    }

    // Použij notifikačné nastavenia z pamäte
    const notifSettings = channel.notificationSettings || 'all'
    
    console.log(`[NOTIFICATION DEBUG] Channel: ${channel.name}, Setting: ${notifSettings}`)

    // Rozhoduj či zobraziť notifikáciu podľa nastavení
    let shouldNotify = false

    switch (notifSettings) {
      case 'none':
        shouldNotify = false
        console.log(`[NOTIFICATION DEBUG] Setting is 'none' - NOT notifying`)
        break

      case 'mentions':
        // Notifikuj len pri @mention
        shouldNotify = msg.isPing === true
        console.log(`[NOTIFICATION DEBUG] Setting is 'mentions' - isPing: ${msg.isPing} - ${shouldNotify ? 'NOTIFYING' : 'NOT notifying'}`)
        break

      case 'all':
      default:
        // Notifikuj pri každej správe
        shouldNotify = true
        console.log(`[NOTIFICATION DEBUG] Setting is 'all' - NOTIFYING`)
    }

    // Zobraz notifikáciu ak je to potrebné
    if (shouldNotify) {
      console.log(`[NOTIFICATION DEBUG] ✓ Showing notification`)
      
      const channelName = channel.name
      notificationSender.value = `${msg.user} (#${channelName})`
      notificationMessage.value = msg.text
      showNotification.value = true

      // Skry notifikáciu po 5 sekundách
      setTimeout(() => {
        showNotification.value = false
      }, 5000)
    } else {
      console.log(`[NOTIFICATION DEBUG] ✗ Notification blocked by settings`)
    }
  })
})

// Vyčisti listenery pri odstránení komponentu (zabráni duplicitným notifikáciám)
onBeforeUnmount(() => {
  console.log('[CHAT LAYOUT] Cleaning up...')
  
  // Odstráň socket listenery
  if (socket) {
    socket.off('newMessage')
    if (currentChannelId.value) {
      socket.emit('leave', `channel_${currentChannelId.value}`)
    }
  }
  
  // Odstráň visibility listener
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

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
/* Hlavný wrapper pre obsah */
.main-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

/* Pozadie chat oblasti */
.chat-bg {
  flex: 1;
  overflow-y: auto;
  background-color: #1E1E1E;
  padding-bottom: 80px; /* Miesto pre footer */
}
</style>