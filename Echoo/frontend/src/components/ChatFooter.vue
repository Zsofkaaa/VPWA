<template>
  <footer
    class="chat-footer row items-center q-pa-sm"
    :style="footerStyle"
  >
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
  </footer>
</template>



<script lang="ts" setup>
defineProps<{
  newMessage: string
  footerStyle: Record<string, string | number>
}>()

const emit = defineEmits<{
  'update:newMessage': [value: string | number | null]
  'enterPress': [event: KeyboardEvent]
  'typing': []
  'typingContent': [content: string]
}>()

function handleInput(value: string | number | null) {
  console.log('[CHATFOOTER] 🔥 Input triggered! Emitting typing event...') // DEBUG
  emit('update:newMessage', value)
  emit('typing')
  //console.log('[CHATFOOTER] ✅ Typing event emitted!')
  emit('typingContent', String(value || ''))
}
</script>



<style>

/* HLAVNÝ šTÝL FOOTERA */
.chat-footer {
  z-index: 2100;
  background-color: #1E1E1E;
  height: 80px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  position: relative;
  border-top: 1px solid #333;
  flex-shrink: 0;
}

/* šTÝL PRE TEXTOVÉ POLE */
.chat-input {
  border-radius: 15px;
  background-color: white;
  padding: 6px 12px;
}
</style>
