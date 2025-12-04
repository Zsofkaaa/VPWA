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
        :typing-content="typingContent"
        :typing-status-style="typingStatusStyle"
      />

      <!-- Panel pre zadávanie správy -->
      <ChatFooter
        v-if="isChatPage"
        v-model:new-message="newMessage"
        :footer-style="footerStyle"
        @enter-press="onEnterPress"
        @typing="handleTyping"
        @typing-content="handleTypingContent"
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
import { useChannelManagement } from 'src/composables/useChannelManagement'
import { useMessages } from 'src/composables/useMessages'
import { useSocketEvents } from 'src/composables/useSocketEvents'
import { useNotifications } from 'src/composables/useNotifications'
import { useInvites } from 'src/composables/useInvites'

// Komponenty
import Header from 'components/ChatHeader.vue'
import Sidebar from 'components/ChatSidebar.vue'
import ChatFooter from 'components/ChatFooter.vue'
import TypingStatus from 'components/TypingStatus.vue'

// Vue a utility
const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const { logout } = useAuth()
const instance = getCurrentInstance()
const socket = instance!.appContext.config.globalProperties.$socket

// Základné stavy
const drawerOpen = ref($q.screen.gt.sm)
const currentUserId = ref<number | null>(null)

// Channel Management Composable
const {
  privateChannels,
  publicChannels,
  currentChannelId,
  currentChannelName,
  activeChannelPath,
  loadUserChannels,
  goToChannel,
  handleCreateChannel,
  handleChannelLeft,
  handleNotificationSettingChanged
} = useChannelManagement(currentUserId, router, $q)

// Messages Composable
const {
  messages,
  newMessage,
  loadMessages,
  sendMessage
} = useMessages(currentChannelId, currentUserId, privateChannels, publicChannels, $q, socket)

// Socket Events Composable
const {
  isTyping,
  typingUser,
  typingContent,
  handleTyping,
  handleTypingContent,
  setupSocketListeners,
  cleanupSocketListeners,
  joinChannel,
  leaveChannel
} = useSocketEvents(socket, currentChannelId)

// Notifications Composable
const {
  showNotification,
  notificationSender,
  notificationMessage,
  requestNotificationPermission,
  handleIncomingMessage
} = useNotifications()

// Invites Composable
const {
  invites,
  loadInvites
} = useInvites()

// Channel Commands Composable
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

// Wrapper pre onEnterPress, ktorý spracuje príkazy
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

// Logout handler
async function handleLogout() {
  await logout()
  await router.push('/auth')
}

// Watchers
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

watch(
  () => route.path,
  async (newPath) => {
    const allChannels = [...privateChannels.value, ...publicChannels.value]
    const found = allChannels.find(ch => ch.path === newPath)

    if (found) {
      const oldChannel = currentChannelId.value

      currentChannelName.value = found.name
      currentChannelId.value = found.id
      activeChannelPath.value = found.path

      if (typeof currentUserId.value !== 'number' || typeof currentChannelId.value !== 'number') {
        console.warn('Invalid IDs, skip backend query', currentUserId.value, currentChannelId.value)
        return
      }

      if (oldChannel) leaveChannel(oldChannel)
      joinChannel(found.id)

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

/*
watch(currentChannelId, (id, oldId) => {
  if (!socket) return

  if (oldId) {
    leaveChannel(oldId)
  }
  if (id) {
    joinChannel(id)
  }
})
*/

// Lifecycle hooks
onMounted(async () => {
  // console.log('[CHAT LAYOUT] Mounting component...')

  await requestNotificationPermission()

  // Načítaj aktuálneho používateľa
  const savedUser = localStorage.getItem("user")
  if (savedUser) {
    const user = JSON.parse(savedUser)
    currentUserId.value = user.id
  }

  // Načítaj kanály používateľa
  const token = localStorage.getItem('auth_token')
  if (token && currentUserId.value) {
    await loadUserChannels(currentUserId.value, token)

    const found = [...privateChannels.value, ...publicChannels.value].find(ch => ch.path === route.path)
    if (found) {
      currentChannelId.value = found.id
      currentChannelName.value = found.name
      activeChannelPath.value = found.path
    }
  }

  // Setup socket listeners
  if (currentChannelId.value) {
    joinChannel(currentChannelId.value)
  }

  setupSocketListeners((msg) => {
    // console.log('[SOCKET DBG] newMessage received', msg)
    handleIncomingMessage(
      msg,
      [...privateChannels.value, ...publicChannels.value],
      currentUserId.value,
      currentChannelId.value,
      messages,
      router
    )
  })

  await loadInvites()
})

onBeforeUnmount(() => {
  cleanupSocketListeners()
  if (currentChannelId.value) {
    leaveChannel(currentChannelId.value)
  }
})

// Provide data pre child komponenty
provide('messages', messages)
provide('currentUserId', currentUserId)
provide('userChannels', computed(() => [...privateChannels.value, ...publicChannels.value]))
provide('currentChannelId', currentChannelId)
provide('currentChannelName', currentChannelName)
provide('activeChannelPath', activeChannelPath)
provide('typingContent', typingContent)

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
