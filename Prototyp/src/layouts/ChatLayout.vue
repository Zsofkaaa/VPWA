<template>
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

    <!-- Typing status -->
    <TypingStatus
      v-if="isTyping"
      :typing-status-style="typingStatusStyle"
    />

    <ChatFooter
      v-model:new-message="newMessage"
      :footer-style="footerStyle"
      @enter-press="onEnterPress"
    />

    <!-- Notification Popup -->
    <NotificationPopUp
      :visible="showNotification"
      sender="User 1"
      message="Message sent!"
      logo="/pictures/logo.jpg"
    />
  </q-layout>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import NotificationPopUp from 'components/NotificationPopUp.vue'
import Header from 'components/ChatHeader.vue'
import Sidebar from 'components/ChatSidebar.vue'
import ChatFooter from 'components/ChatFooter.vue'
import TypingStatus from 'components/TypingStatus.vue'

defineOptions({ name: 'ChatLayout' })

interface ChannelData {
  name: string
  visibility: 'private' | 'public'
  description: string
  invitedMembers: string[]
  notificationLevel: string
}

const router = useRouter()
const $q = useQuasar()
const drawerOpen = ref($q.screen.gt.sm)
const newMessage = ref('')
const isTyping = ref(false)
const showNotification = ref(false)
const currentChannelName = ref('')

const privateChannels = ref([
  { name: '#private-1', path: '/chat/private1' },
  { name: '#private-2', path: '/chat/private2' }
])

const publicChannels = ref([
  { name: '#public-1', path: '/chat/public1' },
  { name: '#public-2', path: '/chat/public2' },
  { name: '#public-3', path: '/chat/public3' }
])

function goToChannel(ch: { name: string; path: string }) {
  currentChannelName.value = ch.name
  void router.push(ch.path)
}

function handleLogout() {
  localStorage.removeItem('userToken')
  void router.push('/')
}

function handleCreateChannel(data: ChannelData) {
  // Format channel name
  const formattedName = data.name.startsWith('#') ? data.name : `#${data.name}`
  
  // Check if channel name already exists in both categories
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
  
  // Generate a path for the new channel
  const channelPath = `/chat/${data.visibility}-${data.name.toLowerCase().replace(/\s+/g, '-')}`
  
  const newChannel = {
    name: formattedName,
    path: channelPath
  }
  
  // Add to appropriate category based on visibility
  if (data.visibility === 'private') {
    privateChannels.value.push(newChannel)
  } else {
    publicChannels.value.push(newChannel)
  }
  
  // Show success notification
  $q.notify({
    type: 'positive',
    message: `Channel "${newChannel.name}" created successfully!`,
    position: 'top',
    timeout: 2000
  })
  
  // Navigate to the new channel
  currentChannelName.value = newChannel.name
  void router.push(channelPath)
}

function onEnterPress(e: KeyboardEvent) {
  if (e.key === 'Enter' && newMessage.value.trim() !== '') {
    e.preventDefault()
    showNotification.value = true
    newMessage.value = ''
    setTimeout(() => { showNotification.value = false }, 2500)
  }
}

const footerStyle = computed(() => ({
  left: $q.screen.lt.md ? '0' : '300px',
  right: '0',
  bottom: '10px',
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
</script>

<style>
.chat-bg {
  background-color: #1E1E1E;
}
</style>