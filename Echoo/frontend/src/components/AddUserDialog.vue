<template>
  <!-- Dialóg pre pridávanie používateľov do kanála -->
  <q-dialog
    v-model="internalVisible"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="bg-dark text-white" style="width: 500px; max-width: 90vw;">
      
      <!-- Hlavička dialogu -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Users</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <!-- Select na výber používateľov -->
      <q-card-section class="q-pa-md">
        <label class="text-weight-medium q-mb-xs block">Select Users to Add</label>

        <q-select
          v-model="selectedUsers"
          :options="props.availableUsers"
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
          <!-- Ikona pred selectom -->
          <template #prepend>
            <q-icon name="person_add" color="white" />
          </template>
        </q-select>
      </q-card-section>

      <!-- Akcie dialogu -->
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

// Props prijaté od rodiča
const props = defineProps<{
  visible: boolean
  channelId: number
  currentMembers: number[]
  availableUsers: { label: string; value: number }[]
}>()

// Emit eventy
const emit = defineEmits<{
  'update:visible': [boolean]
  'add-users': [number[]]
}>()

// Lokálny stav dialogu (kvôli smooth animáciám a 2-way bindingu)
const internalVisible = ref(props.visible)

// Zoznam vybraných používateľov
const selectedUsers = ref<number[]>([])

// Zavrie dialog a vyresetuje výber
function closeDialog() {
  internalVisible.value = false
  selectedUsers.value = []
}

// Emitne zoznam vybraných používateľov parentovi
function addUsers() {
  emit("add-users", selectedUsers.value)
  closeDialog()
}

// Sleduje, keď rodič zmení visible - premietne sa do interného stavu
watch(() => props.visible, (val) => {
  internalVisible.value = val
})

// Keď sa dialog zavrie - dáme vedieť parentovi
watch(internalVisible, (val) => {
  emit("update:visible", val)
})
</script>



<style scoped>
/* Štýl pre spodnú časť dialogu (fixné pozadie) */
.sticky-footer {
  background-color: #2d4a6b;
  border-top: 1px solid rgba(255,255,255,0.1);
}
</style>
