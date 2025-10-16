<template>
    <div class="chat-messages">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="q-mb-md"
      >
        <div class="text-bold">{{ msg.user }}</div>
        <div class="bg-grey-9 q-pa-sm q-mt-xs" style="border-radius: 8px;">
          {{ msg.text }}
        </div>
      </div>
      <div class="footer-blocker"></div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'

interface Message {
  id: number
  user: string
  text: string
}

const messages = ref<Message[]>([])

onMounted(async () => {
  // Példa: lekér három üzenetet (lehetne fetch is)
  // Most szimuláljuk mintha API-ból jönne:
  messages.value = await getMessages()
})

async function getMessages(): Promise<Message[]> {
  // Késleltetés szimulálása (mintha hálózaton jönne)
  await new Promise((resolve) => setTimeout(resolve, 500))

  return [
    { id: 1, user: 'User 1', text: 'Hello there!' },
    { id: 2, user: 'User 2', text: 'Hi! How are you?' },
    { id: 3, user: 'User 3', text: 'All good, working on a project.' },
    { id: 1, user: 'User 1', text: 'Hello there!' },
    { id: 2, user: 'User 2', text: 'Hi! How are you?' },
    { id: 3, user: 'User 3', text: 'All good, working on a project.' },
    { id: 1, user: 'User 1', text: 'Hello there!' },
    { id: 2, user: 'User 2', text: 'Hi! How are you?' },
    { id: 3, user: 'User 3', text: 'All good, working on a project.' },
    { id: 1, user: 'User 1', text: 'Hello there!' },
    { id: 2, user: 'User 2', text: 'Hi! How are you?' },
    { id: 3, user: 'User 3', text: 'All good, working on a project.' },
    { id: 1, user: 'User 1', text: 'Hello there!' },
    { id: 2, user: 'User 2', text: 'Hi! How are you?' },
    { id: 3, user: 'User 3', text: 'All good, working on a project.' }
  ]
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden; /* megakadályozza, hogy az egész layout scrollozódjon */
}

.chat-messages {
  flex: 1;
  overflow-y: auto; /* CSAK az üzenetek scrollozódnak */
  padding: 16px;
  padding-bottom: 80px; /* hely a footernek */
}

.footer-blocker {
  height: 80px;
  background-color: #1E1E1E; /* chat háttérszín */
  flex-shrink: 0;
}
</style>
