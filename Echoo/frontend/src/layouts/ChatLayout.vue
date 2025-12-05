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

      <!-- Indikátor písania správy - UPDATED -->
      <TypingStatus
        v-if="isTyping"
        :typing-users="typingUsers"
        :typing-status-style="typingStatusStyle"
      />

      <!-- Panel pre zadávanie správy -->
      <ChatFooter
        v-if="isChatPage"
        v-model:new-message="newMessage"
        :footer-style="footerStyle"
        :typing-users="typingUsers"
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
import { ref, computed, watch, provide, getCurrentInstance } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuth } from '../composables/useAuth'
import { useChannelCommands } from 'src/composables/useChannelCommands'
import { useChannelManagement } from 'src/composables/useChannelManagement'
import { useMessages } from 'src/composables/useMessages'
import { useSocketEvents } from 'src/composables/useSocketEvents'
import { useNotifications } from 'src/composables/useNotifications'
import { useInvites } from 'src/composables/useInvites'
import { useChannelRemoval } from 'src/composables/useChannelRemoval'
import { useAppInitialization } from 'src/composables/useAppInitialization'

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

// Channel Removal Composable
const {
  handleChannelDeleted,
  handleUserKicked,
  handleUserBanned
} = useChannelRemoval(
  privateChannels,
  publicChannels,
  currentChannelId,
  currentChannelName,
  activeChannelPath,
  messages,
  router,
  $q
)

// Socket Events Composable - UPDATED
const {
  isTyping,
  typingUsers,
  handleTyping,
  handleTypingContent,
  setupSocketListeners,
  cleanupSocketListeners,
  joinChannel,
  leaveChannel,
  joinUserRoom
} = useSocketEvents(
  socket,
  currentChannelId,
  // Invite callback
  (inviteData) => {
    // console.log('[LAYOUT] New invite received:', inviteData)
    void loadInvites()
    $q.notify({
      type: 'info',
      message: `You have a new invite to "${inviteData.channel.name}"`,
      position: 'top-right',
      timeout: 3000
    })
  },
  // Channel joined callback
  (channelData) => {
    console.log('[LAYOUT] Channel joined:', channelData)
    const token = localStorage.getItem('auth_token')
    if (token && currentUserId.value) {
      void loadUserChannels(currentUserId.value, token)
    }
  },
  // Channel deleted callback
  (data) => {
    handleChannelDeleted(data.channelId, data.channelName, data.deletedBy, currentUserId.value)
  },
  // User kicked callback
  (data) => {
    handleUserKicked(data.userId, data.channelId, data.channelName, currentUserId.value)
  },
  // User banned callback
  (data) => {
    handleUserBanned(data.userId, data.channelId, data.channelName, currentUserId.value)
  }
)

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

// App Initialization (onMounted/onBeforeUnmount logic)
useAppInitialization({
  currentUserId,
  currentChannelId,
  currentChannelName,
  activeChannelPath,
  privateChannels,
  publicChannels,
  messages,
  route,
  requestNotificationPermission,
  loadUserChannels,
  loadInvites,
  joinChannel,
  joinUserRoom,
  leaveChannel,
  setupSocketListeners,
  cleanupSocketListeners,
  handleIncomingMessage,
  router
})

// Provide data pre child komponenty
provide('messages', messages)
provide('currentUserId', currentUserId)
provide('userChannels', computed(() => [...privateChannels.value, ...publicChannels.value]))
provide('currentChannelId', currentChannelId)
provide('currentChannelName', currentChannelName)
provide('activeChannelPath', activeChannelPath)
provide('privateChannels', privateChannels)
provide('publicChannels', publicChannels)

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
