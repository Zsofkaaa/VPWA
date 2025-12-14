<template>
  <!-- SIDEBAR HLAVNÝ KONTEJNER -->
  <q-drawer
    :model-value="drawerOpen"
    @update:model-value="$emit('update:drawerOpen', $event)"
    show-if-above
    side="left"
    bordered
    bg-color="#355070"
    class="sidebar"
  >

    <!-- ZÁHLAVIE: CHANNELS + ADD BUTTON -->
    <div class="sidebar-title-wrapper q-pa-md row items-center justify-between">
      <div class="text-bold sidebar-title">CHANNELS</div>

      <q-btn
        flat dense round icon="add" color="white"
        @click="showAddChannelDialog = true"
        class="add-channel-btn" size="sm"
      >
        <q-tooltip v-if="$q.screen.gt.sm" anchor="top middle" self="bottom middle">
          Add Channel
        </q-tooltip>
      </q-btn>
    </div>

    <!-- SCROLLOVATEĽNÁ ČASŤ SIDEBARU -->
    <div class="sidebar-scrollable">

      <!-- POZVÁNKY -->
      <div class="sidebar-divider"></div>
      <div class="q-pa-sm sidebar-subtitle">Invites</div>

      <div class="channel-list">
        <div v-for="invite in props.invites" :key="invite.id" class="channel-wrapper">
          <q-item clickable @click="openInviteDialog(invite)" class="sidebar-item active-invite">
            <q-item-section>{{ invite.channel.name }}</q-item-section>
            <div class="invite-badge"></div>
          </q-item>
        </div>
      </div>

      <!-- PRIVÁTNE KANÁLY -->
      <div class="sidebar-divider"></div>
      <div class="q-pa-sm sidebar-subtitle">Private Channels</div>

      <div class="channel-list">
        <div v-for="ch in props.privateChannels" :key="ch.id" class="channel-wrapper">
          <q-item
            clickable
            @click="selectChannel(ch)"
            :class="['sidebar-item', { 'active-channel': ch.path === props.activeChannelPath }]"
          >
            <q-item-section>{{ ch.name }}</q-item-section>
            <div>{{ ch.role }}</div>
          </q-item>

          <ManageChannelMenu
            v-if="ch.path === props.activeChannelPath && ch.role"
            :channel="{ id: ch.id, name: ch.name, type: ch.type, members: ch.members }"
            :userRole="ch.role"
            @leftChannel="handleLeftChannel"
            @notification-setting-changed="handleNotificationSettingChanged"
          />
        </div>
      </div>

      <!-- PUBLIC CHANNELS -->
      <div class="sidebar-divider"></div>
      <div class="q-pa-sm sidebar-subtitle">Public Channels</div>

      <div class="channel-list">
        <div v-for="ch in props.publicChannels" :key="ch.id" class="channel-wrapper">
          <q-item
            clickable
            @click="selectChannel(ch)"
            :class="['sidebar-item', { 'active-channel': ch.path === props.activeChannelPath }]"
          >
            <q-item-section>{{ ch.name }}</q-item-section>
            <div>{{ ch.role }}</div>
          </q-item>

          <ManageChannelMenu
            v-if="ch.path === props.activeChannelPath && ch.role"
            :channel="{ id: ch.id, name: ch.name, type: ch.type, members: ch.members }"
            :userRole="ch.role"
            @leftChannel="handleLeftChannel"
            @notification-setting-changed="handleNotificationSettingChanged"
          />
        </div>
      </div>

      <div style="height: 80px;"></div>
    </div>

    <!-- LOGOUT -->
    <div class="logout-wrapper">
      <q-btn
        flat color="red" icon="logout" label="Log Out"
        class="logout-btn"
        @click="$emit('logout')"
      />
    </div>

    <!-- ADD CHANNEL DIALOG -->
    <AddChannelDialog
      v-model:visible="showAddChannelDialog"
      :existing-channels="allChannelNames"
      @create="handleCreateChannel"
    />

    <!-- INVITE DIALOG -->
    <q-dialog v-model="inviteDialog" persistent>
      <q-card style="width: 300px; background-color: #355070; color: white;">
        <q-card-section class="text-h6 text-center q-pt-md">
          Join Channel?
        </q-card-section>

        <q-card-section class="q-pt-none text-center">
          You have been invited to <strong>{{ selectedInvite?.channel?.name }}</strong>
        </q-card-section>

        <q-card-actions align="center">
          <q-btn flat label="Accept" color="white" @click="acceptInvite" />
          <q-btn flat label="Reject" color="white" @click="rejectInvite" />
          <q-btn flat label="Cancel" color="white" @click="inviteDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-drawer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import ManageChannelMenu from './ManageChannelMenu.vue'
import AddChannelDialog from './AddChannelDialog.vue'
import { useQuasar } from 'quasar'
import type { Invite, ChannelData, Channel } from '@/types'
import API_URL from '../config/api'

/* PROPS */
const props = defineProps<{
  drawerOpen: boolean
  privateChannels: Channel[]
  publicChannels: Channel[]
  activeChannelPath: string
  invites: Invite[]
}>()

/* EMIT UDALOSTÍ */
const emit = defineEmits<{
  'update:drawerOpen': [boolean]
  'goToChannel': [Channel]
  'logout': []
  'createChannel': [ChannelData]
  'leftChannel': [number]
  'invite-updated': []
  'notification-setting-changed': [number, string]
}>()

/* OVLÁDANIE STAVOV */
const $q = useQuasar()
const showAddChannelDialog = ref(false)
const inviteDialog = ref(false)
const selectedInvite = ref<Invite | null>(null)

// Všetky názvy (private+public) na kontrolu duplicít pri vytváraní
const allChannelNames = computed(() => [...props.privateChannels, ...props.publicChannels].map(ch => ch.name))

/* OTVORENIE INVITE DIALÓGU */
function openInviteDialog(invite: Invite) {
  selectedInvite.value = invite
  inviteDialog.value = true
}

/* POTVRDENIE INVITE */
async function acceptInvite() {
  try {
    const token = localStorage.getItem('auth_token')
    await axios.post(
      `${API_URL}/invites/${selectedInvite.value!.id}/accept`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )

    inviteDialog.value = false

    // Vyzvi udalosť na načítanie pozvánok
    emit('invite-updated')

    // Ihneč prejdi na kanál
    const channelId = selectedInvite.value!.channel.id
    const channelName = selectedInvite.value!.channel.name

    // Malé oneskorenie, aby sa zoznam kanálov aktualizoval
    setTimeout(() => {
      emit('goToChannel', {
        id: channelId,
        name: channelName,
        type: 'private',
        path: `/chat/${channelId}`
      })
    }, 100)

    $q.notify({
      type: 'positive',
      message: `Joined channel "${channelName}"`,
      position: 'top',
      timeout: 2000
    })
  } catch (error) {
    console.error('Failed to accept invite:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to accept invite',
      position: 'top',
      timeout: 2000
    })
  }
}

/* ODMITNUTIE INVITE */
async function rejectInvite() {
  try {
    const token = localStorage.getItem('auth_token')
    await axios.post(
      `${API_URL}/invites/${selectedInvite.value!.id}/reject`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    inviteDialog.value = false
    emit('invite-updated')

    $q.notify({
      type: 'info',
      message: 'Invite rejected',
      position: 'top',
      timeout: 2000
    })
  } catch (error) {
    console.error('Failed to reject invite:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to reject invite',
      position: 'top',
      timeout: 2000
    })
  }
}

/* VÝBER KANÁLU */
// Preklik na zvolený kanál (notifikácia nechávame na rodiča)
function selectChannel(ch: Channel) {
  emit('goToChannel', ch)
}

/* VYTVORENIE KANÁLU */
function handleCreateChannel(data: ChannelData) {
  emit('createChannel', data)
}

/* OPUSTENIE KANÁLU */
function handleLeftChannel(channelId: number) {
  emit('leftChannel', channelId)
}

/* ZMENA NOTIFIKÁCIÍ */
function handleNotificationSettingChanged(channelId: number, newSetting: string) {
  emit('notification-setting-changed', channelId, newSetting)
}
</script>

<style>
/* HLAVNÝ ŠTÝL SIDEBARU */
.sidebar {
  background-color: #355070 !important;
  border-right: 1px solid #283C55;
  box-shadow: none !important;
  display: flex;
  flex-direction: column;
}

/* HLAVIČKA SIDEBARU (CHANNELS + + BUTTON) */
.sidebar-title-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
  background-color: #355070;
  flex-shrink: 0;
}

/* SCROLLOVATEĽNÁ ČASŤ PRE ZOZNAM KANÁLOV */
.sidebar-scrollable {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 80px;
}

/* CUSTOM SCROLLBAR */
.sidebar-scrollable::-webkit-scrollbar {
  width: 8px;
}

.sidebar-scrollable::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.sidebar-scrollable::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.sidebar-scrollable::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* ŠTÝL TLAČIDLA NA PRIDANIE KANÁLU */
.add-channel-btn {
  min-width: 32px !important;
  min-height: 32px !important;
  padding: 4px !important;
  transition: background-color 0.2s ease;
}

.add-channel-btn:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.add-channel-btn .q-icon {
  font-size: 20px;
}

/* NADPISY SEKCIÍ */
.sidebar-title {
  color: #FFFFFF;
}

/* ZOZNAM KANÁLOV */
.channel-list {
  display: flex;
  flex-direction: column;
}

.channel-wrapper {
  display: flex;
  flex-direction: column;
}

/* ŠTÝL PRE POLOŽKY KANÁLOV */
.sidebar-item {
  color: #FFFFFF;
  transition: background-color 0.2s ease, font-weight 0.2s ease;
  position: relative;
}

.sidebar-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* AKTÍVNY KANÁL */
.active-channel {
  background-color: rgba(255, 255, 255, 0.25);
  font-weight: bold;
  border-left: 3px solid #FFFFFF;
}

/* MALÝ BADGE PRE NOVÉ POZVÁNKY */
.invite-badge {
  width: 10px;
  height: 10px;
  background-color: orange;
  border-radius: 50%;
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

/* Invite-k kiemelése kerettel */
.active-invite {
  background-color: rgba(255, 166, 0, 0.15);
}

/* ROZDEĽOVACIA ČIARA MEDZI SEKCIAMI */
.sidebar-divider {
  height: 1px;
  background-color: rgba(255,255,255,0.3);
  margin: 8px 0;
}

.sidebar-subtitle {
  color: #FFFFFF;
  font-weight: bold;
  margin-top: 8px;
  margin-bottom: 4px;
  font-size: 0.85rem;
}

/* KONTAJNER PRE LOGOUT TLAČIDLO */
.logout-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 300px;
  padding: 0 20px 20px 20px;
  background: linear-gradient(to top, #355070 80%, transparent);
  padding-top: 20px;
  z-index: 1000;
}

/* ŠTÝL TLAČIDLA ODHLÁSENIA */
.logout-btn {
  width: 100%;
  background-color: rgba(255, 0, 0, 0.15);
  font-weight: bold;
  text-transform: none;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.logout-btn:hover {
  background-color: rgba(255, 0, 0, 0.3);
}
</style>
