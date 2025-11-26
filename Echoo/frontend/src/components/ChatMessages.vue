<template>
  <div ref="messagesContainer" class="chat-messages">
    <q-infinite-scroll
      :offset="500"
      :disable="isLoadingOlder || !hasMoreMessages"
      @load="onLoad"
      reverse
    >
      <template v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots color="white" size="40px" />
        </div>
      </template>

      <div v-for="msg in localMessages" :key="msg.id" class="q-mb-md">
        <div class="text-bold">
          {{ msg.user }}
          <span v-if="currentUserId === msg.userId" class="you-label">(You)</span>
        </div>
        <div
          class="message-content q-pa-sm q-mt-xs"
          :class="{ 'ping-message': isPingedMessage(msg) }"
        >
          <span v-html="formatMessage(msg.text)"></span>
        </div>
      </div>

      <div ref="bottomElement"></div>
    </q-infinite-scroll>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref, watch, onMounted, inject, type Ref } from 'vue'

const currentUserId = inject<number>('currentUserId')
const currentChannelId = inject<Ref<number | null>>('currentChannelId')

interface Message {
  id: number
  userId: number
  user: string
  text: string
  mentionedUserIds?: number[]
}

const props = defineProps<{ messages: Message[] }>()

const isLoadingOlder = ref(false)
const hasMoreMessages = ref(true)
const localMessages = ref<Message[]>([])
const messagesContainer = ref<HTMLElement | null>(null)
const bottomElement = ref<HTMLElement | null>(null)
const userScrolledUp = ref(false)

function getCurrentUserNickname(): string | null {
  const savedUser = localStorage.getItem('user')
  if (!savedUser) return null
  try {
    const user = JSON.parse(savedUser)
    return user.nickName?.toLowerCase() || null
  } catch {
    return null
  }
}

function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g
  const matches = text.matchAll(mentionRegex)
  return Array.from(matches, (m) => m[1])
    .filter((mention): mention is string => Boolean(mention))
    .map(m => m.toLowerCase())
}

const oldestMessageId = ref<number | null>(null)

function onLoad(index: number, done: (stop?: boolean) => void) {
  if (!currentChannelId?.value) {
    console.warn("No channel selected.")
    done(true)
    return
  }

  const token = localStorage.getItem('auth_token')
  const url = `http://localhost:3333/channels/${currentChannelId.value}/messages?before=${oldestMessageId.value ?? ''}&limit=20`

  console.log(`[INFINITE SCROLL] Fetch URL:`, url)

  setTimeout(() => {
    // 🔥 FIX: void = žiaden floating promise
    void (async () => {
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!response.ok) {
          console.error('Failed to fetch messages')
          done(true)
          return
        }

        const newMessages: Message[] = await response.json()

        if (newMessages.length === 0) {
          hasMoreMessages.value = false
          done(true)
          return
        }

        // vložiť staršie správy na začiatok
        localMessages.value.unshift(...newMessages)

        // aktualizovať ID najstaršej správy
        oldestMessageId.value =
          newMessages[newMessages.length - 1]!.id

        done()

      } catch (err) {
        console.error("Fetch error:", err)
        done(true)
      }
    })()
  }, 1000)
}




function formatMessage(text: string): string {
  return text.replace(/(@\w+)/g, '<span class="ping-highlight">$1</span>')
}

function isPingedMessage(msg: Message): boolean {
  if (msg.userId === currentUserId) return false
  if (msg.mentionedUserIds && msg.mentionedUserIds.length > 0) {
    if (msg.mentionedUserIds.includes(currentUserId as number)) return true
  }
  const currentNickname = getCurrentUserNickname()
  if (!currentNickname) return false
  const mentions = extractMentions(msg.text)
  return mentions.includes(currentNickname)
}

function isAtBottom(): boolean {
  const el = messagesContainer.value
  if (!el) return true
  const threshold = 100
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
}

function scrollToBottom() {
  const el = bottomElement.value
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function handleScroll() {
  userScrolledUp.value = !isAtBottom()
}

// Sledovanie zmien správ
watch(
  () => props.messages,
  async (newVal) => {
    const wasBottom = isAtBottom()
    
    if (JSON.stringify(newVal) !== JSON.stringify(localMessages.value)) {
      localMessages.value = [...newVal]
      hasMoreMessages.value = true
      isLoadingOlder.value = false
    }

    await nextTick()

    if (wasBottom || !userScrolledUp.value) {
      setTimeout(scrollToBottom, 100)
    }
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  const el = messagesContainer.value
  if (el) {
    el.addEventListener('scroll', handleScroll)
  }
  setTimeout(scrollToBottom, 500)
})
</script>

<style>
.ping-highlight {
  color: #00aff4 !important;
  font-weight: 700;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  margin-top: 80px;
  display: flex;
  flex-direction: column;
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

.you-label {
  display: inline-block;
  background-color: #355377;
  color: white;
  font-size: 0.7em;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 6px;
  vertical-align: middle;
}
</style>