<template>
  <!-- Kontajner pre tlačidlo odhlásenia -->
  <div class="logout-container">
    <!-- Tlačidlo na odhlásenie -->
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
// Udalosť, ktorú komponent emituje po kliknutí na odhlásenie
const emit = defineEmits<{ logout: [] }>()

// Po kliknutí oznámi rodičovi, že sa má vykonať odhlásenie
function onLogout() {
  emit('logout')
}
</script>



<style scoped>
/* Umiestnenie tlačidla v ľavom dolnom rohu */
.logout-container {
  position: fixed;
  bottom: 10px;
  left: 20px;
  z-index: 2200;
}

/* Vzhľad tlačidla odhlásenia a jeho hover efekt */
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
