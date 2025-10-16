<template>
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
      @click="$emit('update:drawerOpen', !drawerOpen)"
    />

    <!-- COMMAND LINE -->
    <q-input
      :model-value="command"
      @update:model-value="$emit('update:command', $event)"
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
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'

defineProps<{
  command: string
  drawerOpen: boolean
}>()

defineEmits<{
  'update:command': [value: string | number | null]
  'update:drawerOpen': [value: boolean]
}>()


const $q = useQuasar()
</script>

<style scoped>
.header-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #283C55;
  box-shadow: none;
  border-bottom: 1px solid #000;
  padding: 0 16px;
}

.header-logo img {
  height: 40px;
  border-radius: 8px;
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

.menu-container .q-item {
  color: white;
}

.menu-container .q-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>