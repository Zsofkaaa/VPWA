<template>
  <div class="user-status">
    <!-- Tlačidlo zobrazujúce aktuálny status používateľa -->
    <q-btn
      flat
      round
      dense
      icon="person"
      :color="statusColor"
      :disable="loading"
      @click="cycleStatus"
    >
      <!-- Tooltip (zobrazí sa pri prechode myšou) -->
      <q-tooltip v-if="$q.screen.gt.sm" anchor="top middle" self="bottom middle">
        {{ currentStatus.toUpperCase() }}
      </q-tooltip>
    </q-btn>
  </div>
</template>



<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'
import type { UserStatus } from '@/types'

const $q = useQuasar()

// Typ statusu - definuje tri možné hodnoty
type Status = UserStatus

// Props: aktuálny status z parenta (ak príde)
const props = defineProps<{ status?: Status }>()

// Emits: informácia o zmene statusu pre parent komponent
const emit = defineEmits<{ 'status-changed': [Status] }>()

// Aktuálny status používateľa (reaktívna hodnota)
const currentStatus = ref<Status>(props.status ?? 'online')
const loading = ref(false)

// Synchronizácia pri zmene vstupného statusu
watch(
  () => props.status,
  (val) => {
    if (val) currentStatus.value = val
  }
)

function persistStatusLocally(status: Status) {
  const savedUser = localStorage.getItem('user')
  if (!savedUser) return

  try {
    const parsed = JSON.parse(savedUser)
    parsed.status = status
    localStorage.setItem('user', JSON.stringify(parsed))
  } catch (err) {
    console.warn('Failed to persist status locally', err)
  }
}

// Farba ikonky podľa statusu
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

async function updateStatus(nextStatus: Status) {
  if (loading.value || nextStatus === currentStatus.value) return

  loading.value = true
  try {
    await api.put('/user/status', { status: nextStatus })
    currentStatus.value = nextStatus
    persistStatusLocally(nextStatus)
    emit('status-changed', nextStatus)
  } catch (err) {
    console.error('Failed to update status', err)
    $q.notify({ type: 'negative', message: 'Nepodarilo sa zmeniť status' })
  } finally {
    loading.value = false
  }
}

// Po kliknutí na ikonu sa cyklicky mení status: online → dnd → offline → online
async function cycleStatus() {
  const nextStatus:
    | 'online'
    | 'dnd'
    | 'offline' =
    currentStatus.value === 'online'
      ? 'dnd'
      : currentStatus.value === 'dnd'
        ? 'offline'
        : 'online'

  await updateStatus(nextStatus)
}
</script>



<style scoped>
/* Vycentruje ikonu do stredu kontajnera */
.user-status {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
