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
const lastLoadTime = ref<number>(0) // Throttling mechanizmus

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
    console.log('[INFINITE SCROLL] Throttled - too soon')
    done()
    return
  }

  if (!currentChannelId?.value) {
    console.warn("No channel selected.")
    done(true)
    return
  }

  // Ak už načítavame, preskočíme
  if (isLoadingOlder.value) {
    console.log('[INFINITE SCROLL] Already loading')
    done()
    return
  }

  isLoadingOlder.value = true
  lastLoadTime.value = now

  const token = localStorage.getItem('auth_token')
  const beforeId = oldestMessageId.value ?? ''
  const url = `http://localhost:3333/channels/${currentChannelId.value}/messages?before=${beforeId}&limit=20`

  console.log(`[INFINITE SCROLL] Fetching older messages before ID: ${beforeId}`)

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
    console.log(`[INFINITE SCROLL] Received ${newMessages.length} messages`)

    if (newMessages.length === 0) {
      hasMoreMessages.value = false
      done(true)
      return
    }

    // Backend posiela desc, my chceme asc pre zobrazenie
    const sortedMessages = [...newMessages].reverse()

    // Odstránime duplikáty - pridáme len tie, ktoré ešte nemáme
    const existingIds = new Set(localMessages.value.map(m => m.id))
    const uniqueNewMessages = sortedMessages.filter(m => !existingIds.has(m.id))

    if (uniqueNewMessages.length > 0) {
      // Pridáme na začiatok (staršie správy)
      localMessages.value = [...uniqueNewMessages, ...localMessages.value]

      // Aktualizujeme ID najstaršej správy (najmenšie ID)
      const allIds = localMessages.value.map(m => m.id)
      oldestMessageId.value = Math.min(...allIds)

      console.log(`[INFINITE SCROLL] Added ${uniqueNewMessages.length} unique messages. Oldest ID: ${oldestMessageId.value}`)
    }

    // Ak sme dostali menej správ ako limit, pravdepodobne sme na konci
    if (newMessages.length < 20) {
      hasMoreMessages.value = false
    }

    done()

  } catch (err) {
    console.error("[INFINITE SCROLL] Fetch error:", err)
    hasMoreMessages.value = false
    done(true)
  } finally {
    isLoadingOlder.value = false
  }
}

function formatMessage(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped.replace(
    /@(?:"([^"]+)"|'([^']+)'|(\S+))/g,
    (match, quoted1, quoted2, single) => {
      const mentionText = quoted1 || quoted2 || single
      return `<span class="ping-highlight">@${mentionText}</span>`
    }
  )
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

// Sledujeme zmeny v props.messages (nové správy z parent componentu)
watch(
  () => props.messages,
  async (newVal) => {
    const wasBottom = isAtBottom()

    // Ak sa zmenil kanál alebo prišli úplne nové správy
    if (newVal.length > 0) {
      // Skontrolujeme, či sú to nové správy alebo zmena kanála
      const currentIds = new Set(localMessages.value.map(m => m.id))

      // Ak sú všetky ID nové, pravdepodobne sa zmenil kanál
      const isChannelChange = newVal.length > 0 &&
        newVal.every(m => !currentIds.has(m.id))

      if (isChannelChange) {
        // Reset všetkého pri zmene kanála
        console.log('[MESSAGES] Channel changed, resetting...')
        localMessages.value = [...newVal]
        hasMoreMessages.value = true
        isLoadingOlder.value = false

        // Nastavíme ID najstaršej správy
        if (newVal.length > 0) {
          const allIds = newVal.map(m => m.id)
          oldestMessageId.value = Math.min(...allIds)
        }
      } else {
        // Pridáme len nové správy (tie, ktoré ešte nemáme)
        const existingIds = new Set(localMessages.value.map(m => m.id))
        const uniqueNewMessages = newVal.filter(m => !existingIds.has(m.id))

        if (uniqueNewMessages.length > 0) {
          console.log(`[MESSAGES] Adding ${uniqueNewMessages.length} new messages`)
          localMessages.value = [...localMessages.value, ...uniqueNewMessages]
        }
      }
    }

    await nextTick()

    if (wasBottom || !userScrolledUp.value) {
      setTimeout(scrollToBottom, 100)
    }
  },
  { immediate: true, deep: true }
)

// Sledujeme zmenu kanála
watch(
  () => currentChannelId?.value,
  () => {
    // Reset pri zmene kanála
    hasMoreMessages.value = true
    oldestMessageId.value = null
    localMessages.value = []
    userScrolledUp.value = false
    lastLoadTime.value = 0 // Reset throttle
  }
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
