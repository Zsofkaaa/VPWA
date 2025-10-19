<template>
  <!-- Header with original blue color -->
  <q-header
    elevated
    class="row items-center justify-between q-px-lg q-py-sm text-white"
    style="background-color: #283C55; height: 60px; z-index: 2000;"
  >
    <!-- Left: Logo -->
    <div class="q-mr-md">
      <img src="/pictures/logo.jpg" alt="Logo" class="rounded-borders" style="height: 40px;" />
    </div>

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

    <!-- Right side: UserStatus + Settings + InfoBox -->
    <div class="row items-center" style="margin-left: auto;">
      <UserStatus class="q-mr-sm" /> <!-- status vľavo od nastavení -->
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
</style>
