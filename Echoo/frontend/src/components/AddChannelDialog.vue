<template>
  <!-- Dialog pre vytvorenie nového kanála -->
  <q-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="dialog-card">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none header-section">
        <div class="text-h6">Create New Channel</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <!-- Form section -->
      <q-card-section class="form-section">
        <!-- Channel name -->
        <div class="q-mb-md">
          <label class="text-weight-medium q-mb-xs block">Channel Name</label>
          <q-input
            v-model="channelName"
            filled
            dense
            placeholder="Enter channel name"
            bg-color="rgba(255, 255, 255, 0.1)"
            color="white"
            dark
            :rules="[(val: string) => !!val || 'Channel name is required']"
          >
            <template v-slot:prepend>
              <q-icon name="tag" color="white" />
            </template>
          </q-input>
        </div>

        <!-- Visibility -->
        <div class="q-mb-md">
          <label class="text-weight-medium q-mb-xs block">Visibility</label>
          <q-select
            v-model="type"
            :options="visibilityOptions"
            filled
            dense
            bg-color="rgba(255, 255, 255, 0.1)"
            color="white"
            dark
            emit-value
            map-options
          >
            <template v-slot:prepend>
              <q-icon :name="type === 'private' ? 'lock' : 'public'" color="white" />
            </template>
          </q-select>
        </div>

        <!-- Invite members -->
        <div class="q-mb-md">
          <label class="text-weight-medium q-mb-xs block">Invite Members (Optional)</label>
          <q-select
            v-model="invitedMembers"
            :options="availableMembers"
            filled
            dense
            multiple
            use-chips
            emit-value
            map-options
            bg-color="rgba(255, 255, 255, 0.1)"
            color="white"
            dark
            placeholder="Select members to invite"
          >
            <template v-slot:prepend>
              <q-icon name="people" color="white" />
            </template>
          </q-select>
        </div>

        <!-- Notification settings -->
        <div class="q-mb-md">
          <label class="text-weight-medium q-mb-xs block">Notification Settings</label>
          <q-option-group
            v-model="notificationSettings"
            :options="notificationOptions"
            color="primary"
            dark
            inline
          />
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right" class="q-px-md q-pb-md sticky-footer">
        <q-btn flat label="Cancel" color="white" @click="closeDialog" class="cancel-btn" />
        <q-btn
          unelevated
          label="Create Channel"
          color="primary"
          @click="createChannel"
          :disable="!channelName"
          class="create-btn"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>



<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import type { ChannelData, MeResponse, AppUser } from '@/types'

// Form state
const channelName = ref('')
const type = ref<'private' | 'public'>('public')
const invitedMembers = ref<number[]>([])
const notificationSettings = ref<'all' | 'mentions' | 'muted'>('all')
const availableMembers = ref<{ label: string, value: number }[]>([])
const currentUserId = ref<number | null>(null)

const API_URL = 'http://localhost:3333'
const token = localStorage.getItem('auth_token')

// Visibility options
const visibilityOptions = [
  { label: 'Public', value: 'public', icon: 'public' },
  { label: 'Private', value: 'private', icon: 'lock' }
]

// Notification options
const notificationOptions = [
  { label: 'All Messages', value: 'all' },
  { label: 'Mentions Only', value: 'mentions' },
  { label: 'Muted', value: 'muted' }
]

// Emits
const emit = defineEmits<{
  'update:visible': [boolean]
  'create': [ChannelData]
}>()

// Props
defineProps<{
  visible: boolean
  existingChannels?: string[]
}>()

// Close dialog and reset form
function closeDialog() {
  emit('update:visible', false)
  resetForm()
}

// Create channel
function createChannel() {
  emit('create', {
    name: channelName.value,
    type: type.value,
    invitedMembers: invitedMembers.value,
    notificationSettings: notificationSettings.value
  })
  closeDialog()
}

// Reset form
function resetForm() {
  channelName.value = ''
  type.value = 'public'
  invitedMembers.value = []
  notificationSettings.value = 'all'
}

// Load users on mount
onMounted(async () => {
  try {
    const me = await axios.get<MeResponse>(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    currentUserId.value = me.data.id

    const users = await axios.get<AppUser[]>(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    availableMembers.value = users.data
      .filter(u => u.id !== currentUserId.value)
      .map(u => ({ label: u.nickName, value: u.id }))
  } catch (error) {
    console.error('Failed to load users', error)
  }
})
</script>

<style>
.dialog-card {
  background-color: #2d4a6b;
  color: white;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header-section {
  flex: 0 0 auto;
}

.form-section {
  flex: 1 1 auto;
  overflow-y: auto;
}

.sticky-footer {
  background-color: #2d4a6b;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.cancel-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.create-btn {
  background-color: #4CAF50;
  color: white;
  border-radius: 6px;
  font-weight: bold;
}

.create-btn:hover {
  background-color: #45a049;
}

.create-btn:disabled {
  background-color: rgba(76, 175, 80, 0.5);
}

.q-field--dark .q-chip {
  background-color: #1e3b5c !important;
  color: #ffffff !important;
}

.block {
  display: block;
}

/* Invite chips silnejsi kontrast */
.q-field--dark .q-chip {
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.35) !important;
  font-weight: 600 !important;
}

.q-field--dark .q-chip .q-chip__icon {
  color: #fff !important;
}
</style>
