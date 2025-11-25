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
      :invites="invites"
      @go-to-channel="goToChannel"
      @logout="handleLogout"
      @createChannel="handleCreateChannel"
      @leftChannel="handleChannelLeft"
      @notification-setting-changed="handleNotificationSettingChanged"
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

interface AppUser {
  id: number
  nickName: string
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

// Odstráni kanál zo zoznamu po opustení/vymazaní
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

async function handleCancelCommand() {
  if (!currentChannelId.value) {
    $q.notify({ type: 'negative', message: 'You are not in any channel!' })
    return
  }

  const channelId = currentChannelId.value
  const allChannels = [...privateChannels.value, ...publicChannels.value]
  const channel = allChannels.find(ch => ch.id === channelId)

  if (!channel) {
    $q.notify({ type: 'negative', message: 'Channel not found!' })
    return
  }

  const token = localStorage.getItem('auth_token')
  const isAdmin = channel.role === 'admin'

  try {
    if (isAdmin) {
      // CSATORNA TÖRLÉS
      await axios.delete(`${API_URL}/channels/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // törlés frontendről
      privateChannels.value = privateChannels.value.filter(c => c.id !== channelId)
      publicChannels.value = publicChannels.value.filter(c => c.id !== channelId)

      $q.notify({
        type: 'positive',
        message: `Channel "${channel.name}" deleted.`
      })

    } else {
      // KILÉPÉS
      await axios.delete(`${API_URL}/channels/${channelId}/leave`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      handleChannelLeft(channelId)

      $q.notify({
        type: 'positive',
        message: `You left channel "${channel.name}".`
      })
    }

    // UI reset
    currentChannelId.value = null
    currentChannelName.value = ''
    messages.value = []
    activeChannelPath.value = ''

    void router.push('/')

  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Failed to cancel channel!'
    })
  }
}

async function handleJoinCommand(parts: string[]) {
  const isPrivate = parts.includes('[private]')

  const nameParts = parts.slice(1).filter(p => p !== '[private]')
  const channelName = nameParts.join(' ')

  if (!channelName) {
    return $q.notify({ type: 'negative', message: 'Channel name is required!' })
  }

  try {
    const token = localStorage.getItem('auth_token')
    if (!token || !currentUserId.value) throw new Error('Not authenticated')

    // 1️⃣ Lekérdezzük az összes csatornát globálisan
    const allChannelsRes = await axios.get(`${API_URL}/channels`)
    const allChannels = allChannelsRes.data as Channel[]

    const existingChannelGlobal = allChannels.find(
      c => c.name.toLowerCase() === channelName.toLowerCase()
    )

    let channelId: number

    if (existingChannelGlobal) {
      // 2️⃣ CSATLAKOZÁS LÉTEZŐ CSATORNÁHOZ
      await axios.post(
        `${API_URL}/user_channel`,
        {
          channelId: existingChannelGlobal.id,
          userId: currentUserId.value,
          role: isPrivate ? 'admin' : 'member',
          notificationSettings: 'all'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      channelId = existingChannelGlobal.id

      const newLocalChannel: UserChannel = {
        id: channelId,
        name: existingChannelGlobal.name,
        path: `/chat/${channelId}`,
        type: existingChannelGlobal.type,
        role: isPrivate ? 'admin' : 'member'
      }

      // 3️⃣ helyi lista frissítése
      if (existingChannelGlobal.type === 'private')
        privateChannels.value.push(newLocalChannel)
      else
        publicChannels.value.push(newLocalChannel)

      $q.notify({
        type: 'positive',
        message: `Joined channel "${channelName}"`
      })

    } else {
      // 4️⃣ LÉTREHOZÁS
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

      $q.notify({
        type: 'positive',
        message: `Channel "${channelName}" created!`
      })
    }

    currentChannelName.value = channelName
    currentChannelId.value = channelId

    void router.push(`/chat/${channelId}`)

  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Failed to join or create channel!'
    })
  }
}

async function handleQuitCommand() {
  if (!currentChannelId.value) {
    $q.notify({
      type: 'negative',
      message: 'You are not in any channel!'
    })
    return
  }

  const channelId = currentChannelId.value
  const allChannels = [...privateChannels.value, ...publicChannels.value]
  const channel = allChannels.find(ch => ch.id === channelId)

  if (!channel) {
    $q.notify({
      type: 'negative',
      message: 'Channel not found!'
    })
    return
  }

  // 🔒 ADMIN ELLENŐRZÉS
  if (channel.role !== 'admin') {
    $q.notify({
      type: 'negative',
      message: 'You cannot use this command, you are not the admin!'
    })
    return
  }

  const token = localStorage.getItem('auth_token')

  try {
    // 💣 Csatorna törlése
    await axios.delete(`${API_URL}/channels/${channelId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    // törlés frontendből
    privateChannels.value = privateChannels.value.filter(c => c.id !== channelId)
    publicChannels.value = publicChannels.value.filter(c => c.id !== channelId)

    $q.notify({
      type: 'positive',
      message: `Channel "${channel.name}" deleted.`
    })

    // UI reset
    currentChannelId.value = null
    currentChannelName.value = ''
    messages.value = []
    activeChannelPath.value = ''

    void router.push('/')

  } catch (err) {
    console.error(err)
    $q.notify({
      type: 'negative',
      message: 'Failed to delete channel!'
    })
  }
}

async function handleKickCommand(parts: string[]) {
  if (!currentChannelId.value) {
    return $q.notify({ type: 'negative', message: 'You are not in any channel!' })
  }

  const channelId = currentChannelId.value

  // több szóból álló nickName
  const targetName = parts.slice(1).join(' ')

  if (!targetName) {
    return $q.notify({ type: 'negative', message: 'Usage: /kick nickName' })
  }

  const allChannels = [...privateChannels.value, ...publicChannels.value]
  const channel = allChannels.find(c => c.id === channelId)

  if (!channel) {
    return $q.notify({ type: 'negative', message: 'Channel not found!' })
  }

  const isAdmin = channel.role === 'admin'

  try {
    const token = localStorage.getItem('auth_token')

    // Megkeressük előbb a user ID-t
    const users = await axios.get<AppUser[]>(
      `${API_URL}/users`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    const targetUser = users.data.find(
      u => u.nickName.toLowerCase() === targetName.toLowerCase()
    )

    if (!targetUser) {
      return $q.notify({ type: 'negative', message: 'User not found!' })
    }

    if (targetUser.id === currentUserId.value) {
      return $q.notify({ type: 'negative', message: 'You cannot kick yourself!' })
    }

    // 🔥 ADMIN → permanens ban
    if (isAdmin) {
      await axios.delete(
        `${API_URL}/channels/${channelId}/ban/${targetUser.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      $q.notify({
        type: 'positive',
        message: `User "${targetName}" permanently banned`
      })

    } else {
      // 🟡 MEMBER → normál kick (1/3)
      await axios.delete(
        `${API_URL}/channels/${channelId}/kick/${targetUser.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      $q.notify({
        type: 'positive',
        message: `You kicked "${targetName}"`
      })
    }

  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Failed to kick user!' })
  }
}

async function handleInviteCommand(parts: string[]) {
  if (!currentChannelId.value) {
    return $q.notify({ type: 'negative', message: 'You are not in any channel!' })
  }

  const channelId = currentChannelId.value

  // több szóból álló név kezelése
  const targetName = parts.slice(1).join(' ')

  if (!targetName) {
    return $q.notify({ type: 'negative', message: 'Usage: /invite nickName' })
  }

  const allChannels = [...privateChannels.value, ...publicChannels.value]
  const channel = allChannels.find(c => c.id === channelId)

  if (!channel) {
    return $q.notify({ type: 'negative', message: 'Channel not found!' })
  }

  const isPrivate = channel.type === 'private'
  const isAdmin = channel.role === 'admin'

  // Private → csak admin hívhat
  if (isPrivate && !isAdmin) {
    return $q.notify({ type: 'negative', message: 'Only admin can invite in private channels!' })
  }

  try {
    const token = localStorage.getItem('auth_token')

    // 🔎 nagy probléma: először meg kell találni a user ID-t!
    const users = await axios.get<AppUser[]>(
      `${API_URL}/users`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    const targetUser = users.data.find(
      u => u.nickName.toLowerCase() === targetName.toLowerCase()
    )

    if (!targetUser) {
      return $q.notify({ type: 'negative', message: 'User not found!' })
    }

    // 🔥 HELYES → userId kell, nem nickname
    await axios.post(
      `${API_URL}/channels/${channelId}/invite`,
      { userId: targetUser.id },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    $q.notify({
      type: 'positive',
      message: `Invite sent to "${targetName}"`
    })

  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Failed to invite user!' })
  }
}

async function handleRevokeCommand(parts: string[]) {
  if (!currentChannelId.value) {
    return $q.notify({ type: 'negative', message: 'You are not in any channel!' })
  }

  const channelId = currentChannelId.value
  const targetName = parts[1]

  if (!targetName) {
    return $q.notify({ type: 'negative', message: 'Usage: /revoke nickName' })
  }

  const allChannels = [...privateChannels.value, ...publicChannels.value]
  const channel = allChannels.find(c => c.id === channelId)

  if (!channel) {
    return $q.notify({ type: 'negative', message: 'Channel not found!' })
  }

  const isAdmin = channel.role === 'admin'

  if (!isAdmin) {
    return $q.notify({ type: 'negative', message: 'Only admin can revoke users!' })
  }

  try {
    const token = localStorage.getItem('auth_token')

    const users = await axios.get<AppUser[]>(
      `${API_URL}/users`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    const targetUser = users.data.find(
      (u) => u.nickName.toLowerCase() === targetName.toLowerCase()
    )

    if (!targetUser) {
      return $q.notify({ type: 'negative', message: 'User not found!' })
    }

    await axios.delete(
      `${API_URL}/channels/${channelId}/ban/${targetUser.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    $q.notify({ type: 'positive', message: `${targetName} removed from channel` })

  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Failed to revoke user!' })
  }
}

async function handleCommand(cmd: string) {
  const parts = cmd.trim().split(' ')
  const command = parts[0]

  if (command === '/cancel') {
    return await handleCancelCommand()
  }

  if (command === '/join') {
    return await handleJoinCommand(parts)
  }

  if (command === '/quit') {
  return await handleQuitCommand()
}

if (command === '/invite') {
  return await handleInviteCommand(parts)
}

if (command === '/revoke') {
  return await handleRevokeCommand(parts)
}

if (command === '/kick') {
  return await handleKickCommand(parts)
}

  // Unknown command
  $q.notify({ type: 'warning', message: 'Unknown command' })
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

function handleIncomingMessage(msg: Message) {
  // Pridaj správu do zoznamu ak patrí do aktuálneho kanála
  if (msg.channelId === currentChannelId.value) {
    messages.value.push(msg)
  }

  // Ignoruj notifikácie pre vlastné správy
  if (msg.userId === currentUserId.value) return

  // Ak je aplikácia viditeľná, neposielaj notifikáciu
  if (isAppVisible.value) return

  // Nájdi kanál v pamäti
  const channel = [...privateChannels.value, ...publicChannels.value]
    .find(ch => ch.id === msg.channelId)

  if (!channel) return

  // Použij notifikačné nastavenia z pamäte
  const notifSettings = channel.notificationSettings || 'all'

  // Rozhoduj či zobraziť notifikáciu podľa nastavení
  let shouldNotify = false

  switch (notifSettings) {
    case 'none': shouldNotify = false; break
    case 'mentions': shouldNotify = msg.isPing === true; break
    case 'all':
    default: shouldNotify = true
  }

  // Zobraz notifikáciu ak je to potrebné
  if (shouldNotify) {
    notificationSender.value = `${msg.user} (#${channel.name})`
    notificationMessage.value = msg.text
    showNotification.value = true

    // Skry notifikáciu po 5 sekundách
    setTimeout(() => {
      showNotification.value = false
    }, 5000)
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
  socket.on('newMessage', handleIncomingMessage)
})

// Vyčisti listenery pri odstránení komponentu (zabráni duplicitným notifikáciám)
onBeforeUnmount(() => {
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
