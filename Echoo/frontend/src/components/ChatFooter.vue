<template>
  <footer
    class="chat-footer row items-center q-pa-sm"
    :style="footerStyle"
  >
    <!-- Typing Preview Icon -->
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

    <!-- Input Field -->
    <q-input
      :model-value="newMessage"
      @update:model-value="handleInput"
      placeholder="Start writing..."
      class="col chat-input"
      dense
      outlined
      borderless
      @keydown="$emit('enterPress', $event)"
    />

    <!-- Typing Preview Dialog -->
    <q-dialog v-model="showTypingPreview">
      <q-card class="typing-preview-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Who is typing</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <!-- If nobody is typing -->
          <div v-if="typingUsers.length === 0" class="no-typing-message">
            <div class="text-grey-6 q-mt-md">Currently no one is typing</div>
          </div>

          <!-- List of typing users -->
          <div v-else class="typing-users-list">
            <div
              v-for="user in typingUsers"
              :key="user.user"
              class="typing-user-item"
            >
              <div class="user-header">
                <span class="user-name">{{ user.user }}</span>
              </div>
              <div v-if="user.content" class="user-content">
                "{{ user.content }}"
              </div>
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
import { ref } from 'vue'
import type { TypingUser } from '@/types'

defineProps<{
  newMessage: string
  footerStyle: Record<string, string | number>
  typingUsers: TypingUser[]
}>()

const emit = defineEmits<{
  'update:newMessage': [value: string | number | null]
  'enterPress': [event: KeyboardEvent]
  'typing': []
  'typingContent': [content: string]
}>()

const showTypingPreview = ref(false)

function handleInput(value: string | number | null) {
  emit('update:newMessage', value)
  emit('typing')
  emit('typingContent', String(value || ''))
}
</script>

<style scoped>
/* HLAVNÝ ŠTÝL FOOTERA */
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

/* TYPING PREVIEW BUTTON */
.typing-preview-btn {
  flex-shrink: 0;
}

/* ŠTÝL PRE TEXTOVÉ POLE */
.chat-input {
  border-radius: 15px;
  background-color: white;
  padding: 6px 12px;
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
