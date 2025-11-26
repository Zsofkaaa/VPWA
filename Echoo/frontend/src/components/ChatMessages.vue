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

function onLoad(index: number, done: (stop?: boolean) => void) {
  const ts = () => new Date().toISOString()
  console.log(`${ts()} [INFINITE SCROLL] onLoad() called — index:`, index)

  // Odloženie aby Quasar infinite-scroll "pustil" renderovanie
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    console.log(`${ts()} [INFINITE SCROLL] setTimeout fired`)

    // rýchle podmienky
    console.log(`${ts()} [INFINITE SCROLL] isLoadingOlder:`, isLoadingOlder.value,
      'hasMoreMessages:', hasMoreMessages.value,
      'currentChannelId:', currentChannelId?.value)

    if (isLoadingOlder.value) {
      console.log(`${ts()} [INFINITE SCROLL] Aborting: already loading older messages`)
      done(true)
      return
    }

    if (!hasMoreMessages.value) {
      console.log(`${ts()} [INFINITE SCROLL] Aborting: no more messages flag set`)
      done(true)
      return
    }

    if (!currentChannelId?.value) {
      console.log(`${ts()} [INFINITE SCROLL] Aborting: no currentChannelId`)
      done(true)
      return
    }

    const oldestMessageId = localMessages.value[0]?.id
    console.log(`${ts()} [INFINITE SCROLL] oldestMessageId:`, oldestMessageId)

    if (!oldestMessageId) {
      console.log(`${ts()} [INFINITE SCROLL] Aborting: no oldestMessageId (nothing to load before)`)
      done(true)
      return
    }

    isLoadingOlder.value = true
    console.log(`${ts()} [INFINITE SCROLL] Set isLoadingOlder = true`)

    try {
      const token = localStorage.getItem('auth_token')
      const url = `http://localhost:3333/channels/${currentChannelId.value}/messages?before=${oldestMessageId}&limit=20`
      console.log(`${ts()} [INFINITE SCROLL] Fetch URL:`, url, 'token exists:', !!token)

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })

      console.log(`${ts()} [INFINITE SCROLL] fetch returned, status:`, response.status)

      if (!response.ok) {
        console.warn(`${ts()} [INFINITE SCROLL] Fetch not ok — status:`, response.status)
        // ak 500 alebo iný error, zastavujeme ďalšie pokusy
        hasMoreMessages.value = false
        console.log(`${ts()} [INFINITE SCROLL] Set hasMoreMessages = false due to fetch error`)
        done(true)
        return
      }

      const olderMessages: Message[] = await response.json()
      console.log(`${ts()} [INFINITE SCROLL] Parsed JSON — count:`, Array.isArray(olderMessages) ? olderMessages.length : 'not-array', olderMessages)

      if (!Array.isArray(olderMessages)) {
        console.error(`${ts()} [INFINITE SCROLL] Unexpected payload (not array)`, olderMessages)
        hasMoreMessages.value = false
        done(true)
        return
      }

      if (olderMessages.length === 0) {
        console.log(`${ts()} [INFINITE SCROLL] No older messages returned — marking hasMoreMessages = false`)
        hasMoreMessages.value = false
        done(true)
        return
      }

      // bezpečná referencia na container pred prependingom
      const container = messagesContainer.value
      if (!container) {
        console.warn(`${ts()} [INFINITE SCROLL] messagesContainer is null — cannot preserve scroll position`)
        // aj tak pridáme správy (bez korektného scroll-posunu) aby užívateľ ich videl pri ďalšom manuálnom skrolle
        localMessages.value = [...olderMessages.reverse(), ...localMessages.value]
        await nextTick()
        done()
        return
      }

      const oldHeight = container.scrollHeight
      console.log(`${ts()} [INFINITE SCROLL] old scrollHeight:`, oldHeight)

      // prepend správy (reverzujeme order, aby staršie boli prv)
      localMessages.value = [...olderMessages.reverse(), ...localMessages.value]
      console.log(`${ts()} [INFINITE SCROLL] prepended ${olderMessages.length} messages — localMessages length:`, localMessages.value.length)

      // počkáme na DOM update
      await nextTick()
      console.log(`${ts()} [INFINITE SCROLL] nextTick resolved`)

      // znovu overíme container po aktualizácii DOM
      const containerAfter = messagesContainer.value
      if (!containerAfter) {
        console.warn(`${ts()} [INFINITE SCROLL] messagesContainer became null after update`)
        done(true)
        return
      }

      const newHeight = containerAfter.scrollHeight
      console.log(`${ts()} [INFINITE SCROLL] new scrollHeight:`, newHeight, 'oldHeight:', oldHeight)

      const delta = newHeight - oldHeight
      console.log(`${ts()} [INFINITE SCROLL] Adjusting scrollTop by delta:`, delta)

      // upravíme scrollTop tak, aby viewport zostal na rovnakom obsahu
      containerAfter.scrollTop += delta

      console.log(`${ts()} [INFINITE SCROLL] scrollTop after adjust:`, containerAfter.scrollTop)

      done() // successful continue
      console.log(`${ts()} [INFINITE SCROLL] done() called — load finished successfully`)
    } catch (err) {
      console.error(`${ts()} [INFINITE SCROLL] Exception while loading older messages:`, err)
      hasMoreMessages.value = false
      done(true)
    } finally {
      isLoadingOlder.value = false
      console.log(`${ts()} [INFINITE SCROLL] Set isLoadingOlder = false (finally)`)
    }
  }, 2000) // small delay so infinite-scroll can settle
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