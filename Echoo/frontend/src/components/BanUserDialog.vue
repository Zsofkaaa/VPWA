<template>

  <!-- Dialógové okno pre banovanie používateľa -->
  <q-dialog
    v-model="internalVisible"
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
  >

    <!-- Hlavná karta dialogu -->
    <q-card class="bg-dark text-white" style="width: 420px; max-width: 90vw;">

      <!-- Hlavička dialogu (titulok + tlačidlo zatvorenia) -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Ban User</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <!-- Sekcia s výberom používateľa -->
      <q-card-section>
        <!-- Label pre select -->
        <label class="text-weight-medium q-mb-xs block">Select User</label>

        <!-- Select zoznam členov, ktorého hodnotou je user ID -->
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

      <!-- Akcie (spodné tlačidlá) -->
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
import type { User } from '@/types';

// Props z rodiča
const props = defineProps<{
  visible: boolean
  members: User[]
}>()

// Eventy pre rodiča
const emit = defineEmits<{
  "update:visible": [boolean]
  "ban-users": [number[]]
}>()

// Lokálny stav dialogu
const internalVisible = ref(props.visible)

// ID vybraného používateľa
const selectedUser = ref<number | null>(null)

// Zoznam možností do selectu
const memberOptions = ref<{ label: string; value: number }[]>([])

// Sleduje otvorenie dialogu → načíta členov
watch(() => props.visible, (v) => {
  internalVisible.value = v
  if (v) {
    memberOptions.value = props.members.map(m => ({
      label: m.nickName,
      value: m.id
    }))
  }
})

// Ak sa zoznam členov zmení, aktualizujeme možnosti
watch(() => props.members, () => {
  memberOptions.value = props.members.map(m => ({
    label: m.nickName,
    value: m.id
  }))
})

// Sync lokálnej a rodičovskej viditeľnosti
watch(internalVisible, (v) => emit("update:visible", v))

// Zatvorenie dialogu
function closeDialog() {
  selectedUser.value = null
  emit("update:visible", false)
}

// Potvrdenie banu
function confirmBan() {
  if (selectedUser.value) {
    // Pošleme zoznam ID používateľov na ban
    emit("ban-users", [selectedUser.value])
    closeDialog()
  }
}
</script>



<style scoped>
.q-card {
  border-radius: 12px;
}
</style>
