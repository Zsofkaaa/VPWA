<template>
  <!-- Gear icon button -->
  <q-btn flat round dense icon="settings">
    <!-- Tooltip when hovering -->
    <q-tooltip anchor="top middle" self="bottom middle">
      Settings
    </q-tooltip>

    <!-- Dropdown menu -->
    <q-menu transition-show="jump-down" transition-hide="jump-up">
      <div class="menu-container">
        <div class="menu-header">Settings</div>
        <q-separator color="white" />
        <q-list dense>
          <q-item clickable v-ripple>
            <q-item-section>Setting 1</q-item-section>
          </q-item>
          <q-item clickable v-ripple>
            <q-item-section>Setting 2</q-item-section>
          </q-item>
          <q-item clickable v-ripple>
            <q-item-section>Setting 3</q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-menu>
  </q-btn>
</template>

<script lang="ts" setup>
/* fully self-contained settings dropdown */
</script>

<style scoped>
.menu-container {
  background: rgba(40, 60, 85, 0.95);
  color: white;
  min-width: 200px;
}

.menu-header {
  background-color: rgba(30, 45, 65, 0.9);
  font-weight: 600;
  text-align: center;
  padding: 10px 0;
}

.q-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
