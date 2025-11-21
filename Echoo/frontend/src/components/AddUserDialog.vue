<template>
  <q-dialog
    v-model="internalVisible"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="bg-dark text-white" style="width: 500px; max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Users</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <q-card-section class="q-pa-md">
        <label class="text-weight-medium q-mb-xs block">Select Users to Add</label>

        <q-select
          v-model="selectedUsers"
          :options="availableUsers"
          filled
          dense
          multiple
          use-chips
          emit-value
          map-options
          bg-color="rgba(255, 255, 255, 0.1)"
          dark
          color="white"
          placeholder="Search users..."
        >
          <template #prepend>
            <q-icon name="person_add" color="white" />
          </template>
        </q-select>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md sticky-footer">
        <q-btn flat label="Cancel" color="white" @click="closeDialog" />
        <q-btn
          unelevated
          label="Add Users"
          color="primary"
          :disable="selectedUsers.length === 0"
          @click="addUsers"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import axios from 'axios'

interface User {
  id: number
  nickName: string
}

const props = defineProps<{
  visible: boolean
  channelId: number
  currentMembers: number[]
}>()

const emit = defineEmits<{
  'update:visible': [boolean]
  'add-users': [number[]]
}>()

// Ez irányítja a dialog teljes életciklusát
const internalVisible = ref(props.visible)

const selectedUsers = ref<number[]>([])
const availableUsers = ref<{ label: string; value: number }[]>([])

const API_URL = "http://localhost:3333"
const token = localStorage.getItem("auth_token")

function closeDialog() {
  internalVisible.value = false
  selectedUsers.value = []
}

async function loadAvailableUsers() {
  try {
    const res = await axios.get<User[]>(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    availableUsers.value = res.data
      .filter(u => !props.currentMembers.includes(u.id))
      .map(u => ({ label: u.nickName, value: u.id }))

  } catch (err) {
    console.error("Failed to load users", err)
  }
}

function addUsers() {
  emit("add-users", selectedUsers.value)
  closeDialog()
}

/* -----------------------------------------
   WATCHERS – tökéletes szinkron megoldás
------------------------------------------*/

// Ha a parent kinyitja → internalVisible is kövesse
watch(() => props.visible, (val) => {
  internalVisible.value = val
  if (val) void loadAvailableUsers()
})

// Ha a dialog bezáródik → jelezzük vissza parentnek
watch(internalVisible, (val) => {
  emit("update:visible", val)
})
</script>

<style scoped>
.sticky-footer {
  background-color: #2d4a6b;
  border-top: 1px solid rgba(255,255,255,0.1);
}
</style>
