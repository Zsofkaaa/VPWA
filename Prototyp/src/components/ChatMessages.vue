<template>
  <div ref="messagesContainer" class="chat-messages">
    <q-infinite-scroll
      :offset="100"
      @load="loadMore"
      reverse
      spinner-color="white"
    />
    <div
      v-for="msg in localMessages"
      :key="msg.id"
      class="q-mb-md"
    >
      <div class="text-bold">{{ msg.user }}</div>
      <div class="bg-grey-9 q-pa-sm q-mt-xs" style="border-radius: 8px;">
        {{ msg.text }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onMounted } from 'vue'

interface Message { id: number; user: string; text: string }

// MÓDOSÍTÁS: sima Message[] típust várunk, nem Ref-et
const props = defineProps<{ messages: Message[] }>()
const localMessages = ref<Message[]>([])
const messagesContainer = ref<HTMLElement | null>(null)

function scrollToBottom() {
  const el = messagesContainer.value
  if (el) el.scrollTop = el.scrollHeight
}

// MÓDOSÍTÁS: props.messages.value helyett props.messages
watch(
  () => props.messages,
  (newVal) => {
    localMessages.value = [...newVal]
  },
  { immediate: true, deep: true } // deep: true, hogy objektum változásokat is érzékeljen
)

// Scroll minden új üzenetnél
watch(
  () => localMessages.value.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

// Infinite scroll: prepend older messages
function loadMore(index: number, done: (stop?: boolean) => void) {
  const el = messagesContainer.value
  const prevScrollHeight = el ? el.scrollHeight : 0

  setTimeout(() => {
    const older: Message[] = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + Math.floor(Math.random() * 100000) + i,
      user: `User ${Math.ceil(Math.random() * 5)}`,
      text: `Older message ${i + 1}`
    }))
    localMessages.value = [...older, ...localMessages.value]

    void nextTick().then(() => {
      if (el) el.scrollTop = el.scrollHeight - prevScrollHeight
      done()
    })
  }, 450)
}

onMounted(async () => {
  await nextTick()
  scrollToBottom()
})
</script>

<style scoped>
.chat-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 100px;
}
</style>
