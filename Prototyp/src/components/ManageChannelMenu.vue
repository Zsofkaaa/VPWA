<template>
  <div class="manage-wrapper">
    <q-btn
      flat
      dense
      label="Manage Channel"
      color="white"
      @click.stop="menu = !menu"
      class="manage-btn"
    />

    <q-menu
      v-model="menu"
      anchor="bottom left"
      self="top left"
      :offset="[0, 4]"
    >
      <q-list style="min-width: 200px; background-color: #2d4a6b; color: white;">
        <q-item clickable v-ripple @click="addUser">
          <q-item-section avatar>
            <q-icon name="person_add" color="white" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add User</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator dark />

        <q-item clickable v-ripple @click="removeUser">
          <q-item-section avatar>
            <q-icon name="person_remove" color="white" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Remove User</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator dark />

        <q-item clickable v-ripple @click="managePermissions">
          <q-item-section avatar>
            <q-icon name="security" color="white" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Manage Permissions</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator dark />

        <q-item clickable v-ripple @click="manageNotifications">
          <q-item-section avatar>
            <q-icon name="notifications" color="white" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Manage Notifications</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator dark />

        <q-item clickable v-ripple @click="terminateChannel">
            <q-item-section avatar>
              <q-icon name="highlight_off" color="white" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Terminate Channel</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator dark />

          <!-- Leave Channel -->
          <q-item clickable v-ripple @click="leaveChannel">
            <q-item-section avatar>
              <q-icon name="exit_to_app" color="white" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Leave Channel</q-item-label>
            </q-item-section>
          </q-item>
      </q-list>
    </q-menu>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const menu = ref(false)

function addUser() {
  menu.value = false
  console.log('Add user clicked')
  // TODO: Implement add user dialog/functionality
}

function removeUser() {
  menu.value = false
  console.log('Remove user clicked')
  // TODO: Implement remove user dialog/functionality
}

function managePermissions() {
  menu.value = false
  console.log('Manage permissions clicked')
  // TODO: Implement permissions management dialog/functionality
}

function manageNotifications() {
  menu.value = false
  console.log('Manage notifications clicked')
  // TODO: Implement notifications management dialog/functionality
}

function terminateChannel() {
  menu.value = false
  console.log('Terminate channel clicked')
  // TODO: Implement terminate channel functionality
}

function leaveChannel() {
  menu.value = false
  console.log('Leave channel clicked')
  // TODO: Implement leave channel functionality
}

</script>

<style scoped>
.manage-wrapper {
  width: 100%;
  padding: 4px 8px;
  z-index: 1000;
}

.manage-btn {
  width: 100%;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 500;
  color: white !important;
  background-color: rgba(255, 255, 255, 0.05) !important;
  border-radius: 6px;
  padding: 6px 12px;
}

.manage-btn:hover {
  background-color: rgba(255, 255, 255, 0.15) !important;
}

.q-list .q-item {
  padding: 10px 16px;
}

.q-list .q-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
