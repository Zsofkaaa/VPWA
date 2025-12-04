<template>
  <q-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)" persistent>
    <q-card class="notification-card">
      <q-card-section class="text-h6">
        Notification Settings
      </q-card-section>

      <q-card-section>
        <div class="text-subtitle2 q-mb-md">
          Choose when you want to receive notifications for this channel:
        </div>

        <q-option-group
          v-model="selectedOption"
          :options="notificationOptions"
          color="white"
          dark
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="white" @click="closeDialog" />
        <q-btn flat label="Save" color="white" @click="saveSettings" :loading="isSaving" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>



<script lang="ts" setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import { useQuasar } from 'quasar'

// Props pre komponent
const props = defineProps<{
  visible: boolean
  channelId: number
  currentSetting: string
}>()

// Emit udalostí
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'save': [setting: string]
}>()

const $q = useQuasar()
const isSaving = ref(false)

// Dostupné možnosti notifikácií
const notificationOptions = [
  { label: 'All messages', value: 'all', description: 'Get notified for every message' },
  { label: 'Only mentions', value: 'mentions', description: 'Only when someone @mentions you' },
  { label: 'Nothing', value: 'none', description: 'No notifications from this channel' }
]

// Reaktívna premenna pre vybranú možnosť
const selectedOption = ref(props.currentSetting)

// Aktualizuj selectedOption, keď sa zmení currentSetting z vonku
watch(() => props.currentSetting, (newVal) => { selectedOption.value = newVal })

// Zatvorenie dialógu
function closeDialog() { emit('update:visible', false) }

// Uloženie nastavení notifikácií
async function saveSettings() {
  isSaving.value = true
  try {
    // Načítanie userId a tokenu
    const userStr = localStorage.getItem('user')
    if (!userStr) throw new Error('User not found in localStorage')
    const user = JSON.parse(userStr)
    const userId = user.id

    const token = localStorage.getItem('auth_token')
    if (!token) throw new Error('No auth token found')

    // PUT request na backend
    const url = `http://localhost:3333/user_channel/${userId}/${props.channelId}`
    await axios.put<{ message: string; notificationSettings: string }>(
      url,
      { notificationSettings: selectedOption.value },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    $q.notify({ type: 'positive', message: `Notifications set to "${selectedOption.value}"`, position: 'top', timeout: 2000 })
    emit('save', selectedOption.value)
    emit('update:visible', false)

  } catch (err: unknown) {
    let errorMessage = 'Failed to save notification settings'
    if (err instanceof Error) errorMessage = err.message
    $q.notify({ type: 'negative', message: errorMessage, position: 'top', timeout: 3000 })
    console.error('[NOTIFICATION SETTINGS] Error saving:', err)
  } finally {
    isSaving.value = false
  }
}
</script>



<style scoped>
.notification-card {
  width: 100%;
  max-width: 400px;
  background-color: #355070;
  color: white;
  border-radius: 12px;
  padding: 0;
}

.q-option-group { padding: 8px 0; }

@media (max-width: 400px) {
  .notification-card { max-width: 90vw; margin: 0 5vw; }
}
</style>
