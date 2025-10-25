<template>
  <!-- Gear icon button -->
  <q-btn flat dense round icon="settings" @click="showDialog = true">
    <!-- Tooltip when hovering -->
    <q-tooltip anchor="top middle" self="bottom middle">
      Edit profile
    </q-tooltip>
  </q-btn>

  <!-- Settings Dialog -->
  <q-dialog v-model="showDialog" maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card>
      <q-card-section class="row items-center" style="flex: 0 0 auto;">
        <div class="text-h6">Edit Profile</div>
        <q-space /> <!-- white space betwenn title and close icon -->
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <q-card-section class="scroll-area" style="flex: 1 1 auto; overflow-y: auto;">
        <!-- First Name -->
        <div class="q-mb-md"> <!-- q-mb-md = adds a medium bottom margin to the element -->
          <label class="text-weight-medium q-mb-xs block">First Name</label>
          <q-input v-model="firstName" filled dense placeholder="Enter your first name" color="white" dark> <!--         - v-model="firstName" binds the input to the firstName variable -->
            <template v-slot:prepend> <!-- v-slot:prepend = defines content to be inserted at the "prepend" slot of a Quasar input or component -->
              <q-icon name="person" color="white" />
            </template>
          </q-input>
        </div>

        <!-- Last Name -->
        <div class="q-mb-md">
          <label class="text-weight-medium q-mb-xs block">Last Name</label>
          <q-input v-model="lastName" filled dense placeholder="Enter your last name" color="white" dark>
            <template v-slot:prepend>
              <q-icon name="person" color="white" />
            </template>
          </q-input>
        </div>

        <!-- Nickname -->
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
          <q-input v-model="email" filled dense type="email" placeholder="Enter your email" color="white" dark
            :rules="[
              val => !!val || 'Email is required',
              val => /^[^\s@]{3,}@[^\s@]{3,}\.[^\s@]{2,}$/.test(val) || 'Please enter a valid email'
            ]"

          >
            <template v-slot:prepend>
              <q-icon name="email" color="white" />
            </template>
          </q-input>
        </div>

        <!-- Password -->
        <div class="q-mb-md">
          <label class="text-weight-medium q-mb-xs block">Password</label>
          <q-input v-model="password" filled dense
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter new password (leave empty to keep current)"
            color="white"
            dark
          >
            <template v-slot:prepend>
              <q-icon name="lock" color="white" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                color="white"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
        </div>

        <!-- Confirm Password -->
        <div v-if="password" class="q-mb-md">
          <label class="text-weight-medium q-mb-xs block">Confirm Password</label>
          <q-input v-model="confirmPassword" filled dense
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

      <q-card-actions align="right" class="q-px-md q-pb-md sticky-footer" style="flex: 0 0 auto;">
        <q-btn flat label="Cancel" @click="closeDialog" class="cancel-btn" />
        <q-btn label="Save Changes" @click="saveSettings" :disable="!isFormValid" class="save-btn" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'

const showDialog = ref(false)
const showPassword = ref(false)

// Form fields
/*
These variables store the current state of the component
"ref" makes them reactive - when they change, the UI updates automatically
*/
const firstName = ref('John')
const lastName = ref('Doe')
const nickname = ref('johndoe')
const email = ref('john.doe@example.com')
const password = ref('')
const confirmPassword = ref('')

const isFormValid = computed(() => {
  const emailValid = email.value
  const passwordValid = !password.value || (password.value === confirmPassword.value && password.value.length >= 6)
  return emailValid && passwordValid
})

function closeDialog() {
  showDialog.value = false
  // Reset password fields when closing
  password.value = ''
  confirmPassword.value = ''
  showPassword.value = false
}

function saveSettings() {
  if (!isFormValid.value) return

  const updatedSettings = {
    firstName: firstName.value,
    lastName: lastName.value,
    nickname: nickname.value,
    email: email.value,
    ...(password.value && { password: password.value })
      // if password.value exists (not empty), spread it into the object
      // otherwise, do not add the password field
  }

  console.log('Saving settings:', updatedSettings)

  // TODO: Send to backend API
  // await updateUserSettings(updatedSettings)

  closeDialog()
}
</script>

<style scoped>
.q-card {
  background-color: #355070;
  color: white;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sticky-footer {
  background-color: #283C55;
}

.cancel-btn {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.cancel-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.save-btn {
  background-color: #355070;
  color: white;
  border-radius: 6px;
  font-weight: bold;
}

.save-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.save-btn:disabled {
  background-color: rgb(78, 143, 235);
}
</style>
