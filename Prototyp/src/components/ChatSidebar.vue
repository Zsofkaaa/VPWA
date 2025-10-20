<template>
  <q-drawer
    :model-value="drawerOpen"
    @update:model-value="$emit('update:drawerOpen', $event)"
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
    <div class="channel-list">
      <div v-for="ch in privateChannels" :key="ch.name" class="channel-wrapper">
        <q-item
          clickable
          @click="selectChannel(ch)"
          :class="['sidebar-item', { 'active-channel': ch.path === activeChannelPath }]"
        >
          <q-item-section>{{ ch.name }}</q-item-section>
        </q-item>
        <ManageChannelMenu v-if="ch.path === activeChannelPath" />
      </div>
    </div>

    <div class="sidebar-divider"></div>

    <!-- Public Channels -->
    <div class="q-pa-sm sidebar-subtitle">Public Channels</div>
    <div class="channel-list">
      <div v-for="ch in publicChannels" :key="ch.name" class="channel-wrapper">
        <q-item
          clickable
          @click="selectChannel(ch)"
          :class="['sidebar-item', { 'active-channel': ch.path === activeChannelPath }]"
        >
          <q-item-section>{{ ch.name }}</q-item-section>
        </q-item>
        <ManageChannelMenu v-if="ch.path === activeChannelPath" />
      </div>
    </div>

    <!-- Logout button -->
    <div class="logout-wrapper">
      <q-btn
        flat
        color="red"
        icon="logout"
        label="Log Out"
        class="logout-btn"
        @click="$emit('logout')"
      />
    </div>
  </q-drawer>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import ManageChannelMenu from './ManageChannelMenu.vue'

interface Channel {
  name: string
  path: string
}

defineProps<{
  drawerOpen: boolean
  privateChannels: Channel[]
  publicChannels: Channel[]
}>()

const emit = defineEmits<{
  'update:drawerOpen': [value: boolean]
  'goToChannel': [channel: Channel]
  'logout': []
}>()

const activeChannelPath = ref<string>('')

function selectChannel(ch: Channel) {
  activeChannelPath.value = ch.path
  emit('goToChannel', ch)
}
</script>

<style>
.sidebar {
  background-color: #355070 !important;
  border-right: 1px solid #283C55;
  box-shadow: none !important;
}

.sidebar-title {
  color: #FFFFFF;
}

.channel-list {
  display: flex;
  flex-direction: column;
}

.channel-wrapper {
  display: flex;
  flex-direction: column;
}

.sidebar-item {
  color: #FFFFFF;
  transition: background-color 0.2s ease, font-weight 0.2s ease;
}

.sidebar-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.active-channel {
  background-color: rgba(255, 255, 255, 0.25);
  font-weight: bold;
  border-left: 3px solid #FFFFFF;
}

.sidebar-divider {
  height: 1px;
  background-color: rgba(255,255,255,0.3);
  margin: 8px;
}

.sidebar-subtitle {
  color: #FFFFFF;
  font-weight: bold;
  margin-top: 8px;
  margin-bottom: 4px;
  font-size: 0.85rem;
}

.logout-wrapper {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  padding: 0 20px;
}

.logout-btn {
  width: 100%;
  background-color: rgba(255, 0, 0, 0.15);
  font-weight: bold;
  text-transform: none;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.logout-btn:hover {
  background-color: rgba(255, 0, 0, 0.3);
}
</style>