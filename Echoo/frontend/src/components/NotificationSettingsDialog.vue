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

const props = defineProps<{
  visible: boolean
  channelId: number
  currentSetting: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'save': [setting: string]
}>()

const $q = useQuasar()
const isSaving = ref(false)

const notificationOptions = [
  { label: 'All messages', value: 'all', description: 'Get notified for every message' },
  { label: 'Only mentions', value: 'mentions', description: 'Only when someone @mentions you' },
  { label: 'Nothing', value: 'none', description: 'No notifications from this channel' }
]

const selectedOption = ref(props.currentSetting)

// Aktualizuj selectedOption, keď sa zmení currentSetting zvonku
watch(() => props.currentSetting, (newVal) => {
  selectedOption.value = newVal
})

function closeDialog() {
  emit('update:visible', false)
}

async function saveSettings() {
  console.log('[NOTIFICATION SETTINGS] Saving:', {
    channelId: props.channelId,
    newSetting: selectedOption.value,
    oldSetting: props.currentSetting
  })

  isSaving.value = true

  try {
    // Načítaj userId z localStorage
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      throw new Error('User not found in localStorage')
    }
    
    const user = JSON.parse(userStr)
    const userId = user.id
    
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('No auth token found')
    }

    const url = `http://localhost:3333/user_channel/${userId}/${props.channelId}`
    console.log('[NOTIFICATION SETTINGS] Sending PUT to:', url, {
      userId,
      channelId: props.channelId,
      setting: selectedOption.value
    })

    const response = await axios.put<{ message: string; notificationSettings: string }>(
      url,
      { notificationSettings: selectedOption.value },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    console.log('[NOTIFICATION SETTINGS] Backend response:', response.data)

    $q.notify({
      type: 'positive',
      message: `Notifications set to "${selectedOption.value}"`,
      position: 'top',
      timeout: 2000
    })

    emit('save', selectedOption.value)
    emit('update:visible', false)

  } catch (err: unknown) {
    console.error('[NOTIFICATION SETTINGS] Error saving:', err)
    
    let errorMessage = 'Failed to save notification settings'
    
    if (typeof err === 'object' && err !== null && 'response' in err && 'message' in err) {
      const axiosErr = err as { response?: { status: number; data?: Record<string, string> }; message?: string }
      const status = axiosErr.response?.status
      const data = axiosErr.response?.data
      errorMessage = `Failed (${status}): ${data?.error || data?.message || axiosErr.message}`
    } else if (err instanceof Error) {
      errorMessage = err.message
    }

    console.error('[NOTIFICATION SETTINGS] Full error:', errorMessage)

    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
      timeout: 3000
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.q-option-group {
  padding: 8px 0;
}

.notification-card {
  width: 100%;
  max-width: 400px;        /* Desktop */
  background-color: #355070;
  color: white;

  border-radius: 12px;
}

/* Extra fix – ha nagyon kicsi mobilon is jól nézzen ki */
@media (max-width: 400px) {
  .notification-card {
    max-width: 90vw;       /* 90% of the screen */
    margin: 0 5vw;         /* középre igazítja */
  }
}

</style>