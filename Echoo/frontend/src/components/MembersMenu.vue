<template>
  <div>
    <!-- Tlačidlo na zobrazenie zoznamu členov -->
    <q-btn dense flat round icon="people" class="text-white" @click="showMembers = true">
      <!-- Tooltip pre desktop -->
      <q-tooltip v-if="$q.screen.gt.sm" anchor="top middle" self="bottom middle">
        Zoznam členov
      </q-tooltip>
    </q-btn>

    <!-- Dialóg so zoznamom členov -->
    <q-dialog v-model="showMembers" persistent>
      <q-card style="width: 360px; max-height: 420px; background-color: #355070; color: white;">
        <!-- Nadpis dialógu -->
        <q-card-section class="text-h6 text-center q-pt-md">
          Members of {{ currentChannel }}
        </q-card-section>

        <q-separator color="white" />

        <!-- Scrollovateľný zoznam členov -->
        <q-scroll-area style="height: 300px;">
          <div class="q-pa-md">
            <div class="column q-gutter-sm">
              <q-btn
                v-for="member in members"
                :key="member.id"
                flat
                rounded
                color="white"
                text-color="#283C55"
                class="member-btn"
                align="left"
              >
                {{ member.nickName }}
              </q-btn>
            </div>
          </div>
        </q-scroll-area>

        <q-separator color="white" />

        <!-- Tlačidlo na zatvorenie -->
        <q-card-actions align="center" class="q-pb-sm">
          <q-btn flat label="Close" color="white" @click="showMembers = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// Stav dialógu
const showMembers = ref(false)

// Zoznam členov (reaktívny)
const members = ref<{ id: number; nickName: string }[]>([])

// Props: názov a ID aktuálneho kanála
const props = defineProps<{
  currentChannel?: string
  channelId?: number | null
}>()

const API_URL = 'http://localhost:3333'

// Fetch členov, keď sa dialóg otvorí
watch(showMembers, async (val) => {
  if (val && props.channelId) {
    try {
      const res = await axios.get<{ id: number; nickName: string }[]>(
        `${API_URL}/channels/${props.channelId}/members`
      )
      members.value = res.data
    } catch (err) {
      console.error('Failed to fetch members', err)
    }
  }
})
</script>

<style scoped>
/* Tlačidlá členov rozšírené na šírku */
.member-btn {
  width: 100%;
  justify-content: flex-start;
}
</style>
