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
    <q-list dense>
      <q-item
        clickable
        v-for="ch in privateChannels"
        :key="ch.name"
        @click="$emit('goToChannel', ch)"
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
        @click="$emit('goToChannel', ch)"
        class="sidebar-item"
      >
        <q-item-section>{{ ch.name }}</q-item-section>
      </q-item>
    </q-list>

    <!-- 🔻 Logout button (bal alsó sarokban) -->
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
interface Channel {
  name: string
  path: string
}

defineProps<{
  drawerOpen: boolean
  privateChannels: Channel[]
  publicChannels: Channel[]
}>()

defineEmits<{
  'update:drawerOpen': [value: boolean]
  'goToChannel': [channel: Channel]
  'logout': []
}>()
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

.sidebar-item {
  color: #FFFFFF;
}

.sidebar-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar-divider {
  height: 1px;
  background-color: rgba(255,255,255,0.3);
  margin: 8px 8px 8px 8px;
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
  left: 20px;
}

.logout-btn {
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
