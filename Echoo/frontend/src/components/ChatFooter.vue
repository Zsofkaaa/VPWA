<template>
  <footer
    class="chat-footer row items-center q-pa-sm"
    :style="footerStyle"
  >
    <!-- Tlačidlo pre zobrazenie kto píše -->
    <q-btn
      flat
      round
      dense
      icon="visibility"
      color="grey-6"
      class="typing-preview-btn"
      @click="showTypingPreview = !showTypingPreview"
    >
    </q-btn>

    <!-- Textové pole s mention autocomplete -->
    <div class="col" style="position: relative;" ref="inputRef">
      <q-input
        ref="innerInputRef"
        :model-value="newMessage"
        @update:model-value="handleInput"
        placeholder="Start writing..."
        class="chat-input"
        dense
        outlined
        borderless
        @keydown="handleKeydown"
      />

      <!-- Inline dropdown pre výber členov (custom, non-teleported) -->
      <div
        v-if="showMentionMenu"
        ref="mentionRoot"
        class="custom-mention-menu"
        role="listbox"
      >
              <div class="mention-list">
                <div class="mention-spacer"></div>

                <div v-if="filteredMembers.length === 0" class="no-members">
                  <div class="no-members-label">No members found</div>
                </div>

                <div
                  v-for="(member, index) in filteredMembers"
                  :key="member.id"
                  class="mention-item"
                  :class="{ 'selected': index === selectedIndex }"
                  @click="selectMention(member)"
                >
                  {{ member.nickName }}
                </div>
              </div>
      </div>
    </div>

    <!-- Dialog pre zobrazenie kto píše -->
    <q-dialog v-model="showTypingPreview">
      <q-card class="typing-preview-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Who is typing</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <!-- Ak nikto nepíše -->
          <div v-if="typingUsers.length === 0" class="no-typing-message">
            <div class="text-grey-6 q-mt-md">Currently no one is typing</div>
          </div>

          <!-- Zoznam používateľov ktorí píšu -->
          <div v-else class="typing-users-list">
            <div
              v-for="user in typingUsers"
              :key="user.user"
              class="typing-user-item"
            >
              <div class="user-header">
                <span class="user-name">{{ user.user }}</span>
              </div>
              <!-- Zobraz obsah ak existuje -->
              <div v-if="user.content" class="user-content">
                "{{ user.content }}"
              </div>
              <!-- Inak zobraz default text -->
              <div v-else class="user-content-empty">
                <em>Just started typing...</em>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </footer>
</template>

<script lang="ts" setup>
import { ref, computed, watch, inject, type Ref } from 'vue'
import type { TypingUser } from '@/types'
import API_URL from '../config/api'

// Props z rodiča
const props = defineProps<{
  newMessage: string
  footerStyle: Record<string, string | number>
  typingUsers: TypingUser[]
}>()

// Emity do rodiča
const emit = defineEmits<{
  'update:newMessage': [value: string | number | null]
  'enterPress': [event: KeyboardEvent]
  'typing': []
  'typingContent': [content: string]
}>()

// Injektuj aktuálny channel ID
const currentChannelId = inject<Ref<number | null>>('currentChannelId')

// Stavy
const showTypingPreview = ref(false)
const showMentionMenu = ref(false)
const inputRef = ref<HTMLElement | null>(null)
const innerInputRef = ref<{ $el: HTMLElement } | null>(null)
const mentionRoot = ref<HTMLElement | null>(null)
const selectedIndex = ref(-1) // Index vybraného člena (-1 = nič nie je vybrané)
const mentionStartPos = ref(-1) // Pozícia @ v texte
const mentionQuery = ref('') // Text za @ (hľadaný string)
const channelMembers = ref<Array<{ id: number, nickName: string, role: string }>>([])

// Zavri mention menu pri kliknutí mimo
function onDocClick(e: MouseEvent) {
  const root = mentionRoot.value
  if (!root) return
  const target = e.target as Node // Element, na ktorý sa kliklo
  // Ak klik nebol v mention menu, inpute ani vnútornom inpute, zavri menu
  if (!root.contains(target) && !inputRef.value?.contains(target) && !innerInputRef.value?.$el?.contains(target)) {
    showMentionMenu.value = false
  }
}

// Pri otvorení nasadíme listener, pri zatvorení zrušíme a resetujeme výber
watch(showMentionMenu, (val) => {
  if (val) {
    document.addEventListener('mousedown', onDocClick)
    selectedIndex.value = -1
  } else {
    document.removeEventListener('mousedown', onDocClick)
    selectedIndex.value = -1
  }
})

// Načítaj členov aktuálneho kanála pre @mention
async function loadChannelMembers() {
  if (!currentChannelId?.value) return

  try {
    const token = localStorage.getItem('auth_token')
    const res = await fetch(`${API_URL}/channels/${currentChannelId.value}/members`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (res.ok) {
      channelMembers.value = await res.json() // Uloží načítaných členov do reaktívnej premennej
      console.log('[ChatFooter] Loaded', channelMembers.value.length, 'channel members')
    }
  } catch (err) {
    console.error('[ChatFooter] Failed to load members:', err)
  }
}

// Členovia filtrovaní podľa zadanej query, max 5 položiek
const filteredMembers = computed(() => {
  let results = []
  
  // Ak nie je query (nie je nic po @), zobraz prvých 5
  if (!mentionQuery.value) {
    results = channelMembers.value.slice(0, 5)
  } else {
    // Filtruj case-insensitive
    const query = mentionQuery.value.toLowerCase()
    const matches = channelMembers.value.filter(m =>
      m.nickName.toLowerCase().includes(query)
    )
    // Max 5 výsledkov
    results = matches.slice(0, 5)
  }
  
  // Obráť poradie, aby prvý výsledok bol na spodku
  return results.reverse()
})

// Over či posledné @ pred kurzorom má povoliť otvorenie menu
function checkMentionTrigger(text: string, cursorPos: number): boolean {
  // Nájdi posledné @ pred kurzorom
  let lastAtPos = -1
  for (let i = cursorPos - 1; i >= 0; i--) {
    if (text[i] === '@') {
      lastAtPos = i
      break
    }
    // Zastav ak narazíš na medzeru alebo nový riadok
    if (text[i] === ' ' || text[i] === '\n') {
      break
    }
  }

  // @ nenájdené
  if (lastAtPos === -1) return false

  // @ musí byť na začiatku alebo po medzere/novom riadku
  const isValidPosition = lastAtPos === 0 || text[lastAtPos - 1] === ' ' || text[lastAtPos - 1] === '\n'
  if (!isValidPosition) return false

  // Text medzi @ a kurzorom
  const textAfterAt = text.substring(lastAtPos + 1, cursorPos)

  // Ak je medzera po @, nezobraz menu
  if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
    return false
  }

  // Nastav globálne hodnoty
  mentionStartPos.value = lastAtPos
  mentionQuery.value = textAfterAt
  return true
}

// Spracovanie vstupu: emit udalostí a kontrola @mentions
function handleInput(value: string | number | null) {
  const text = String(value || '')

  // Emituj zmeny do rodiča
  emit('update:newMessage', text)
  emit('typing')
  emit('typingContent', text)

  // Získaj pozíciu kurzora
  const input = innerInputRef.value?.$el?.querySelector('input')
  const cursorPos = input?.selectionStart || text.length

  // Skontroluj či sa má zobraziť mention menu
  if (checkMentionTrigger(text, cursorPos)) {
    showMentionMenu.value = true
    selectedIndex.value = -1 // Žiadny člen nie je vybraný
  } else {
    showMentionMenu.value = false
    mentionStartPos.value = -1
    mentionQuery.value = ''
  }
}

// Vloženie vybraného člena do textu a posun kurzora
function selectMention(member: { id: number, nickName: string, role: string }) {
  if (mentionStartPos.value === -1) return

  const text = String(props.newMessage || '')
  const input = innerInputRef.value?.$el?.querySelector('input')
  const cursorPos = input?.selectionStart || text.length

  // Pridaj úvodzovky ak má meno medzery
  const hasSpace = member.nickName.includes(' ')
  const mentionText = hasSpace ? `@"${member.nickName}"` : `@${member.nickName}`

  // Zostav nový text s mention
  const newText = text.substring(0, mentionStartPos.value) +
            mentionText + ' ' +
            text.substring(cursorPos)

  // Emituj nový text
  emit('update:newMessage', newText)

  // Zavri menu
  showMentionMenu.value = false
  mentionStartPos.value = -1
  mentionQuery.value = ''
  selectedIndex.value = -1 // Reset výberu

  // Vráť focus späť do inputu a nastav kurzor za mention
  setTimeout(() => {
    input?.focus()
    const newCursorPos = mentionStartPos.value + mentionText.length + 1
    input?.setSelectionRange(newCursorPos, newCursorPos)
  }, 50)
}

// Klávesové skratky pri otvorenom menu aj pri odoslaní správy
function handleKeydown(event: KeyboardEvent) {
  // Ak je otvorené mention menu
  if (showMentionMenu.value) {
    if (event.key === 'ArrowDown') {
      // Šípka dole: posuň výber nižšie v zozname
      event.preventDefault()
      const len = filteredMembers.value.length
      if (len === 0) return
      if (selectedIndex.value < len - 1) {
        selectedIndex.value = selectedIndex.value + 1
      } else {
        selectedIndex.value = 0 // Ak si na konci, začni od začiatku
      }
    } else if (event.key === 'ArrowUp') {
      // Šípka hore: posuň výber vyššie v zozname
      event.preventDefault()
      const len = filteredMembers.value.length
      if (len === 0) return
      if (selectedIndex.value > 0) {
        selectedIndex.value = selectedIndex.value - 1
      } else {
        selectedIndex.value = len - 1 // Ak si na začiatku, choď na koniec
      }
    } else if (event.key === 'Tab') {
      // Tab: vyber člena zo zoznamu (len ak je niečo vybrané)
      if (selectedIndex.value >= 0) {
        const selectedMember = filteredMembers.value[selectedIndex.value]
        if (selectedMember) {
          event.preventDefault()
          selectMention(selectedMember)
          return
        }
      }
    } else if (event.key === 'Escape') {
      // Escape: zatvor mention menu a resetuj stav
      event.preventDefault()
      showMentionMenu.value = false
      mentionStartPos.value = -1
      mentionQuery.value = ''
    } else if (event.key === 'Enter') {
      // Enter: zatvor menu a zároveň odošli správu
      showMentionMenu.value = false
      mentionStartPos.value = -1
      mentionQuery.value = ''
      // Event sa prepošle do rodiča
    }
  }

  // Prepošli event do rodiča (pre odoslanie správy)
  emit('enterPress', event)
}

// Načítaj členov vždy pri prepnutí kanála
if (currentChannelId) {
  watch(currentChannelId, () => {
    void loadChannelMembers()
  }, { immediate: true })
}
</script>

<style>
.chat-footer {
  z-index: 2100;
  background-color: #1E1E1E;
  height: 80px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
  position: relative;
  border-top: 1px solid #333;
  flex-shrink: 0;
}

.typing-preview-btn {
  flex-shrink: 0;
}

.chat-input {
  border-radius: 15px;
  background-color: white;
  padding: 6px 12px;
}

.mention-list {
  border-radius: 8px;
  color: white;
  max-height: 300px;
  overflow-y: auto;
  display: flex !important;
  flex-direction: column !important;
  min-height: auto;
}

.mention-list .q-item {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(107, 11, 11, 0.1);
}

.mention-list .q-item:hover {
  background-color: #3d3d3d;
}

.mention-list .q-item.bg-blue-grey-9 {
  background-color: #455a64;
}

.mention-list .q-item-label {
  color: white;
}

.mention-list .q-item-label.caption {
  color: #999;
  font-size: 11px;
}

.mention-spacer {
  flex-grow: 1;
  min-height: 0;
}

.custom-mention-menu {
  position: absolute;
  left: 0;
  right: auto;
  bottom: calc(100% + 8px);
  width: auto;
  pointer-events: auto;
}

.mention-item {
  padding: 10px 12px;
  background: rgba(58, 58, 58, 0.98);
  color: white;
  cursor: pointer;
}

.mention-item.selected {
  background: #455a64;
}

.no-members {
  padding: 10px 12px;
  color: #bbb;
}

/* TYPING PREVIEW CARD */
.typing-preview-card {
  min-width: 400px;
  max-width: 500px;
  background-color: #2d2d2d;
  color: white;
}

.no-typing-message {
  text-align: center;
  padding: 40px 20px;
}

.typing-users-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.typing-user-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.user-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.user-name {
  font-weight: 600;
  color: #6fa5e7;
  font-size: 14px;
}

.user-content {
  color: #e0e0e0;
  font-size: 13px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  word-break: break-word;
  max-height: 100px;
  overflow-y: auto;
}

.user-content-empty {
  color: #888;
  font-size: 12px;
  font-style: italic;
}
</style>
