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
    <!-- Scrollable content wrapper -->
    <div class="sidebar-content">
      <!-- CHANNELS & Add Channel -->
      <div class="q-pa-md row items-center justify-between sidebar-title-wrapper">
        <div class="text-bold sidebar-title">CHANNELS</div>
        <q-btn
          flat
          dense
          round
          icon="add"
          color="white"
          @click="showAddChannelDialog = true"
          class="add-channel-btn"
          size="sm"
        />
      </div>

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

      <!-- Bottom spacer to prevent content from going under logout button -->
      <div style="height: 80px;"></div>
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

    <!-- Add Channel Dialog -->
    <AddChannelDialog
      v-model:visible="showAddChannelDialog"
      :existing-channels="allChannelNames"
      @create="handleCreateChannel"
    />
  </q-drawer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import ManageChannelMenu from './ManageChannelMenu.vue'
import AddChannelDialog from './AddChannelDialog.vue'

interface Channel {
  name: string
  path: string
}

interface ChannelData {
  name: string
  visibility: 'private' | 'public'
  description: string
  invitedMembers: string[]
  notificationLevel: string
}

const props = defineProps<{
  drawerOpen: boolean
  privateChannels: Channel[]
  publicChannels: Channel[]
}>()

const emit = defineEmits<{
  'update:drawerOpen': [value: boolean]
  'goToChannel': [channel: Channel]
  'logout': []
  'createChannel': [data: ChannelData]
}>()

const activeChannelPath = ref<string>('')
const showAddChannelDialog = ref(false)

const allChannelNames = computed(() => {
  return [...props.privateChannels, ...props.publicChannels].map(ch => ch.name)
})

function selectChannel(ch: Channel) {
  activeChannelPath.value = ch.path
  emit('goToChannel', ch)
}

function handleCreateChannel(data: ChannelData) {
  console.log('Creating channel:', data)
  emit('createChannel', data)
}
</script>

<style>
.sidebar {
  background-color: #355070 !important;
  border-right: 1px solid #283C55;
  box-shadow: none !important;
  display: flex;
  flex-direction: column;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 80px;
}

/* Custom scrollbar styling */
.sidebar-content::-webkit-scrollbar {
  width: 8px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.sidebar-title-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.add-channel-btn {
  min-width: 32px !important;
  min-height: 32px !important;
  padding: 4px !important;
  transition: background-color 0.2s ease;
}

.add-channel-btn:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.add-channel-btn .q-icon {
  font-size: 20px;
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
  position: fixed;
  bottom: 0;
  left: 0;
  width: 300px;
  padding: 0 20px 20px 20px;
  background: linear-gradient(to top, #355070 80%, transparent);
  padding-top: 20px;
  z-index: 1000;
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