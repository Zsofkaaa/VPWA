<template>
  <!-- Hlavný obal pre menu -->
  <div class="manage-wrapper">
    <!-- Tlačidlo na otvorenie menu správy kanála -->
    <q-btn
      flat
      dense
      label="Manage Channel"
      color="white"
      @click.stop="menu = !menu"
      class="manage-btn"
    />

    <!-- Rozbaľovacie menu -->
    <q-menu
      v-model="menu"
      anchor="bottom left"
      self="top left"
      :offset="[0, 4]"
    >
      <q-list style="min-width: 200px; background-color: #2d4a6b; color: white;">

        <!-- Add User (len admin alebo public channel) -->
        <q-item
          v-if="!(props.channel.type === 'private' && props.userRole !== 'admin')"
          clickable
          v-ripple
          @click="openAddUserDialog"
        >
          <q-item-section avatar>
            <q-icon name="person_add" color="white" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add User</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator v-if="!(props.channel.type === 'private' && props.userRole !== 'admin')" dark />

        <!-- Kick User -->
        <q-item
          v-if="props.userRole === 'member'"
          clickable
          v-ripple
          @click="openKickUserDialog"
        >
          <q-item-section avatar>
            <q-icon name="sports_martial_arts" color="white" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Kick User</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator v-if="props.userRole === 'member'" dark />

        <!-- Ban User (len admin) -->
        <q-item
          v-if="props.userRole === 'admin'"
          clickable
          v-ripple
          @click="openBanUserDialog"
        >
          <q-item-section avatar>
            <q-icon name="no_accounts" color="white" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Ban User</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator v-if="props.userRole === 'admin'" dark />

        <!-- Notification Settings -->
        <q-item clickable v-ripple @click="openNotificationSettings">
          <q-item-section avatar>
            <q-icon name="notifications" color="white" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Manage Notifications</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator dark />

        <!-- Terminate Channel (len admin) -->
        <q-item
          v-if="props.userRole === 'admin'"
          clickable
          v-ripple
          @click="terminateChannel"
        >
          <q-item-section avatar>
            <q-icon name="highlight_off" color="white" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Terminate Channel</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator v-if="props.userRole === 'admin'" dark />

        <!-- Leave Channel (len member) -->
        <q-item
          v-if="props.userRole === 'member'"
          clickable
          v-ripple
          @click="leaveChannel"
        >
          <q-item-section avatar>
            <q-icon name="exit_to_app" color="white" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Leave Channel</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>

    <!-- Dialogy -->
    <AddUserDialog
      :visible="showAddUserDialog"
      :channel-id="props.channel.id"
      :available-users="availableUsers"
      :current-members="props.channel.members?.map(m => m.userId) || []"
      @update:visible="showAddUserDialog = $event"
      @add-users="addUsers"
    />

    <KickUserDialog
      :visible="showKickUserDialog"
      :channel-id="props.channel.id"
      :members="mappedMembers"
      @update:visible="showKickUserDialog = $event"
      @kick-users="kickUsers"
    />

    <BanUserDialog
      :visible="showBanUserDialog"
      :channel-id="props.channel.id"
      :members="mappedMembers"
      @update:visible="showBanUserDialog = $event"
      @ban-users="banUsers"
    />

    <NotificationSettingsDialog
      :visible="showNotificationDialog"
      :channel-id="props.channel.id"
      :current-setting="currentNotificationSetting"
      @save="handleNotificationSettingsSaved"
      @update:visible="showNotificationDialog = $event"
    />
  </div>
</template>



<script lang="ts" setup>
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { ref, computed, onMounted } from 'vue'
import AddUserDialog from './AddUserDialog.vue'
import KickUserDialog from './KickUserDialog.vue'
import BanUserDialog from './BanUserDialog.vue'
import NotificationSettingsDialog from './NotificationSettingsDialog.vue'

// Typy
interface Member {
  userId: number
  username: string
}

interface User {
  id: number
  nickName: string
  role: 'admin' | 'member'
}

interface AxiosErrorLike {
  response?: {
    data?: {
      error?: string
    }
  }
}
const props = defineProps<{
  channel: {
    id: number
    name: string
    type: 'private' | 'public'
    members?: Member[] | undefined
  }
  userRole: 'admin' | 'member'
}>()

const router = useRouter()
const $q = useQuasar()
const API_URL = 'http://localhost:3333'
const token = localStorage.getItem('auth_token')

// Dialogy
const showAddUserDialog = ref(false)
const showKickUserDialog = ref(false)
const showBanUserDialog = ref(false)
const showNotificationDialog = ref(false)

// Stav
const availableUsers = ref<{ label: string; value: number }[]>([])
const currentUserId = ref<number | null>(null)
const currentNotificationSetting = ref('all')
const channelMembers = ref<User[]>([])
const menu = ref(false)

// Emit
const emit = defineEmits<{
  'leftChannel': [channelId: number]
  'notification-setting-changed': [channelId: number, newSetting: string]
}>()

// Computed members pre Kick/Ban dialog
const mappedMembers = computed(() =>
  channelMembers.value.map(user => ({ id: user.id, nickName: user.nickName }))
)

// Lifecycle
onMounted(async () => {
  await loadCurrentUser()
  await loadNotificationSettings()
})

/* MENU ACTIONS */
function openAddUserDialog() {
  menu.value = false
  void loadAvailableUsers(props.channel.id)
  showAddUserDialog.value = true
}

async function openKickUserDialog() {
  menu.value = false
  await loadChannelMembers()
  if (!channelMembers.value.length) {
    return $q.notify({ type: 'warning', message: 'No one to kick', position: 'top' })
  }
  showKickUserDialog.value = true
}

async function openBanUserDialog() {
  menu.value = false
  await loadChannelMembers()
  if (!channelMembers.value.length) {
    return $q.notify({ type: 'warning', message: 'No one to ban', position: 'top' })
  }
  showBanUserDialog.value = true
}

function openNotificationSettings() {
  menu.value = false
  showNotificationDialog.value = true
}

function handleNotificationSettingsSaved(newSetting: string) {
  currentNotificationSetting.value = newSetting
  emit('notification-setting-changed', props.channel.id, newSetting)
}

/* API HELPERS */
async function loadCurrentUser() {
  try {
    const res = await axios.get<{ id: number; nickName: string }>(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } })
    currentUserId.value = res.data.id
  } catch (err) { console.error('Failed to load current user', err) }
}

async function loadNotificationSettings() {
  if (!currentUserId.value) return
  try {
    const res = await axios.get<{ notificationSettings: string }>(
      `${API_URL}/user_channel/${currentUserId.value}/${props.channel.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    currentNotificationSetting.value = res.data.notificationSettings || 'all'
  } catch (err) { console.error('Failed to load notification settings', err) }
}

async function loadChannelMembers() {
  if (!props.channel.id) return
  if (!currentUserId.value) await loadCurrentUser()
  try {
    const res = await axios.get<User[]>(`${API_URL}/channels/${props.channel.id}/members`, { headers: { Authorization: `Bearer ${token}` } })
    channelMembers.value = res.data.filter(u => u.id !== currentUserId.value && u.role !== 'admin')
  } catch (err) { console.error('Failed to load channel members', err) }
}

async function loadAvailableUsers(channelId: number) {
  try {
    const allUsers = (await axios.get<User[]>(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } })).data
    const channelUsers = (await axios.get<User[]>(`${API_URL}/channels/${channelId}/members`, { headers: { Authorization: `Bearer ${token}` } })).data
    availableUsers.value = allUsers
      .filter(u => u.id !== currentUserId.value && !channelUsers.some(m => m.id === u.id))
      .map(u => ({ label: u.nickName, value: u.id }))
  } catch (err) { console.error('Failed to load available users', err) }
}

/* USER ACTIONS */
async function addUsers(userIds: number[]) {
  try {
    for (const userId of userIds) {
      await axios.post(
        `${API_URL}/channels/${props.channel.id}/invite`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    }

    $q.notify({ type: 'positive', message: 'Invite(s) sent successfully' })
    showAddUserDialog.value = false

  } catch {
    $q.notify({
      type: 'negative',
      message: 'Invite failed'
    })
  }
}

async function kickUsers(userIds: number[]) {
  if (!currentUserId.value) await loadCurrentUser()

  for (const userId of userIds) {
    try {
      const res = await axios.delete<{ message?: string; error?: string }>(
        `${API_URL}/channels/${props.channel.id}/kick/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (res.data.message) {
        $q.notify({ type: 'positive', message: res.data.message })
      }
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const errorData = (err as AxiosErrorLike).response?.data
        if (errorData?.error === 'You already kicked this user') {
          $q.notify({ type: 'warning', message: 'You already kicked this user' })
        } else {
          console.error('Kick failed', err)
          $q.notify({ type: 'negative', message: 'Failed to kick user' })
        }
      } else {
        console.error('Kick failed', err)
        $q.notify({ type: 'negative', message: 'Failed to kick user' })
      }
    }
  }

  showKickUserDialog.value = false
  await loadChannelMembers()
}

async function banUsers(userIds: number[]) {
  try {
    for (const userId of userIds) {
      await axios.delete(`${API_URL}/channels/${props.channel.id}/ban/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
    }
    $q.notify({ type: 'positive', message: 'User(s) banned successfully' })
    showBanUserDialog.value = false
  } catch (err) { console.error('Ban failed', err); $q.notify({ type: 'negative', message: 'Failed to ban users' }) }
}

async function terminateChannel() {
  menu.value = false
  try {
    await axios.delete(`${API_URL}/channels/${props.channel.id}`, { headers: { Authorization: `Bearer ${token}` } })
    $q.notify({ type: 'positive', message: 'Channel terminated', position: 'top' })
    emit('leftChannel', props.channel.id)
    await router.push('/chat')
  } catch (err) { console.error('Terminate failed', err); $q.notify({ type: 'negative', message: 'Failed to terminate channel' }) }
}

async function leaveChannel() {
  menu.value = false
  try {
    await axios.delete(`${API_URL}/channels/${props.channel.id}/leave`, { headers: { Authorization: `Bearer ${token}` } })
    $q.notify({ type: 'positive', message: 'You left the channel', position: 'top' })
    emit('leftChannel', props.channel.id)
    await router.push('/chat')
  } catch (err) { console.error('Leave failed', err); $q.notify({ type: 'negative', message: 'Failed to leave channel' }) }
}
</script>



<style scoped>
/* Obal pre menu */
.manage-wrapper {
  width: 100%;
  padding: 4px 8px;
  z-index: 1000;
}

/* Štýl tlačidla Manage Channel */
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

/* Efekt pri prechode myšou cez tlačidlo */
.manage-btn:hover {
  background-color: rgba(255, 255, 255, 0.15) !important;
}

/* Položky v menu */
.q-list .q-item {
  padding: 10px 16px;
}

/* Zvýraznenie položky pri prechode kurzorom */
.q-list .q-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
