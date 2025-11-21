<template>

  <!-- HLAVNÁ SEKCIA PRE ZOBRAZENIE SPRÁV -->
  <div ref="messagesContainer" class="chat-messages">

    <!-- INFINITE SCROLL
         @load="loadMore" -->
    <q-infinite-scroll
    :offset="100"
    reverse
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
    </q-infinite-scroll>
  </div>

</template>



<script lang="ts" setup>

// KELL A SCROLL TO BOTTOM

import { nextTick, ref, watch } from 'vue'
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

/* FUNKCIA NA FORMÁTOVANIE SPRÁVY (PING) */
function formatMessage(text: string, isPing?: boolean): string {
  if (!isPing) return text;
  return text.replace(/(@\w+)/g, '<span class="ping-highlight">$1</span>');
}

function isAtBottom() {
  const el = messagesContainer.value
  if (!el) return true
  return el.scrollTop + el.clientHeight >= el.scrollHeight - 50
}

// AUTOMATIC SCROLL TO BOTTOM
function scrollToBottom() {
  const el = messagesContainer.value
  if (!el) return

  el.scrollTop = el.scrollHeight
}

/* SLEDUJE ZMENY V PROPS.MESSAGES A AKTUALIZUJE LOKÁLNE SPRÁVY */
watch(
  () => props.messages,
  async (newVal) => {
    const wasBottom = isAtBottom()

    localMessages.value = [...newVal]
    await nextTick()

    if (wasBottom) scrollToBottom()
  },
  { immediate: true, deep: true }
)

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
