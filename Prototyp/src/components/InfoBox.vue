<!-- 
  ============================================================================
  COMPONENT: InfoBox.vue
  ============================================================================
  
  PURPOSE:
  A small "info" button that shows a list of available chat commands when clicked.
  
  WHAT IT DISPLAYS:
  - An info icon button in the header
  - When clicked: A dropdown showing 8 different chat commands
  
  HOW IT WORKS:
  - User clicks the info button
  - A popup appears below the button showing all commands
  - The popup stays open until user clicks outside it
  - The popup won't close if you click inside it (intentional)
  
  AVAILABLE COMMANDS SHOWN:
  1. /join channelName [private] - Create a private channel
  2. /join channelName - Join a public channel when channel exists, create if not
  3. /invite nickName - Invite someone to a channel
  4. /revoke nickName - Remove someone's access from private channel
  5. /kick nickName - Remove someone from a channel
  6. /quit - Close a channel
  7. /cancel - Leave channel, or if admin terminate channel
  8. /list - List all members
  
  ============================================================================
-->

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
  background: rgb(109, 89, 122);
  color: white;
  padding: 10px;
}

.info-line {
  padding: 4px 0;
  font-size: 0.95rem;
}
</style>