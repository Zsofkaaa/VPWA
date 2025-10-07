<template>
  <transition name="slide-up">
    <div v-if="visible" class="notification-popup">
      <div class="header">
        <span class="sender">Name of the sender</span>
        <img class="logo" src="/pictures/logo.jpg" alt="app logo" />
      </div>
      <div class="message-box">
        <!-- {{ message }} -->
          Message of the sender
      </div>
    </div>
  </transition>
</template>



<script lang="ts" setup>
interface Props {
  sender: string
  message: string
  logo: string
  visible: boolean
}
defineProps<Props>()
</script>



<style scoped>
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
  z-index: 3000;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: bold;
}

.sender {
  color: #e0e6f0;
}

.logo {
  width: 40px;
  height: 40px;
  border-radius: 20%;
  object-fit: cover;
  border: 3px solid lightgray;
}

.message-box {
  background: white;
  color: black;
  padding: 16px;
  border-radius: 8px;
  font-weight: bold;
  width: 100%;
  min-height: 100px;
  display: flex;
}

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
