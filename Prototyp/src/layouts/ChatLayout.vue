<template>
  <q-layout view="hHh Lpr lFf" class="bg-dark text-white">

    <!-- HEADER -->
    <q-header elevated class="header-bar q-px-lg q-py-sm flex items-center">
      <div class="header-logo">
        <img src="/pictures/logo.jpg" alt="Logo" height="40" />
      </div>

      <q-btn
        v-if="$q.screen.lt.md"
        dense
        flat
        round
        icon="menu"
        class="q-mr-sm"
        @click="drawerOpen = !drawerOpen"
      />

      <!-- COMMAND LINE -->
      <q-input
        v-model="command"
        filled
        dense
        placeholder="Command line"
        class="command-input mx-auto"
        input-class="command-input-text"
      />

      <!-- Settings & Help -->
      <q-btn
        flat
        label="Settings & Help"
        class="settings-btn"
      >

      <!-- MENU -->
        <q-menu transition-show="jump-down" transition-hide="jump-up">
          <div class="menu-container">
            <div class="menu-header">Settings & Help</div>
            <q-separator color="white" />
            <q-list dense>
              <q-item clickable v-ripple>
                <q-item-section>Notifications</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>Status</q-item-section>
              </q-item>
              <q-item clickable v-ripple>
                <q-item-section>Commands</q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-menu>
      </q-btn>

    </q-header>

<!-- SIDEBAR -->
    <q-drawer
      v-model="drawerOpen"
      show-if-above
      side="left"
      bordered
      bg-color="#355070"
      class="sidebar"
    >
      <!-- CHANNELS -->
      <div class="q-pa-md text-bold sidebar-title">CHANNELS</div>

      <div class="sidebar-divider"></div>

      <!-- Private Channels -->
      <div class="q-pa-sm sidebar-subtitle">Private Channels</div>
      <q-list dense>
        <q-item
          clickable
          v-for="ch in privateChannels"
          :key="ch.name"
          @click="goToChannel(ch)"
          class="sidebar-item"
        >
          <q-item-section>{{ ch.name }}</q-item-section>
        </q-item>
      </q-list>

      <div class="sidebar-divider"></div>

  <!-- Public Channels -->
      <div class="q-pa-sm sidebar-subtitle">Public Channels</div>
      <q-list dense>
        <q-item
          clickable
          v-for="ch in publicChannels"
          :key="ch.name"
          @click="goToChannel(ch)"
          class="sidebar-item"
        >
          <q-item-section>{{ ch.name }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- MAIN CONTENT -->
    <q-page-container class="chat-bg">
      <router-view />
    </q-page-container>

    <!-- Typing status -->
    <div class="typing-status-fixed" :style="typingStatusStyle">
      User 1 is typing...
    </div>

    <footer
      class="chat-footer row items-center q-pa-sm"
      :style="footerStyle"
    >
      <q-input
        v-model="newMessage"
        placeholder="Start writing..."
        class="col chat-input"
        dense
        outlined
        borderless
      />
    </footer>

  </q-layout>
</template>



<script lang="ts" setup>

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()
const command = ref('')
const newMessage = ref('')
const drawerOpen = ref($q.screen.gt.sm)
const drawerWidth = 300

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

</script>



<style>

.chat-bg {
  background-color: #1E1E1E;
}

.header-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  height: 60px;
  display: flex;
  align-items: center;
  background-color: #283C55;
  box-shadow: none;
  border-bottom: 1px solid #000;
}

.header-logo img {
  height: 40px;
  border-radius: 8px;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #283C55;
  height: 60px;
  padding: 0 16px;
}

.command-input {
  width: 400px;
  border-radius: 15px;
  background-color: #355070;
  text-align: center;
}

.command-input-text {
  color: #FFFFFF;
}

.command-input :deep(input::placeholder) {
  color: #FFFFFF;
}

.settings-btn {
  background-color: gray;
  color: white;
  border-radius: 15px;
  padding: 4px 16px;
}

.settings-btn:hover {
  background-color: darkgray;
}

.sidebar {
  background-color: #355070 !important;
  border-right: 1px solid #283C55;
  box-shadow: none !important;
}

.sidebar-title {
  color: #FFFFFF;
}

.sidebar-item {
  color: #FFFFFF;
}

.sidebar-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.chat-footer {
  z-index: 2100;
}

.chat-input {
  border-radius: 15px;
  background-color: white;
  padding: 6px 12px;
}

.typing-status-fixed {
  background: transparent;
}

.sidebar-divider {
  height: 1px;
  background-color: rgba(255,255,255,0.3);
  margin:  8px 8px 8px 8px;
}

.sidebar-subtitle {
  color: #FFFFFF;
  font-weight: bold;
  margin-top: 8px;
  margin-bottom: 4px;
  font-size: 0.85rem;
}

.menu-container {
  background-color: #333333;
  color: white;
  min-width: 180px;
  border-radius: 8px;
  overflow: hidden;
}

.menu-header {
  background-color: #2b3a55;
  color: white;
  font-weight: bold;
  text-align: center;
  padding: 8px 0;
}

.q-item {
  color: white;
}

.q-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

</style>

