<template>
  <q-page class="q-pa-md relative-position" style="min-height: 100vh; display: flex; flex-direction: column;">
    <div class="chat-messages" style="flex: 1; overflow-y: auto; padding-bottom: 80px;">
      <div v-for="n in 3" :key="n" class="q-mb-md">
        <div class="text-bold">User {{ n }}</div>
        <div class="bg-grey-9 q-pa-sm q-mt-xs" style="border-radius: 8px;">
          Message {{ n }} ...
        </div>
      </div>
    </div>

    <!-- Test Notification -->
    <NotificationPopUp
      :sender="'Name of sender'"
      :message="'Message of the sender'"
      :logo="'/pictures/logo.jpg'"
      :visible="true"
    />
  </q-page>
</template>



<script lang="ts" setup>
import NotificationPopUp from 'components/NotificationPopUp.vue'
</script>
