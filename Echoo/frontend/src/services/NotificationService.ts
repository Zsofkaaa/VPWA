import { ref } from 'vue'

const showNotification = ref(false)
const notificationSender = ref('')
const notificationMessage = ref('')

function triggerNotification(sender: string, message: string) {
  notificationSender.value = sender
  notificationMessage.value = message
  showNotification.value = true

  setTimeout(() => {
    showNotification.value = false
  }, 4000)
}

export default {
  expose() {
    return {
      showNotification,
      notificationSender,
      notificationMessage
    }
  },
  triggerNotification
}
