<template>
  <q-header
    elevated
    class="row items-center justify-between q-px-lg q-py-sm text-white"
    style="background-color: #283C55; height: 60px; z-index: 2000;"
  >
    <!-- Left side: Logo + Channel name -->
    <div class="row items-center q-gutter-sm">
      <!-- Mobile: hamburger -->
      <q-btn
        v-if="$q.screen.lt.md"
        dense
        flat
        round
        icon="menu"
        class="q-mr-sm"
        @click="$emit('update:drawerOpen', !drawerOpen)"
      />

      <img
        v-if="!$q.screen.lt.md"
        src="/pictures/logo.jpg"
        alt="Logo"
        class="rounded-borders"
        style="height: 40px;"
      />

      <div
        v-if="currentChannel"
        class="text-bold current-channel"
      >
        {{ currentChannel }}
      </div>
    </div>

    <!-- Right: status + settings + info -->
    <div class="row items-center" style="margin-left: auto;">
      <UserStatus class="q-mr-sm" />
      <SettingsMenu />
      <InfoBox class="q-ml-sm" />
    </div>
  </q-header>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import SettingsMenu from './SettingsMenu.vue'
import InfoBox from './InfoBox.vue'
import UserStatus from './UserStatus.vue'

defineProps<{
  drawerOpen: boolean
  currentChannel?: string
}>()

defineEmits<{
  'update:drawerOpen': [value: boolean]
}>()

const $q = useQuasar()
</script>

<style scoped>
.rounded-borders {
  border-radius: 8px;
}

.current-channel {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin-left: 4px;
}
</style>
