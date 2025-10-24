<template>
  <div ref="messagesContainer" class="chat-messages">
    <q-infinite-scroll
      :offset="100"
      @load="loadMore"
      reverse
      spinner-color="white"
    >
      <div
        v-for="msg in localMessages"
        :key="msg.id"
        class="q-mb-md"
      >
        <div class="text-bold">{{ msg.user }}</div>
        <div
          class="message-content q-pa-sm q-mt-xs"
          :class="{ 'ping-message': msg.isPing }"
        >
          <span v-html="formatMessage(msg.text, msg.isPing)"></span>
        </div>
      </div>
    </q-infinite-scroll>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onMounted } from 'vue'

interface Message {
  id: number
  user: string
  text: string
  isPing?: boolean
}

const props = defineProps<{ messages: Message[] }>()
const localMessages = ref<Message[]>([])
const messagesContainer = ref<HTMLElement | null>(null)

function scrollToBottom() {
  const el = messagesContainer.value
  if (el) {
    setTimeout(() => {
      el.scrollTop = el.scrollHeight
    }, 0)
  }
}

function formatMessage(text: string, isPing?: boolean): string {
  if (!isPing) return text;

  // Kiemeli a @username részt
  return text.replace(/(@\w+)/g, '<span class="ping-highlight">$1</span>');
}

watch(
  () => props.messages,
  (newVal) => {
    localMessages.value = [...newVal]
    scrollToBottom()
  },
  { immediate: true, deep: true }
)

watch(
  () => localMessages.value.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

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

onMounted(() => {
  scrollToBottom()
})
</script>



<style>
/* Globális stílus, hogy biztosan működjön */
.ping-highlight {
  color: #00aff4 !important;
  font-weight: 700;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 100px;
}

.message-content {
  border-radius: 8px;
  background-color: #2d2d2d;
  color: white;
}

.ping-message {
  background-color: rgba(88, 101, 242, 0.15) !important;
  border: 2px solid #5865f2;
  font-weight: 600;
}
</style>
