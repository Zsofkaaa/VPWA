<template>
  <div ref="messagesContainer" class="chat-messages">
    <q-infinite-scroll
      :offset="150"
      :disable="isLoadingOlder || !hasMoreMessages"
      @load="onLoad"
      reverse
    >
      <template v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots color="white" size="40px" />
        </div>
      </template>

      <!-- Loading animácia a tetején (mivel reverse mode van) -->
      <div v-if="isLoadingOlder" class="row justify-center q-my-md">
        <q-spinner-dots color="white" size="40px" />
      </div>

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
import type { Message } from '@/types';
import API_URL from '../config/api';

const currentUserId = inject<number>('currentUserId')
const currentChannelId = inject<Ref<number | null>>('currentChannelId')

const props = defineProps<{ messages: Message[] }>()

const isLoadingOlder = ref(false)
const hasMoreMessages = ref(true)
const localMessages = ref<Message[]>([])
const messagesContainer = ref<HTMLElement | null>(null)
const bottomElement = ref<HTMLElement | null>(null)
const userScrolledUp = ref(false)
const oldestMessageId = ref<number | null>(null)
const lastLoadTime = ref<number>(0)

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
  const mentionRegex = /@(?:"([^"]+)"|'([^']+)'|(\S+))/g
  const matches = text.matchAll(mentionRegex)
  const mentions: string[] = []

  for (const match of matches) {
    const mention = (match[1] || match[2] || match[3])?.toLowerCase()
    if (mention) {
      mentions.push(mention)
    }
  }

  return mentions
}

async function onLoad(index: number, done: (stop?: boolean) => void) {
  const now = Date.now()
  if (now - lastLoadTime.value < 1000) {
    done()
    return
  }

  if (!currentChannelId?.value) {
    console.warn("No channel selected.")
    done(true)
    return
  }

  if (isLoadingOlder.value) {
    done()
    return
  }

  isLoadingOlder.value = true
  lastLoadTime.value = now

  const token = localStorage.getItem('auth_token')
  const beforeId = oldestMessageId.value ?? ''
  const url = `${API_URL}/channels/${currentChannelId.value}/messages?before=${beforeId}&limit=20`

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!response.ok) {
      console.error('Failed to fetch messages:', response.status)
      hasMoreMessages.value = false
      done(true)
      return
    }

    const newMessages: Message[] = await response.json()

    if (newMessages.length === 0) {
      hasMoreMessages.value = false
      done(true)
      return
    }

    const sortedMessages = [...newMessages].reverse()
    const existingIds = new Set(localMessages.value.map(m => m.id))
    const uniqueNewMessages = sortedMessages.filter(m => !existingIds.has(m.id))

    if (uniqueNewMessages.length > 0) {
      localMessages.value = [...uniqueNewMessages, ...localMessages.value]
      const allIds = localMessages.value.map(m => m.id)
      oldestMessageId.value = Math.min(...allIds)
    }

    if (newMessages.length < 20) {
      hasMoreMessages.value = false
    }

    setTimeout(() => {
      done()
    }, 300)

  } catch (err) {
    console.error("[INFINITE SCROLL] Fetch error:", err)
    hasMoreMessages.value = false
    done(true)
  } finally {
    setTimeout(() => {
      isLoadingOlder.value = false
    }, 200)
  }
}

function formatMessage(text: string): string {
  // FIRST: Find and mark mentions BEFORE escaping
  // Replace mentions with a placeholder that won't be escaped
  const MENTION_PLACEHOLDER = '___MENTION___'
  const mentions: Array<{ original: string; display: string }> = []

  const textWithPlaceholders = text.replace(
    /@(?:"([^"]+)"|'([^']+)'|(\S+))/g,
    (match, quoted1, quoted2, single) => {
      const mentionText = quoted1 || quoted2 || single
      mentions.push({
        original: match,
        display: `<span class="ping-highlight">@${mentionText}</span>`
      })
      return `${MENTION_PLACEHOLDER}${mentions.length - 1}${MENTION_PLACEHOLDER}`
    }
  )

  // SECOND: Escape HTML
  const escaped = textWithPlaceholders
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // THIRD: Replace placeholders with actual mention HTML
  let result = escaped
  mentions.forEach((mention, index) => {
    result = result.replace(
      `${MENTION_PLACEHOLDER}${index}${MENTION_PLACEHOLDER}`,
      mention.display
    )
  })

  return result
}

function isPingedMessage(msg: Message): boolean {
  if (msg.userId === currentUserId) return false

  // Check if mentioned by user ID
  if (msg.mentionedUserIds && msg.mentionedUserIds.length > 0) {
    if (msg.mentionedUserIds.includes(currentUserId as number)) return true
  }

  // Fallback: check by nickname (for backward compatibility)
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

watch(
  () => props.messages,
  async (newVal) => {
    const wasBottom = isAtBottom()

    if (newVal.length > 0) {
      const currentIds = new Set(localMessages.value.map(m => m.id))
      const isChannelChange = newVal.length > 0 && newVal.every(m => !currentIds.has(m.id))

      if (isChannelChange) {
        localMessages.value = [...newVal]
        hasMoreMessages.value = true
        isLoadingOlder.value = false
        userScrolledUp.value = false

        if (newVal.length > 0) {
          const allIds = newVal.map(m => m.id)
          oldestMessageId.value = Math.min(...allIds)
        }

        await nextTick()
        setTimeout(scrollToBottom, 150)
      } else {
        const existingIds = new Set(localMessages.value.map(m => m.id))
        const uniqueNewMessages = newVal.filter(m => !existingIds.has(m.id))

        if (uniqueNewMessages.length > 0) {
          localMessages.value = [...localMessages.value, ...uniqueNewMessages]
        }

        await nextTick()

        if (wasBottom || !userScrolledUp.value) {
          setTimeout(scrollToBottom, 100)
        }
      }
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => currentChannelId?.value,
  () => {
    hasMoreMessages.value = true
    oldestMessageId.value = null
    localMessages.value = []
    userScrolledUp.value = false
    lastLoadTime.value = 0

    void nextTick(() => {
      setTimeout(scrollToBottom, 300)
    })
  }
)

onMounted(() => {
  const el = messagesContainer.value
  if (el) {
    el.addEventListener('scroll', handleScroll)
  }

  void nextTick(() => {
    setTimeout(scrollToBottom, 500)
  })
})
</script>

<style scoped>
/* MENTION HIGHLIGHT - ALWAYS VISIBLE (using :deep for v-html content) */
.message-content :deep(.ping-highlight) {
  color: #00aff4 !important;
  font-weight: 700;
  background-color: rgba(0, 175, 244, 0.15);
  padding: 2px 4px;
  border-radius: 3px;
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

/* BLUE BORDER - ONLY FOR PINGED MESSAGES */
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
