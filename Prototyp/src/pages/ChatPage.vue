<template>
  <q-page class="chat-page">
    <ChatMessages ref="chatMessagesRef" :messages="messages" />
  </q-page>
</template>



<script lang="ts" setup>
import ChatMessages from 'components/ChatMessages.vue'
import { inject, type Ref, shallowRef } from 'vue'

interface Message {
  id: number
  user: string
  text: string
}

const messages = inject<Ref<Message[]>>('messages')!
if (!messages) throw new Error('messages not provided!')

const chatMessagesRef = shallowRef<InstanceType<typeof ChatMessages>>()

defineExpose({ chatMessagesRef })

</script>



<style>
.chat-page {
  background-color: #1E1E1E;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
