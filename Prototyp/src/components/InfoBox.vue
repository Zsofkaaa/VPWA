<template>
  <!-- Info icon button -->
  <q-btn flat round dense icon="info" class="text-white info-btn">
    <!-- Tooltip when hovering -->
    <q-tooltip anchor="top middle" self="bottom middle">
      Commands
    </q-tooltip>

    <!-- Popover that stays open when clicked -->
    <q-menu :auto-close="false" anchor="bottom middle" self="top middle" transition-show="jump-down" transition-hide="jump-up">
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

<style scoped>
.q-btn {
  background-color: transparent; 
  width: 36px;
  height: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.q-menu {
  background: transparent;
  min-width: 220px;
}

.info-box-container {
  background: #355070;
  color: white;
  padding: 10px;
}

.info-line {
  padding: 4px 0;
  font-size: 0.95rem;
}
</style>