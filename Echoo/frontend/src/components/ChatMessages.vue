<template>

  <!-- HLAVNÁ SEKCIA PRE ZOBRAZENIE SPRÁV -->
  <div ref="messagesContainer" class="chat-messages">

    <!-- INFINITE SCROLL (BEZ REVERSE PRE SPRÁVNE PORADIE) -->
    <q-infinite-scroll
    :offset="100"
    @load="onLoad"
    spinner-color="white"
    >
      <template v-slot:loading>
        <div class="row justify-center q-my-md">
          <q-spinner-tail color="blue" size="40px" />
        </div>
      </template>

      <!-- CYKLUS PRE ZOBRAZENIE KAŽDEJ SPRÁVY -->
      <div
      v-for="msg in localMessages"
      :key="msg.id"
      class="q-mb-md"
      >

        <!-- MENO POUŽÍVATEĽA -->
        <div class="text-bold">
          {{ msg.user }}
          <span v-if="currentUserId === msg.userId" class="you-label">(You)</span>
        </div>

        <!-- OBSAH SPRÁVY (S KONTROLOU NA PING) -->
        <div
        class="message-content q-pa-sm q-mt-xs"
        :class="{ 'ping-message': isPingedMessage(msg) }"
        >
          <!-- FORMÁTOVANÝ TEXT - S MODRÝM ZVÝRAZNENÍM @NICKNAME -->
          <span v-html="formatMessage(msg.text)"></span>
        </div>

      </div>

      <!-- DUMMY ELEMENT PRE SCROLLOVANIE NA SPODOK -->
      <div ref="bottomElement"></div>

    </q-infinite-scroll>

  </div>

</template>



<script lang="ts" setup>

import { nextTick, ref, watch, onMounted } from 'vue'
import { inject } from 'vue'

// Získame ID aktuálneho používateľa z providera
const currentUserId = inject<number>('currentUserId')

// Rozhranie pre správu
interface Message {
  id: number
  userId: number
  user: string
  text: string
  mentionedUserIds?: number[]
}

// Props z rodičovskej komponenty
const props = defineProps<{ messages: Message[] }>()

// Lokálne pole správ
const localMessages = ref<Message[]>([])

// Referencia na kontajner s správami
const messagesContainer = ref<HTMLElement | null>(null)

// Referencia na spodný element
const bottomElement = ref<HTMLElement | null>(null)

// Sledujeme, či používateľ scrolluje hore
const userScrolledUp = ref(false)

// Získame nickname aktuálneho používateľa z localStorage
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

// Extrahuje všetky @mentions zo správy
function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g
  const matches = text.matchAll(mentionRegex)
  return Array.from(matches, (m) => m[1])
    .filter((mention): mention is string => Boolean(mention))
    .map(m => m.toLowerCase())
}

// Infinite scroll - načítanie starších správ
function onLoad(index: number, done: (stop?: boolean) => void) {
  // TODO: Implementácia načítania starších správ z backendu
  setTimeout(() => {
    done(true)
  }, 500)
}

// Formátuje správu - zvýrazní @nickname na modro
function formatMessage(text: string): string {
  // Všetky @slová zvýrazníme modrou farbou
  return text.replace(/(@\w+)/g, '<span class="ping-highlight">$1</span>')
}

// Určuje, či je správa pingovaná (či je aktuálny používateľ spomenutý)
function isPingedMessage(msg: Message): boolean {
  // Ak správu poslal aktuálny používateľ, nikdy nie je pingovaná
  if (msg.userId === currentUserId) {
    return false
  }

  // Kontrola cez mentionedUserIds (ak backend poslal)
  if (msg.mentionedUserIds && msg.mentionedUserIds.length > 0) {
    if (msg.mentionedUserIds.includes(currentUserId as number)) {
      return true
    }
  }

  // Fallback: kontrola priamo v texte správy
  const currentNickname = getCurrentUserNickname()
  if (!currentNickname) return false

  const mentions = extractMentions(msg.text)
  return mentions.includes(currentNickname)
}

// Skontroluje, či je používateľ na spodku chatu
function isAtBottom() {
  const el = messagesContainer.value
  if (!el) return true
  const threshold = 100
  return Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) <= threshold
}

// Automaticky scrolluje na spodok
function scrollToBottom() {
  const el = bottomElement.value
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Sleduje manuálne scrollovanie používateľa
function handleScroll() {
  const el = messagesContainer.value
  if (!el) return
  userScrolledUp.value = !isAtBottom()
}

// Sleduje zmeny v správach
watch(
  () => props.messages,
  async (newVal, oldVal) => {

    const wasBottom = isAtBottom()

    const isNewMessage = newVal.length > (oldVal?.length || 0)

    localMessages.value = [...newVal]

    // Čakáme na vykreslenie DOM
    await nextTick()

    // Automatický scroll, ak bol používateľ na spodku alebo prišla nová správa
    if (wasBottom || (isNewMessage && !userScrolledUp.value)) {
      setTimeout(() => {
        scrollToBottom()
        userScrolledUp.value = false
      }, 100)
    }
  },
  { immediate: true, deep: true }
)

// Pri načítaní komponenty
onMounted(() => {
  // Pridáme listener pre scrollovanie
  const el = messagesContainer.value
  if (el) {
    el.addEventListener('scroll', handleScroll)
  }

  // Počiatočný scroll na spodok
  setTimeout(() => {
    scrollToBottom()
  }, 200)
})

</script>



<style>

/* Modrá farba pre @nickname slová */
.ping-highlight {
  color: #00aff4 !important;
  font-weight: 700;
}

/* Hlavný kontajner pre správy */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  margin-top: 80px;
  display: flex;
  flex-direction: column;
}

/* Základný štýl pre správy */
.message-content {
  border-radius: 8px;
  background-color: #2d2d2d;
  color: white;
}

/* Štýl pre pingovanú správu - modrý background a border */
.ping-message {
  background-color: rgba(88, 101, 242, 0.15) !important;
  border: 2px solid #5865f2;
  font-weight: 600;
}

/* Štýl pre "You" označenie */
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
