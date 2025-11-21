<template>
  <!-- Tlačidlo s ikonou informácií -->
  <q-btn flat round dense icon="info" class="text-white info-btn">
    <!-- Tooltip po prejdení kurzorom -->
    <q-tooltip v-if="$q.screen.gt.sm" anchor="top middle" self="bottom middle">
      Commands
    </q-tooltip>

    <!-- Menu s príkazmi (otvorí sa po kliknutí, nezatvára sa automaticky) -->
    <q-menu 
      :auto-close="false" 
      anchor="bottom middle" 
      self="top middle" 
      transition-show="jump-down" 
      transition-hide="jump-up"
      @before-show="loadCommands"
    >      
      <div class="info-box-container" @click.stop>
         <!-- Loading state -->
        <div v-if="loading" class="text-center q-pa-md">
          <q-spinner color="white" size="sm" />
        </div>
        
        <!-- Error state -->
        <div v-else-if="error" class="error-message">
          Failed to load commands
        </div>
        
        <!-- Commands list -->
        <div v-else>
          <div 
            v-for="command in commands" 
            :key="command.id" 
            class="info-line"
          >
            {{ command.name }}
            
            <!-- Tooltip a description megjelenítésére -->
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

const $q = useQuasar()

interface Command {
  id: number
  name: string
  description: string
}

const commands = ref<Command[]>([])
const loading = ref(false)
const error = ref(false)

const loadCommands = async () => {
  // Ha már betöltöttük, ne töltsük újra
  if (commands.value.length > 0) return
  
  loading.value = true
  error.value = false
  
  try {
    // Használd a teljes backend URL-t
    const response = await fetch('http://localhost:3333/api/commands')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    console.log('Loaded commands:', data) // Debug log
    
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
/* Štýl tlačidla s ikonou */
.q-btn {
  background-color: transparent;
  width: 36px;
  height: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Štýl menu (transparentné pozadie) */
.q-menu {
  background: transparent;
  min-width: 220px;
}

/* Kontajner s príkazmi */
.info-box-container {
  background: #355070;
  color: white;
  padding: 10px;
}

/* Každý riadok s príkazom */
.info-line {
  padding: 4px 0;
  font-size: 0.95rem;
}

/* Infobox Header štýl (Commands title) */
.info-title {
  font-weight: bold;
  font-size: 1.05rem;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 6px;
  padding-bottom: 4px;
  text-align: center;
  letter-spacing: 0.5px;
}

</style>
