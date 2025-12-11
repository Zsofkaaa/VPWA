import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'
import type { Router } from 'vue-router'
import type { Message, UserChannel } from '@/types'
import { useQuasar } from 'quasar'

export function useNotifications() {
  const $q = useQuasar()
  const showNotification = ref(false)
  const notificationSender = ref('')
  const notificationMessage = ref('')
  const isAppVisible = ref(!document.hidden)

  async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  function handleIncomingMessage(
    msg: Message,
    channels: UserChannel[],
    currentUserId: number | null,
    currentChannelId: number | null,
    messages: Ref<Message[]>,
    router: Router
  ) {
    if (msg.channelId === currentChannelId) {
      messages.value.push(msg)
    }

    if (msg.userId === currentUserId) return

    const channel = channels.find(ch => ch.id === msg.channelId)

    if (!channel) return

    const notifSettings = channel.notificationSettings || 'all'
    let shouldNotify = false

    switch (notifSettings) {
      case 'none':
        shouldNotify = false
        break
      case 'mentions':
        shouldNotify = msg.isPing === true
        break
      case 'all':
      default:
        shouldNotify = true
    }

    if (!shouldNotify) return

    // Ak je aplikácia viditeľná, použi Quasar notify
    if (isAppVisible.value) {
      if (msg.channelId !== currentChannelId) {
        // Zobraz notifikáciu len ak príde správa do iného kanála
        $q.notify({
          type: 'info',
          icon: 'chat',
          color: 'grey',
          message: `${msg.user} (#${channel.name}): ${msg.text.length > 30 ? msg.text.substring(0, 30) + '...' : msg.text}`,
          position: 'top-right',
          timeout: 2000,
          classes: 'q-mt-xl'
        })
      }
      return
    }
    // Ak je aplikácia na pozadí, zobraz systémovú notifikáciu
    else if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`${msg.user} (#${channel.name})`, {
        body: msg.text.length > 100 ? msg.text.substring(0, 100) + '...' : msg.text,
        icon: '/pictures/logo.jpg',
        tag: `channel-${msg.channelId}`, // Zabráni duplicitám
        requireInteraction: false
      })

      // Kliknutím na notifikáciu otvor aplikáciu
      notification.onclick = () => {
        window.focus()
        void router.push(`/chat/${msg.channelId}`)
        notification.close()
      }

      // Automaticky zavrieť po 5 sekundách
      setTimeout(() => notification.close(), 5000)
    }
  }

  function handleVisibilityChange() {
    isAppVisible.value = !document.hidden
    console.log('App visibility changed:', isAppVisible.value ? 'VISIBLE' : 'HIDDEN')
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return {
    showNotification,
    notificationSender,
    notificationMessage,
    isAppVisible,
    requestNotificationPermission,
    handleIncomingMessage,
    handleVisibilityChange
  }
}
