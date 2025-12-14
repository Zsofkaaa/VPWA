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

// Vstupné vlastnosti od rodiča (viditeľnosť, kanál, aktuálni a dostupní používatelia)
const props = defineProps<{
  visible: boolean
  channelId: number
  currentMembers: number[]
  availableUsers: { label: string; value: number }[]
}>()

// Udalosti, ktoré komponent posiela späť rodičovi
const emit = defineEmits<{
  'update:visible': [boolean]
  'add-users': [number[]]
}>()

// Interný stav viditeľnosti (pre plynulý 2-way binding a animácie)
const internalVisible = ref(props.visible)

// Aktuálne vybraní používatelia, ktorí sa majú pridať
const selectedUsers = ref<number[]>([])

// Zavrie dialóg a vymaže výber
function closeDialog() {
  internalVisible.value = false
  selectedUsers.value = []
}

// Pošle rodičovi zoznam vybraných používateľov a zavrie dialóg
function addUsers() {
  emit("add-users", selectedUsers.value)
  closeDialog()
}

// Keď sa zmení viditeľnosť z rodiča, zaktualizuj lokálny stav
watch(() => props.visible, (val) => {
  internalVisible.value = val
})

// Keď sa zmení lokálna viditeľnosť, oznám to rodičovi
watch(internalVisible, (val) => {
  emit("update:visible", val)
})
</script>



<style scoped>
/* Spodná časť dialógu s oddeleným pozadím */
.sticky-footer {
  background-color: #2d4a6b;
  border-top: 1px solid rgba(255,255,255,0.1);
}
</style>
