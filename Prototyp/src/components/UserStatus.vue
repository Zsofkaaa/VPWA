<template>
  <div class="user-status">
    <q-btn
      flat
      round
      dense
      :icon="statusIcon"
      :color="statusColor"
      @click="cycleStatus"
      :title="`Status: ${currentStatus.toUpperCase()}`"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'

type Status = 'online' | 'dnd' | 'offline'

const currentStatus = ref<Status>('online')
const statusColor = computed(() => {
  switch (currentStatus.value) {
    case 'online':
      return 'green'
    case 'dnd':
      return 'yellow'
    case 'offline':
      return 'red'
    default:
      return 'gray' // pre prípad, že currentStatus má neočakávanú hodnotu
  }
})


const statusIcon = computed(() => 'person')

/**
 * Optional: click cycles through statuses (for demo)
 */
function cycleStatus() {
  if (currentStatus.value === 'online') currentStatus.value = 'dnd'
  else if (currentStatus.value === 'dnd') currentStatus.value = 'offline'
  else currentStatus.value = 'online'
}
</script>

<style scoped>
.user-status {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
