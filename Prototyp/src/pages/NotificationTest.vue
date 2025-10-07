<template>
  <div class="q-pa-md" style="height: 100vh; display: flex; justify-content: center; align-items: center;">
    <div>
      <q-btn label="Mutasd a notificationt" @click="showNotification" color="primary" />

      <!-- Notification komponent -->
      <Notification
        :sender="sender"
        :message="message"
        :logo="logo"
        :visible="visible"
      />
    </div>
  </div>
</template>



<script lang="ts" setup>
import { ref } from 'vue'
import Notification from 'src/components/NotificationPopUp.vue'

const visible = ref(false)
const sender = ref('Name of the sender')
const message = ref('Message of the sender')
const logo = ref('https://quasar.dev/logo/svg/quasar-logo.svg')

const showNotification = () => {
  visible.value = true
  setTimeout(() => visible.value = false, 3000)
}
</script>



<style scoped>
</style>
