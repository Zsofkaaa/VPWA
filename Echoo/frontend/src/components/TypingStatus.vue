<template>
  <div class="typing-status" :style="typingStatusStyle">
    <div class="typing-header">
      {{ typingUser ? `${typingUser} is typing...` : 'Someone is typing...' }}
    </div>
    <div v-if="typingContent" class="typing-preview">
      "{{ typingContent }}"
    </div>
  </div>
</template>



<script setup lang="ts">
defineProps<{
  typingUser?: string | null
  typingContent?: string // ⬅️ ÚJ
  typingStatusStyle: Record<string, string | number>
}>()
</script>



<style scoped>
.typing-status {
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  color: white;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 14px;
  width: fit-content;
  max-width: 90%;
  margin-left: 15px;
}

.typing-header {
  font-style: italic;
  margin-bottom: 4px;
}

.typing-preview {
  color: #aaa;
  font-size: 13px;
  font-style: normal;
  margin-top: 6px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  max-height: 100px;
  overflow-y: auto;
  word-break: break-word;
}
</style>
