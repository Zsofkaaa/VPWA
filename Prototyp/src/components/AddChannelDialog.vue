<template>
  <q-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)">
    <q-card style="min-width: 400px; background-color: #2d4a6b; color: white;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Create New Channel</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <q-card-section>
        <!-- Channel Name -->
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
            :rules="[val => !!val || 'Channel name is required']"
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
            v-model="visibility"
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
              <q-icon :name="visibility === 'private' ? 'lock' : 'public'" color="white" />
            </template>
          </q-select>
        </div>

        <!-- Invite Members -->
        <div class="q-mb-md">
          <label class="text-weight-medium q-mb-xs block">Invite Members (Optional)</label>
          <q-select
            v-model="invitedMembers"
            :options="availableMembers"
            filled
            dense
            multiple
            use-chips
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

        <!-- Notification Settings -->
        <div class="q-mb-md">
          <label class="text-weight-medium q-mb-xs block">Notification Settings</label>
          <q-option-group
            v-model="notificationLevel"
            :options="notificationOptions"
            color="primary"
            dark
            inline
          />
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn
          flat
          label="Cancel"
          color="white"
          @click="closeDialog"
          class="cancel-btn"
        />
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
import { ref, watch } from 'vue'

defineProps<{
  visible: boolean
  existingChannels?: string[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'create': [data: ChannelData]
}>()

interface ChannelData {
  name: string
  visibility: 'private' | 'public'
  description: string
  invitedMembers: string[]
  notificationLevel: string
}

const channelName = ref('')
const visibility = ref<'private' | 'public'>('public')
const description = ref('')
const invitedMembers = ref<string[]>([])
const notificationLevel = ref('all')

const visibilityOptions = [
  { label: 'Public', value: 'public', icon: 'public' },
  { label: 'Private', value: 'private', icon: 'lock' }
]

const availableMembers = ref([
  'John Doe',
  'Jane Smith',
  'Bob Johnson',
  'Alice Williams',
  'Charlie Brown'
])

const notificationOptions = [
  { label: 'All Messages', value: 'all' },
  { label: 'Mentions Only', value: 'mentions' },
  { label: 'Muted', value: 'muted' }
]

function closeDialog() {
  emit('update:visible', false)
  resetForm()
}

function createChannel() {
  const channelData: ChannelData = {
    name: channelName.value,
    visibility: visibility.value,
    description: description.value,
    invitedMembers: invitedMembers.value,
    notificationLevel: notificationLevel.value
  }
  
  emit('create', channelData)
  closeDialog()
}

function resetForm() {
  channelName.value = ''
  visibility.value = 'public'
  description.value = ''
  invitedMembers.value = []
  notificationLevel.value = 'all'
}

// Reset form when dialog closes
watch(() => emit, () => {
  resetForm()
})
</script>

<style scoped>
.block {
  display: block;
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
</style>