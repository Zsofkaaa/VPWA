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

    <!-- Rozbaľovacie menu so zoznamom akcií -->
    <q-menu
      v-model="menu"
      anchor="bottom left"
      self="top left"
      :offset="[0, 4]"
    >
      <!-- Zoznam akcií v menu -->
      <q-list style="min-width: 200px; background-color: #2d4a6b; color: white;">

        <!-- Pridať používateľa -->
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

        <!-- Vyhodiť používateľa -->
        <q-item clickable v-ripple @click="openKickUserDialog">
          <q-item-section avatar>
            <q-icon name="sports_martial_arts" color="white" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Kick User</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator dark />

        <!-- Zablokovať používateľa (iba admin) -->
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

        <!-- Spravovať notifikácie -->
        <q-item clickable v-ripple @click="manageNotifications">
          <q-item-section avatar>
            <q-icon name="notifications" color="white" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Manage Notifications</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator dark />

        <!-- Zrušiť kanál (iba admin) -->
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

        <!-- Opustiť kanál (csak member) -->
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

      <AddUserDialog
        :visible="showAddUserDialog"
        :channel-id="props.channel.id"
        :current-members="currentChannelMembers"
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

  </div>
</template>



<script lang="ts" setup>
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { ref , computed } from 'vue'
import AddUserDialog from './AddUserDialog.vue'
import KickUserDialog from './KickUserDialog.vue'
import BanUserDialog from './BanUserDialog.vue'

interface Member {
  userId: number
  username: string
}

interface User {
  id: number
  nickName: string
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

const showAddUserDialog = ref(false)
const showKickUserDialog = ref(false)
const showBanUserDialog = ref(false)

const currentChannelMembers = ref<number[]>([])

// Teljes Member lista a Kick/Ban dialógokhoz
const currentMembers = ref<Member[]>([])

// MappedMembers: User[] típus a dialogokhoz
const mappedMembers = computed<User[]>(() =>
  currentMembers.value.map(m => ({ id: m.userId, nickName: m.username }))
)

// Premenná, ktorá určuje, či je menu otvorené
const menu = ref(false)

const emit = defineEmits<{
  'leftChannel': [channelId: number]
}>()

function openAddUserDialog() {
  menu.value = false
  // Backendből is lekérheted a csatorna tagjait, vagy props.channel.members
  currentChannelMembers.value = props.channel.members?.map(m => m.userId) || []
  showAddUserDialog.value = true
}

function openKickUserDialog() {
  menu.value = false
  currentMembers.value = props.channel.members ? [...props.channel.members] : []
  showKickUserDialog.value = true
}

function openBanUserDialog() {
  menu.value = false
  currentMembers.value = props.channel.members ? [...props.channel.members] : []
  showBanUserDialog.value = true
}

// Funkcia na pridanie používateľa
async function addUsers(userIds: number[]) {
  const token = localStorage.getItem('auth_token')
  try {
    for (const userId of userIds) {
      await axios.post(
        `http://localhost:3333/user_channel`,
        {
          channelId: props.channel.id,
          userId,
          role: 'member',
          notificationSettings: 'all'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    }
    $q.notify({ type: 'positive', message: 'Users added successfully' })
    showAddUserDialog.value = false
  } catch (err) {
    console.error('Failed to add users', err)
    $q.notify({ type: 'negative', message: 'Failed to add users' })
  }
}

// --- Felhasználók Kick / Ban műveletei
async function kickUsers(userIds: number[]) {
  const token = localStorage.getItem('auth_token')
  try {
    for (const userId of userIds) {
      await axios.delete(`http://localhost:3333/channels/${props.channel.id}/kick/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    }
    $q.notify({ type: 'positive', message: 'Users kicked' })
    showKickUserDialog.value = false
  } catch (err) {
    console.error('Kick failed', err)
    $q.notify({ type: 'negative', message: 'Failed to kick users' })
  }
}

async function banUsers(userIds: number[]) {
  const token = localStorage.getItem('auth_token')
  try {
    for (const userId of userIds) {
      await axios.post(`http://localhost:3333/channels/${props.channel.id}/ban/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
    }
    $q.notify({ type: 'positive', message: 'Users banned' })
    showBanUserDialog.value = false
  } catch (err) {
    console.error('Ban failed', err)
    $q.notify({ type: 'negative', message: 'Failed to ban users' })
  }
}

// Funkcia na správu notifikácií
function manageNotifications() {
  menu.value = false
  console.log('Manage notifications clicked')
}

// Funkcia na vymazanie kanála
async function terminateChannel() {
  menu.value = false

  const token = localStorage.getItem('auth_token')

  try {
    await axios.delete(`http://localhost:3333/channels/${props.channel.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    $q.notify({
      type: 'positive',
      message: 'Channel terminated',
      position: 'top'
    })

    // Parent komponensnek szólunk, hogy törölje a listából
    emit('leftChannel', props.channel.id)

    // Redirect
    await router.push('/chat')

  } catch (err) {
    console.error('Terminate failed:', err)
    $q.notify({
      type: 'negative',
      message: 'Failed to terminate channel'
    })
  }
}

// Funkcia na opustenie kanála
async function leaveChannel() {
  menu.value = false

  const token = localStorage.getItem('auth_token')

  try {
    await axios.delete(`http://localhost:3333/channels/${props.channel.id}/leave`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    $q.notify({
      type: 'positive',
      message: 'You left the channel',
      position: 'top'
    })

    emit('leftChannel', props.channel.id)

    await router.push('/chat')

  } catch (err) {
    console.error('Leave failed:', err)
    $q.notify({ type: 'negative',
    message: 'Failed to leave channel' })
  }
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
