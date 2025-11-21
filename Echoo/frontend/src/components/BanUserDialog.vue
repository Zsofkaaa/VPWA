<template>
  <q-dialog
    v-model="internalVisible"
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="bg-dark text-white" style="width: 420px; max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Ban User</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <q-card-section>
        <label class="text-weight-medium q-mb-xs block">Select User</label>

        <q-select
          v-model="selectedUser"
          :options="memberOptions"
          filled
          dense
          emit-value
          map-options
          bg-color="rgba(255,255,255,0.1)"
          color="white"
          dark
          placeholder="Select a user to ban..."
        />
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat color="white" label="Cancel" @click="closeDialog" />
        <q-btn
          color="negative"
          label="Ban"
          :disable="!selectedUser"
          @click="confirmBan"
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
  "confirm": [number]
}>()

const internalVisible = ref(props.visible)
const selectedUser = ref<number | null>(null)
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
  selectedUser.value = null
  emit("update:visible", false)
}

function confirmBan() {
  if (selectedUser.value) {
    emit("confirm", selectedUser.value)
    closeDialog()
  }
}
</script>

<style scoped>
.q-card {
  border-radius: 12px;
}
</style>
