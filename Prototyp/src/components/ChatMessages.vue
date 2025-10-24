<template>
    <div class="chat-messages">
      <div
        v-for="(msg, index) in messages"
        :key="msg.id + '-' + index"
        class="q-mb-md"
      >
        <div class="text-bold">{{ msg.user }}</div>
        <div
          class="q-pa-sm q-mt-xs"
          :class="index === messages.length - 2 ? 'highlight-message' : 'bg-grey-9'"
          style="border-radius: 8px;"
        >
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
    { id: 2, user: 'User 2', text: 'Hi @nickname! How are you?' },
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
  padding-bottom: 0px; /* hely a footernek 80px volt itt minek?*/
}

.footer-blocker {
  height: 80px;
  background-color: #1E1E1E; /* chat háttérszín */
  flex-shrink: 0;
}

.highlight-message {
  background-color: #a3d5ff; /* világoskék kiemelés */
  border-radius: 8px;
}
</style>
