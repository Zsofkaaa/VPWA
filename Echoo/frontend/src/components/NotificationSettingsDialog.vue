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
// Importy: reaktivita, sledovanie zmien, HTTP klient, UI notifikácie a URL API
import { ref, watch } from 'vue'
import axios from 'axios'
import { useQuasar } from 'quasar'
import API_URL from '../config/api'

// Vstupné vlastnosti z rodiča (viditeľnosť, kanál, aktuálne nastavenie)
const props = defineProps<{
  visible: boolean
  channelId: number
  currentSetting: string
}>()

// Udalosti, ktoré komponent posiela späť rodičovi
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'save': [setting: string]
}>()

const $q = useQuasar()
// Flag indikujúci, že prebieha ukladanie
const isSaving = ref(false)

// Preddefinované možnosti notifikácií pre kanál
const notificationOptions = [
  { label: 'All messages', value: 'all', description: 'Get notified for every message' },
  { label: 'Only mentions', value: 'mentions', description: 'Only when someone @mentions you' },
  { label: 'Nothing', value: 'none', description: 'No notifications from this channel' }
]

// Aktuálne zvolená možnosť (synchronizovaná s props.currentSetting)
const selectedOption = ref(props.currentSetting)

// Keď rodič zmení currentSetting, premietni to do lokálneho stavu
watch(() => props.currentSetting, (newVal) => { selectedOption.value = newVal })

// Zavrie dialóg (emitne zmenu viditeľnosti)
function closeDialog() { emit('update:visible', false) }

// Uloží vybrané nastavenie na backend a oznámi výsledok
async function saveSettings() {
  isSaving.value = true
  try {
    // Získaj userId a token z localStorage
    const userStr = localStorage.getItem('user')
    if (!userStr) throw new Error('User not found in localStorage')
    const user = JSON.parse(userStr)
    const userId = user.id

    const token = localStorage.getItem('auth_token')
    if (!token) throw new Error('No auth token found')

    // Pošli PUT požiadavku s novým nastavením
    const url = `${API_URL}/user_channel/${userId}/${props.channelId}`
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
/* Karta dialógu s nastaveniami notifikácií */
.notification-card {
  width: 100%;
  max-width: 400px;
  background-color: #355070;
  color: white;
  border-radius: 12px;
  padding: 0;
}

/* Vnútorné odsadenie skupiny možností */
.q-option-group { padding: 8px 0; }

/* Responzívne zmenšenie šírky na malých zariadeniach */
@media (max-width: 400px) {
  .notification-card { max-width: 90vw; margin: 0 5vw; }
}
</style>
