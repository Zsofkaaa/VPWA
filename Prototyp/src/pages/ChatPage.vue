<template>
  <q-page class="chat-page">
    <!-- ChatMessages komponens betöltése -->
    <ChatMessages />
  </q-page>
</template>

<script lang="ts" setup>
import ChatMessages from 'components/ChatMessages.vue'
</script>

<style>
.chat-page {
  background-color: #1E1E1E;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
