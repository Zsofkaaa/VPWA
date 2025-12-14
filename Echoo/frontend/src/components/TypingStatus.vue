<template>
  <div class="typing-status" :style="typingStatusStyle">
    <div class="typing-text">
      {{ getTypingText() }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TypingUser } from '@/types';

const props = defineProps<{
  typingUsers: TypingUser[]
  typingStatusStyle: Record<string, string | number>
}>()

// Vráti text podľa počtu používateľov, ktorí práve píšu
function getTypingText() {
  const count = props.typingUsers.length

  if (count === 0) return ''
  if (count > 3) return 'More than 3 people are typing...'

  const users = props.typingUsers.map(u => u.user)

  if (count === 1) return `${users[0]} is typing...`
  if (count === 2) return `${users[0]} and ${users[1]} are typing...`
  if (count === 3) return `${users[0]}, ${users[1]} and ${users[2]} are typing...`

  return ''
}
</script>

<style scoped>
.typing-status {
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  color: white;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 14px;
  width: fit-content;
  max-width: 90%;
  margin-left: 15px;
}

.typing-text {
  font-style: italic;
  color: #aaa;
}
</style>
