<template>
  <div ref="messagesContainer" class="chat-messages">
    <q-infinite-scroll
      :offset="250"
      :disable="isLoadingOlder || !hasMoreMessages || isInitializing"
      @load="onLoad"
      reverse
    >
      <template v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots color="white" size="40px" />
        </div>
      </template>

      <!-- Načítavacia animácia hore (v reverse režime) -->
      <div v-if="isLoadingOlder" class="row justify-center q-my-md">
        <q-spinner-dots color="white" size="40px" />
      </div>

      <div v-for="msg in localMessages" :key="msg.id" class="q-mb-md message-wrapper">
        <div
          class="message-container"
          :class="{ 'my-message': currentUserId === msg.userId }"
        >
          <div class="text-bold message-author">
            {{ msg.user }}
          </div>
          <div
            class="message-content q-pa-sm q-mt-xs"
            :class="{ 'ping-message': isPingedMessage(msg) }"
          >
            <span v-html="formatMessage(msg.text, msg.mentionedUserIds)"></span>
          </div>
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
const isInitializing = ref(false) // Vlajka pre inicializáciu

function getCurrentUserNickname(): string | null {
  const savedUser = localStorage.getItem('user')
  if (!savedUser) return null
  try {
    const user = JSON.parse(savedUser)
    return user.nickName || null
  } catch {
    return null
  }
}

function extractMentions(text: string): string[] {
  const mentionRegex = /@(?:"([^"]+)"|'([^']+)'|(\S+))/g
  const matches = text.matchAll(mentionRegex)
  const mentions: string[] = []

  for (const match of matches) {
    const mention = (match[1] || match[2] || match[3])
    if (mention) {
      mentions.push(mention)
    }
  }

  return mentions
}

async function onLoad(index: number, done: (stop?: boolean) => void) {
  const now = Date.now()
  console.log('[INFINITE SCROLL] onLoad called, oldestMessageId:', oldestMessageId.value, 'hasMoreMessages:', hasMoreMessages.value, 'isInitializing:', isInitializing.value)

  // Ak ešte inicializujeme, nenačítavaj
  if (isInitializing.value) {
    console.log('[INFINITE SCROLL] Still initializing, skipping load')
    done()
    return
  }

  if (now - lastLoadTime.value < 1000) {
    console.log('[INFINITE SCROLL] Rate limited')
    done()
    return
  }

  if (!currentChannelId?.value) {
    console.warn("[INFINITE SCROLL] No channel selected.")
    done(true)
    return
  }

  if (isLoadingOlder.value) {
    console.log('[INFINITE SCROLL] Already loading')
    done()
    return
  }

  isLoadingOlder.value = true
  lastLoadTime.value = now

  const token = localStorage.getItem('auth_token')
  const beforeId = oldestMessageId.value ?? ''
  const url = `${API_URL}/channels/${currentChannelId.value}/messages?before=${beforeId}&limit=20`

  console.log('[INFINITE SCROLL] Fetching URL:', url)

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!response.ok) {
      console.error('[INFINITE SCROLL] Failed to fetch messages:', response.status)
      hasMoreMessages.value = false
      done(true)
      return
    }

    const newMessages: Message[] = await response.json()
    console.log('[INFINITE SCROLL] Received', newMessages.length, 'messages')

    if (newMessages.length === 0) {
      console.log('[INFINITE SCROLL] No more messages available')
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
      console.log('[INFINITE SCROLL] Updated oldestMessageId to:', oldestMessageId.value)
    }

    if (newMessages.length < 20) {
      console.log('[INFINITE SCROLL] Received less than 20 messages, no more available')
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

function formatMessage(text: string, mentionedUserIds: number[] = []): string {
  // Krok 1: Nájsť a označiť mentions pred escapovaním
  const MENTION_PLACEHOLDER = '___MENTION___'
  const mentions: Array<{ original: string; display: string }> = []
  const hasValidMentions = mentionedUserIds && mentionedUserIds.length > 0

  const textWithPlaceholders = text.replace(
    /@(?:"([^"]+)"|'([^']+)'|(\S+))/g,
    (match, quoted1, quoted2, single) => {
      const mentionText = quoted1 || quoted2 || single
      // Zvýrazníme mention iba ak backend potvrdil existenciu
      const display = hasValidMentions
        ? `<span class="ping-highlight">@${mentionText}</span>`
        : `@${mentionText}`
      mentions.push({
        original: match,
        display
      })
      return `${MENTION_PLACEHOLDER}${mentions.length - 1}${MENTION_PLACEHOLDER}`
    }
  )

  // Krok 2: Escapovať HTML
  const escaped = textWithPlaceholders
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Krok 3: Nahradiť placeholdery skutočným HTML pre mention
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

  // Kontrola zmienky podľa user ID
  if (msg.mentionedUserIds && msg.mentionedUserIds.length > 0) {
    if (msg.mentionedUserIds.includes(currentUserId as number)) return true
  }

  // Záloha: kontrola podľa nickname (spätná kompatibilita)
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
        console.log('[ChatMessages] Channel change detected')

        // Aktivuj inicializáciu
        isInitializing.value = true

        localMessages.value = [...newVal]
        hasMoreMessages.value = true
        isLoadingOlder.value = false
        userScrolledUp.value = false

        // Dôležité: pri zmene kanála nastav oldestMessageId
        if (newVal.length > 0) {
          const allIds = newVal.map(m => m.id)
          oldestMessageId.value = Math.min(...allIds)
          console.log('[ChatMessages] oldestMessageId set to:', oldestMessageId.value, 'from', allIds.length, 'messages')
        }

        await nextTick()

        // Najprv scroll na spodok, potom povoľ infinite scroll
        setTimeout(() => {
          scrollToBottom()

          // Počkajte ešte chvíľu a potom povoľte infinite scroll
          setTimeout(() => {
            isInitializing.value = false
            console.log('[ChatMessages] Initialization complete, infinite scroll enabled')
          }, 500) // Dodatočné oneskorenie 500 ms
        }, 150)

      } else {
        const existingIds = new Set(localMessages.value.map(m => m.id))
        const uniqueNewMessages = newVal.filter(m => !existingIds.has(m.id))

        if (uniqueNewMessages.length > 0) {
          console.log('[ChatMessages] Adding', uniqueNewMessages.length, 'new messages')
          localMessages.value = [...localMessages.value, ...uniqueNewMessages]

          // Aktualizuj oldestMessageId aj pri nových správach
          const allIds = localMessages.value.map(m => m.id)
          if (allIds.length > 0) {
            const newOldest = Math.min(...allIds)
            if (oldestMessageId.value === null || newOldest < oldestMessageId.value) {
              oldestMessageId.value = newOldest
              console.log('[ChatMessages] Updated oldestMessageId to:', oldestMessageId.value)
            }
          }
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
    console.log('[ChatMessages] Channel ID changed, resetting state')
    hasMoreMessages.value = true
    oldestMessageId.value = null
    localMessages.value = []
    userScrolledUp.value = false
    lastLoadTime.value = 0
    isInitializing.value = true // Reset príznaku inicializácie

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
/* Zvýraznenie mention – vždy viditeľné (používa :deep pre v-html) */
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

/* Obal správy – udrží celý blok pokope */
.message-wrapper {
  max-width: 100%;
  width: 100%;
  overflow: hidden;
}

.message-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 8px;
}

/* Vlastný message - prava strana */
/*
.my-message {
  align-items: flex-end;
}
  */

.my-message .message-author {
  color: #c6dfff;
  font-weight: 700;
  /*text-align: right;*/
}

.message-author {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Obsah správy – dôležité nastavenia pre zalomenie */
.message-content {
  border-radius: 12px;
  background-color: #2d2d2d;
  color: white;
  width: 100%;

  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;

  min-width: 0;
  overflow-wrap: anywhere;
  hyphens: auto;

  box-sizing: border-box;
}

.my-message .message-content {
  background: #2b3137 !important;
  color: white;
  /*text-align: right;*/
}

.ping-message {
  background-color: rgba(88, 101, 242, 0.15) !important;
  border: 2px solid #5865f2;
  font-weight: 600;
}
</style>
