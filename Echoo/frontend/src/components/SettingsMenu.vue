<template>

  <!-- Tlačidlo s ikonou úprav profilu -->
  <q-btn flat dense round icon="manage_accounts" @click="showDialog = true">
    <!-- Tooltip (zobrazí sa pri prechode myšou) -->
    <q-tooltip v-if="$q.screen.gt.sm" anchor="top middle" self="bottom middle">
      Edit profile
    </q-tooltip>
  </q-btn>

  <!-- Dialógové okno pre úpravu profilu -->
  <q-dialog v-model="showDialog" maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card>
      <!-- Hlavička dialógu -->
      <q-card-section class="row items-center" style="flex: 0 0 auto;">
        <div class="text-h6">Edit Profile</div>
        <q-space /> <!-- Prázdne miesto medzi názvom a ikonou zatvorenia -->
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <!-- Obsah dialógu (formulár) -->
      <q-card-section class="scroll-area" style="flex: 1 1 auto; overflow-y: auto;">

        <!-- Meno -->
        <div class="q-mb-md">
          <label class="text-weight-medium q-mb-xs block">First Name</label>
          <q-input v-model="firstName" filled dense placeholder="Enter your first name" color="white" dark>
            <template v-slot:prepend>
              <q-icon name="person" color="white" />
            </template>
          </q-input>
        </div>

        <!-- Priezvisko -->
        <div class="q-mb-md">
          <label class="text-weight-medium q-mb-xs block">Last Name</label>
          <q-input v-model="lastName" filled dense placeholder="Enter your last name" color="white" dark>
            <template v-slot:prepend>
              <q-icon name="person" color="white" />
            </template>
          </q-input>
        </div>

        <!-- Prezývka -->
        <div class="q-mb-md">
          <label class="text-weight-medium q-mb-xs block">Nickname</label>
          <q-input v-model="nickname" filled dense placeholder="Enter your nickname" color="white" dark>
            <template v-slot:prepend>
              <q-icon name="badge" color="white" />
            </template>
          </q-input>
        </div>

        <!-- Email -->
        <div class="q-mb-md">
          <label class="text-weight-medium q-mb-xs block">Email</label>
          <q-input
            v-model="email"
            filled
            dense
            type="email"
            placeholder="Enter your email"
            color="white"
            dark
            :rules="[
              val => !!val || 'Email is required',
              val => /^[^\\s@]{3,}@[^\s@]{3,}\\.[^\\s@]{2,}$/.test(val) || 'Please enter a valid email'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="email" color="white" />
            </template>
          </q-input>
        </div>

        <!-- Heslo -->
        <div class="q-mb-md">
          <label class="text-weight-medium q-mb-xs block">Password</label>
          <q-input
            v-model="password"
            filled
            dense
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter new password (leave empty to keep current)"
            color="white"
            dark
          >
            <template v-slot:prepend>
              <q-icon name="lock" color="white" />
            </template>
            <template v-slot:append>
              <!-- Prepínanie zobrazenia hesla -->
              <q-icon
                :name="showPassword ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                color="white"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
        </div>

        <!-- Potvrdenie hesla (zobrazí sa len ak je heslo zadané) -->
        <div v-if="password" class="q-mb-md">
          <label class="text-weight-medium q-mb-xs block">Confirm Password</label>
          <q-input
            v-model="confirmPassword"
            filled
            dense
            :type="showPassword ? 'text' : 'password'"
            placeholder="Confirm your new password"
            color="white"
            dark
            :rules="[val => val === password || 'Passwords do not match']"
          >
            <template v-slot:prepend>
              <q-icon name="lock" color="white" />
            </template>
          </q-input>
        </div>
      </q-card-section>

      <!-- Spodná časť s tlačidlami -->
      <q-card-actions align="right" class="q-px-md q-pb-md sticky-footer" style="flex: 0 0 auto;">
        <q-btn flat label="Cancel" @click="closeDialog" class="cancel-btn" />
        <q-btn label="Save Changes" @click="saveSettings" :disable="!isFormValid" class="save-btn" />
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>



<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import axios from 'axios'
import type { UserData } from '@/types'

// Quasar notifikácie
const $q = useQuasar()

// API URL a token
const API_URL = 'http://localhost:3333'
const token = localStorage.getItem('auth_token')

// Stav dialógu a zobrazenia hesla
const showDialog = ref(false)
const showPassword = ref(false)

// Reaktívne polia formulára
const firstName = ref('')
const lastName = ref('')
const nickname = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

// Overenie platnosti formulára
const isFormValid = computed(() => {
  const emailValid = email.value.length > 3
  const passValid = !password.value || (password.value === confirmPassword.value && password.value.length >= 8)
  return emailValid && passValid
})

// Zatvorenie dialógu a reset hesiel
function closeDialog() {
  showDialog.value = false
  password.value = ''
  confirmPassword.value = ''
  showPassword.value = false
}

// Uloženie zmien profilu
async function saveSettings() {
  if (!isFormValid.value) return
  const payload: Partial<UserData> & { password?: string } = {
    firstName: firstName.value,
    lastName: lastName.value,
    nickName: nickname.value,
    email: email.value
  }
  if (password.value) payload.password = password.value

  try {
    await axios.put(`${API_URL}/user/update`, payload, { headers: { Authorization: `Bearer ${token}` } })
    $q.notify({ type: 'positive', message: 'Profile updated successfully!' })
    closeDialog()
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'Failed to save profile settings.' })
  }
}

// Načítanie údajov používateľa
async function loadUserData() {
  try {
    const res = await axios.get<UserData>(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
    const user = res.data
    firstName.value = user.firstName
    lastName.value = user.lastName
    nickname.value = user.nickName
    email.value = user.email
  } catch (err) {
    console.error('Failed to load user data', err)
  }
}

// Lifecycle hook
onMounted(() => { void loadUserData() })
</script>



<style scoped>

/* Štýl hlavnej karty (dialógu) */
.q-card {
  background-color: #355070;
  color: white;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Spodná lišta (pevne prilepená) */
.sticky-footer {
  background-color: #283C55;
}

/* Tlačidlo "Cancel" */
.cancel-btn {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.cancel-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Tlačidlo "Save Changes" */
.save-btn {
  background-color: #355070;
  color: white;
  border-radius: 6px;
  font-weight: bold;
}

.save-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Neaktívne tlačidlo (disabled) */
.save-btn:disabled {
  background-color: rgb(78, 143, 235);
}
</style>
