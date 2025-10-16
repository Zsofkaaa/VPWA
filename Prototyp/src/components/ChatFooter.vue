<template>
  <footer
    class="chat-footer row items-center q-pa-sm"
    :style="footerStyle"
  >
    <q-input
      :model-value="newMessage"
      @update:model-value="$emit('update:newMessage', $event)"
      placeholder="Start writing..."
      class="col chat-input"
      dense
      outlined
      borderless
      @keydown="$emit('enterPress', $event)"
    />
  </footer>
</template>

<script lang="ts" setup>
defineProps<{
  newMessage: string
  footerStyle: Record<string, string | number>
}>()

defineEmits<{
  'update:newMessage': [value: string | number | null]
  'enterPress': [event: KeyboardEvent]
}>()
</script>

<style scoped>
.chat-footer {
  z-index: 2100;
}

.chat-input {
  border-radius: 15px;
  background-color: white;
  padding: 6px 12px;
}
</style>