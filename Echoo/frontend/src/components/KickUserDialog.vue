<template>
  <q-dialog
    v-model="internalVisible"
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="bg-dark text-white" style="width: 420px; max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Kick User</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <q-card-section>
        <label class="text-weight-medium q-mb-xs block">Select User</label>

        <q-select
          v-model="selectedUsers"
          :options="memberOptions"
          filled
          dense
          emit-value
          map-options
          bg-color="rgba(255,255,255,0.1)"
          color="white"
          dark
          multiple
          placeholder="Select a user to kick..."
        />
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat color="white" label="Cancel" @click="closeDialog" />
        <q-btn
          color="negative"
          label="Kick"
          :disable="!selectedUsers"
          @click="confirmKick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

interface User {
  id: number
  nickName: string
}

const props = defineProps<{
  visible: boolean
  members: User[]
}>()

const emit = defineEmits<{
  "update:visible": [boolean]
  "kick-users": [number[]] // 👈 itt kell tömb
}>()

const internalVisible = ref(props.visible)
const selectedUsers = ref<number[]>([])
const memberOptions = ref<{ label: string; value: number }[]>([])

watch(() => props.visible, (v) => {
  internalVisible.value = v
  if (v) {
    memberOptions.value = props.members.map(m => ({
      label: m.nickName,
      value: m.id
    }))
  }
})

watch(internalVisible, (v) => emit("update:visible", v))

function closeDialog() {
  selectedUsers.value = []
  emit("update:visible", false)
}

function confirmKick() {
  if (selectedUsers.value.length > 0) {
    emit("kick-users", selectedUsers.value) // most már tömböt ad vissza
    closeDialog()
  }
}
</script>

<style scoped>
.q-card {
  border-radius: 12px;
}
</style>
