<template>
  <q-header
    elevated
    class="row items-center justify-between q-px-lg q-py-sm text-white"
    style="background-color: #283C55; height: 60px; z-index: 2000;"
  >
    <!-- Left: Logo or hamburger -->
    <div class="row items-center" style="width: 200px;">
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
    </div>

    <!-- Center: Current Channel (clickable) -->
    <div
      v-if="currentChannel"
      class="text-bold current-channel cursor-pointer centered"
      @click="showMembers = true"
    >
      {{ currentChannel }}
    </div>

    <!-- Right: Status + Settings + Info -->
    <div class="row items-center justify-end" style="width: 200px;">
      <UserStatus class="q-mr-sm" />
      <SettingsMenu />
      <InfoBox class="q-ml-sm" />
    </div>

    <!-- Members Popup -->
    <q-dialog v-model="showMembers" persistent>
      <q-card
        style="width: 320px; max-height: 420px; background-color: #355070; color: white;"
      >
        <q-card-section class="text-h6 text-center q-pt-md">
          Members of {{ currentChannel }}
        </q-card-section>

        <q-separator color="white" />

        <!-- Scrollable list only -->
        <div style="max-height: 300px; overflow-y: auto;">
          <q-list bordered>
            <q-item v-for="member in members" :key="member" clickable>
              <q-item-section>{{ member }}</q-item-section>
            </q-item>
          </q-list>
        </div>

        <q-separator color="white" />

        <q-card-actions align="center" class="q-pb-sm">
          <q-btn flat label="Close" color="white" @click="showMembers = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-header>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
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
const showMembers = ref(false)

// 20 príkladových členov
const members = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Edward',
  'Fiona', 'George', 'Hannah', 'Ian', 'Julia',
  'Kevin', 'Laura', 'Michael', 'Nina', 'Oscar',
  'Paula', 'Quentin', 'Rachel', 'Steve', 'Tina'
]
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
  transition: opacity 0.2s;
}

.current-channel:hover {
  opacity: 0.8;
}

.centered {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}
</style>
