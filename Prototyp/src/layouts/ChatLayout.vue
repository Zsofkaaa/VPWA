<template>
  <q-layout view="hHh Lpr lFf" class="bg-dark text-white">

    <!-- HEADER -->
    <Header v-model:command="command" v-model:drawer-open="drawerOpen" />

    <!-- SIDEBAR -->
    <Sidebar
      v-model:drawer-open="drawerOpen"
      :private-channels="privateChannels"
      :public-channels="publicChannels"
      @go-to-channel="goToChannel"
      @logout="handleLogout"
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

const router = useRouter()
const $q = useQuasar()
const command = ref('')
const newMessage = ref('')
const drawerOpen = ref($q.screen.gt.sm)
const drawerWidth = 300
const isTyping = ref(false)
const showNotification = ref(false)

const privateChannels = ref([
  { name: '#private-1', path: '/chat/private1' },
  { name: '#private-2', path: '/chat/private2' }
])

const publicChannels = ref([
  { name: '#public-1', path: '/chat/public1' },
  { name: '#public-2', path: '/chat/public2' },
  { name: '#public-3', path: '/chat/public3' }
])

function goToChannel(ch: { path: string }) {
  void router.push(ch.path)
}

function onEnterPress(e: KeyboardEvent) {
  if (e.key === 'Enter' && newMessage.value.trim() !== '') {
    e.preventDefault()
    showNotification.value = true
    newMessage.value = ''

    setTimeout(() => {
      showNotification.value = false
    }, 2500)
  }
}

function handleLogout() {
  console.log('Logging out...')

  localStorage.removeItem('userToken')

  void router.push('/')
}


const footerStyle = computed(() => ({
  left: $q.screen.lt.md ? '0' : `${drawerWidth}px`,
  right: '0',
  bottom: '10px',
  position: 'fixed' as const
}))

const typingStatusStyle = computed(() => ({
  position: 'fixed' as const,
  left: $q.screen.lt.md ? '0' : `${drawerWidth}px`,
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