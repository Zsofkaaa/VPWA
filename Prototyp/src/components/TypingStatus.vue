<template>
  <div class="typing-status-fixed" :style="typingStatusStyle">
    User 1 is typing...
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  typingStatusStyle: Record<string, string | number>
}>()
</script>

<style scoped>
.typing-status-fixed {
  background: transparent;
}
</style>