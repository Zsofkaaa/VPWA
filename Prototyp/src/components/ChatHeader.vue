<!-- 
  ============================================================================
  COMPONENT: ChatHeader.vue
  ============================================================================
  
  PURPOSE:
  This is the top navigation bar of the chat application.
  
  WHAT IT DISPLAYS:
  - Desktop: Logo on left, channel name in center, buttons (members, status, settings, info) on right
  - Mobile: Hamburger menu + channel name on left, buttons (members, status, settings, info) on right
  
  HOW IT WORKS:
  - Receives data from parent: which channel is active, if drawer is open
  - Sends signals to parent: when user clicks hamburger menu
  - Uses Quasar's responsive system to change layout based on screen size
  
  ============================================================================
-->
  
<template>
  <!--
  q-px-lg = large horizontal padding (left & right)
  q-py-sm = small vertical padding (top & bottom)
  -->
  <q-header elevated class="row items-center justify-between q-px-lg q-py-sm text-white">
    
    <!-- Left: Logo or hamburger + Channel Name -->
    <div class="row items-center no-wrap" style="flex: 1; min-width: 0;">
      <!--     
      no-wrap = prevents flex items from wrapping to the next line. All child elements stay in one horizontal row.
      flex: 1 = tells the element to expand and take up all available horizontal space within the flex container.
      min-width: 0 = allows the element to shrink below its content size. Needed in flex layouts to prevent overflow issues.
      v-if="$q.screen.lt.md" = show only on small screens
      -->
      <q-btn
        v-if="$q.screen.lt.md"
        dense flat round icon="menu" class="q-mr-sm"
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

    <!-- Right: Members Button + Status + Settings + Info 
     
    q-gutter-sm = adds small spacing between each child element
    flex: 0 0 auto = element does not grow or shrink; keeps its natural size
    -->
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

.q-header {
  background-color: #283C55; 
  height: 60px; 
  z-index: 2000; /* z-index = controls the stacking order of elements. Higher values appear on top of lower ones. */
}

.rounded-borders {
  border-radius: 8px;
}

.current-channel {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  white-space: nowrap; /* prevents text from wrapping to a new line */
  overflow: hidden; /* hides text that goes beyond the element's width */
  text-overflow: ellipsis; /* adds "..." at the end of the truncated text */
}

.centered {
  position: absolute; /* takes the element out of normal flow and positions it absolutely */
  left: 50%; /* moves the element’s left edge to the horizontal center of its parent */
  transform: translateX(-50%); /* shifts it left by half of its own width to truly center it */
}

.no-wrap {
  flex-wrap: nowrap !important;
}
</style>