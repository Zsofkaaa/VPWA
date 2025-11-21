<template>

  <!-- HLAVNÁ SEKCIA PRE ZOBRAZENIE SPRÁV -->
  <div ref="messagesContainer" class="chat-messages">

    <!-- INFINITE SCROLL (BEZ REVERSE PRE SPRÁVNE PORADIE) -->
    <q-infinite-scroll
    :offset="100"
    @load="onLoad"
    spinner-color="white"
    >

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
        :class="{ 'ping-message': msg.isPing }"
        >

          <!-- FORMÁTOVANIE TEXTU (ZVÝRAZNENIE @USERNAME) -->
          <span v-html="formatMessage(msg.text, msg.isPing)"></span>
        </div>

      </div>

      <!-- DUMMY ELEMENT NA SCROLLOVANIE NA SPODOK -->
      <div ref="bottomElement"></div>

    </q-infinite-scroll>

  </div>

</template>



<script lang="ts" setup>

import { nextTick, ref, watch, onMounted } from 'vue'
import { inject } from 'vue'

const currentUserId = inject<number>('currentUserId')


/* ROZHRANIE PRE SPRÁVU */
interface Message {
  id: number
  userId: number
  user: string
  text: string
  isPing?: boolean
}

/* ÚDAJE PRICHÁDZAJÚCE Z NADRADENEJ KOMPONENTY */
const props = defineProps<{ messages: Message[] }>()

/* LOKÁLNE POLE SPRÁV (KÓPIA PRE VNÚTORNÚ PRÁCU) */
const localMessages = ref<Message[]>([])

/* REFERENCIA NA KONTAJNER, KDE SA ZOBRAZUJÚ SPRÁVY */
const messagesContainer = ref<HTMLElement | null>(null)

/* REFERENCIA NA SPODNÝ ELEMENT PRE SCROLLOVANIE */
const bottomElement = ref<HTMLElement | null>(null)

/* PREMENNÁ PRE SLEDOVANIE, ČI POUŽÍVATEĽ SCROLLUJE HORE */
const userScrolledUp = ref(false)

/* FUNKCIA PRE INFINITE SCROLL - NAČÍTANIE STARŠÍCH SPRÁV */
function onLoad(index: number, done: (stop?: boolean) => void) {
  // TODO: Implementácia načítania starších správ z backendu
  // Zatiaľ len ukončíme loading
  setTimeout(() => {
    done(true) // true = stop loading (žiadne ďalšie správy)
  }, 500)
}

/* FUNKCIA NA FORMÁTOVANIE SPRÁVY (PING) */
function formatMessage(text: string, isPing?: boolean): string {
  if (!isPing) return text;
  return text.replace(/(@\w+)/g, '<span class="ping-highlight">$1</span>');
}

/* FUNKCIA NA KONTROLU, ČI JE POUŽÍVATEĽ NA SPODKU CHATU */
function isAtBottom() {
  const el = messagesContainer.value
  if (!el) return true
  // Tolerancia 100px pre detekciu spodku
  const threshold = 100
  return Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) <= threshold
}

/* FUNKCIA NA AUTOMATICKÉ SCROLLOVANIE NA SPODOK */
function scrollToBottom() {
  const el = bottomElement.value
  if (!el) return

  // Scrollujeme na dummy element na spodku
  el.scrollIntoView({ behavior: 'smooth', block: 'end' })
}

/* HANDLER PRE SLEDOVANIE MANUÁLNEHO SCROLLOVANIA POUŽÍVATEĽA */
function handleScroll() {
  const el = messagesContainer.value
  if (!el) return

  // Ak používateľ scrolluje hore, označíme to
  userScrolledUp.value = !isAtBottom()
}

/* SLEDUJE ZMENY V PROPS.MESSAGES A AKTUALIZUJE LOKÁLNE SPRÁVY */
watch(
  () => props.messages,
  async (newVal, oldVal) => {
    console.log('Messages changed:', { 
      oldLength: oldVal?.length, 
      newLength: newVal.length 
    })
    
    const wasBottom = isAtBottom()
    console.log('Was at bottom:', wasBottom)
    
    const isNewMessage = newVal.length > (oldVal?.length || 0)

    localMessages.value = [...newVal]
    
    // Počkáme na vykreslenie DOM
    await nextTick()

    // Automatický scroll len ak:
    // 1. Používateľ bol na spodku ALEBO
    // 2. Prišla nová správa a používateľ nescrolloval hore manuálne
    if (wasBottom || (isNewMessage && !userScrolledUp.value)) {
      console.log('Scrolling to bottom...')
      // Malé oneskorenie pre zabezpečenie kompletného vykreslenia
      setTimeout(() => {
        scrollToBottom()
        userScrolledUp.value = false
      }, 100)
    }
  },
  { immediate: true, deep: true }
)

/* PRI NAČÍTANÍ KOMPONENTU */
onMounted(() => {
  // Pridáme scroll listener
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

/* ZVÝRAZNENIE POUŽÍVATEĽA V PING SPRÁVE */
.ping-highlight {
  color: #00aff4 !important;
  font-weight: 700;
}

/* HLAVNÝ KONTAJNER PRE SPRÁVY */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 100px;
  display: flex;
  flex-direction: column;
}

/* ŠTÝL JEDNOTLIVÝCH SPRÁV */
.message-content {
  border-radius: 8px;
  background-color: #2d2d2d;
  color: white;
}

/* ŠTÝL PRE PING SPRÁVU (ZVÝRAZNENÉ SPRÁVY) */
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