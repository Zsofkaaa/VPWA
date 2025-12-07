<template>
  <!-- Tlačidlo informácií -->
  <q-btn flat round dense icon="info" class="text-white info-btn">

    <!-- Tooltip pre desktop -->
    <q-tooltip v-if="$q.screen.gt.sm" anchor="top middle" self="bottom middle">
      Commands
    </q-tooltip>

    <!-- Menu s príkazmi -->
    <q-menu
      :auto-close="false"
      anchor="bottom middle"
      self="top middle"
      transition-show="jump-down"
      transition-hide="jump-up"
      @before-show="loadCommands"
    >
      <div class="info-box-container" @click.stop>

        <!-- Načítavajúce sa dáta -->
        <div v-if="loading" class="text-center q-pa-md">
          <q-spinner color="white" size="sm" />
        </div>

        <!-- Chyba načítania -->
        <div v-else-if="error" class="error-message">
          Failed to load commands
        </div>

        <!-- Zoznam príkazov -->
        <div v-else>
          <div
            v-for="command in commands"
            :key="command.id"
            class="info-line"
          >
            {{ command.name }}

            <!-- Tooltip s popisom -->
            <q-tooltip
              anchor="center right"
              self="center left"
              :offset="[10, 0]"
              max-width="300px"
            >
              {{ command.description }}
            </q-tooltip>
          </div>
        </div>

      </div>
    </q-menu>
  </q-btn>
</template>



<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { ref } from 'vue'
import type { Command } from '@/types'
// import API_URL from '@/config/api'

// Quasar objekt pre UI
const $q = useQuasar()

// Reaktívne stavy
const commands = ref<Command[]>([])
const loading = ref(false)
const error = ref(false)

// Funkcia načíta príkazy zo servera
const loadCommands = async () => {
  // Ak sú už príkazy načítané, nenačítavaj znova
  if (commands.value.length > 0) return

  loading.value = true
  error.value = false

  try {
    const response = await fetch('${API_URL}/api/commands')

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`)

    const data = await response.json()

    if (data.success) {
      commands.value = data.data
    } else {
      error.value = true
    }
  } catch (err) {
    console.error('Failed to load commands:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}
</script>



<style scoped>
/* Štýl info tlačidla */
.q-btn {
  background-color: transparent;
  width: 36px;
  height: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Transparentné pozadie menu */
.q-menu {
  background: transparent;
  min-width: 220px;
}

/* Kontajner príkazov */
.info-box-container {
  background: #355070;
  color: white;
  padding: 10px;
  border-radius: 6px;
}

/* Jeden riadok príkazu */
.info-line {
  padding: 4px 0;
  font-size: 0.95rem;
}
</style>
