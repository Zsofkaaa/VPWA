<template>

  <!-- HLAVNÁ TRANSITION PRE ANIMÁCIU -->
  <transition name="slide-up">

    <!-- NOTIFIKAČNÉ OKNO -->
    <div v-if="visible" class="notification-popup">

      <!-- HLAVIČKA -->
      <div class="header">
        <span class="sender">{{ sender }}</span>
        <img class="logo" :src="logo" alt="app logo" />
      </div>

      <!-- TEXT SPRÁVY -->
      <div class="message-box">
        {{ shortMessage }}
      </div>

    </div>

  </transition>

</template>



<script lang="ts" setup>
import { computed, toRefs } from 'vue'

/* ÚDAJE, KTORÉ PRICHÁDZAJÚ DO NOTIFIKÁCIE */
const props = defineProps<{
  sender: string
  message: string
  logo: string
  visible: boolean
}>()

/* PREVOD NA REAKTÍVNE PREMENNÉ */
const { sender, message, logo, visible } = toRefs(props)

// Skrátenie správy na 100 znakov + "..."
const shortMessage = computed(() => {
  if (message.value.length > 100) {
    return message.value.substring(0, 100) + '...'
  }
  return message.value
})
</script>

<style scoped>

/* HLAVNÝ KONTEJNER NOTIFIKÁCIE */
.notification-popup {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  background: #283C55;
  color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  overflow: hidden;
  font-family: sans-serif;
  padding: 16px;
  z-index: 9999;
}

/* HLAVIČKA NOTIFIKÁCIE */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: bold;
}

/* MENO ODOSELATEĽA */
.sender {
  color: #e0e6f0;
}

/* LOGO APLIKÁCIE */
.logo {
  width: 40px;
  height: 40px;
  border-radius: 20%;
  object-fit: cover;
  border: 3px solid lightgray;
}

/* BOX PRE SPRÁVU */
.message-box {
  background: white;
  color: black;
  padding: 16px;
  border-radius: 8px;
  font-weight: bold;
  width: 100%;
  display: inline-block; /* alebo block */
  min-height: 0;         /* odstráni fixnú výšku */
  word-break: break-word; /* aby sa text zalomil */
}

/* ANIMÁCIA SLIDE-UP */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

</style>
