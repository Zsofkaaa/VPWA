<template>
  <!-- Info icon button -->
  <q-btn flat round dense class="text-white info-btn">
    <q-icon name="info" />

    <!-- Popover that stays open when clicked -->
    <q-menu
      v-model="open"
      :auto-close="false"
      anchor="bottom middle"
      self="top middle"
      transition-show="jump-down"
      transition-hide="jump-up"
      class="info-box-menu"
    >
      <div class="info-box-container" @click.stop>
        <div class="info-line">/join channelName [private]</div>
        <div class="info-line">/join channelName</div>
        <div class="info-line">/invite nickName</div>
        <div class="info-line">/revoke nickName</div>
        <div class="info-line">/kick nickName</div>
        <div class="info-line">/quit</div>
        <div class="info-line">/cancel</div>
        <div class="info-line">/list</div>
      </div>
    </q-menu>
  </q-btn>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const open = ref(false)
</script>

<style scoped>
.info-btn {
  background-color: transparent; 
  width: 36px;
  height: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-btn:hover {
  background-color: rgba(255, 255, 255, 0.1); 
}

.info-box-menu {
  background: transparent;
  min-width: 220px;
}

.info-box-container {
  background: rgba(40, 60, 85, 0.95);
  color: white;
  padding: 10px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.6);
  user-select: none;
}

.info-line {
  padding: 4px 0;
  font-size: 0.95rem;
  pointer-events: none; /* sorok ne legyenek klikkelhetők */
}
</style>
