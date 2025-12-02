<template>
  <div class="typing-status" :style="typingStatusStyle">
    {{ typingUser ? `${typingUser} is typing...` : 'Someone is typing...' }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  typingUser?: string | null
  typingStatusStyle: Record<string, string | number>
}>()
</script>

<style scoped>
.typing-status {
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  color: white;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 14px;
  width: fit-content;
  max-width: 90%;
  white-space: nowrap;
  margin-left: 15px;
}
</style>
