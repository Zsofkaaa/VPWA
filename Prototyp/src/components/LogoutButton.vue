<template>
  <div class="logout-container">
    <q-btn
      flat
      color="red"
      icon="logout"
      label="Log Out"
      class="logout-btn"
      @click="onLogout"
    />
  </div>
</template>

<script lang="ts" setup>
const emit = defineEmits<{ logout: [] }>()

function onLogout() {
  emit('logout')
}
</script>

<style scoped>
.logout-container {
  position: fixed;
  bottom: 10px;
  left: 20px;
  z-index: 2200;
}

.logout-btn {
  font-weight: bold;
  text-transform: none;
  background-color: rgba(255, 0, 0, 0.15);
  border-radius: 10px;
  transition: background-color 0.2s ease;
}

.logout-btn:hover {
  background-color: rgba(255, 0, 0, 0.3);
}
</style>
