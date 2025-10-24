<template>
  <q-header
    elevated
    class="row items-center justify-between q-px-lg q-py-sm text-white"
    style="background-color: #283C55; height: 60px; z-index: 2000;"
  >
    <!-- Left: Logo or hamburger + Channel Name -->
    <div class="row items-center no-wrap" style="flex: 1; min-width: 0;">
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

      <!-- Channel name on mobile (left side, next to hamburger) -->
      <div
        v-if="currentChannel && $q.screen.lt.md"
        class="text-bold current-channel"
      >
        {{ currentChannel }}
      </div>
    </div>

    <!-- Center: Current Channel (desktop only) -->
    <div
      v-if="currentChannel && !$q.screen.lt.md"
      class="text-bold current-channel centered"
    >
      {{ currentChannel }}
    </div>

    <!-- Right: Members Button + Status + Settings + Info -->
    <div class="row items-center justify-end q-gutter-sm no-wrap" style="flex: 0 0 auto;">
      <MembersMenu v-if="currentChannel" :current-channel="currentChannel" />
      <UserStatus />
      <SettingsMenu />
      <InfoBox />
    </div>
  </q-header>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import SettingsMenu from './SettingsMenu.vue'
import InfoBox from './InfoBox.vue'
import UserStatus from './UserStatus.vue'
import MembersMenu from './MembersMenu.vue'

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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Középre nagy képernyőn */
.centered {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

/* no-wrap class to prevent wrapping */
.no-wrap {
  flex-wrap: nowrap !important;
}
</style>