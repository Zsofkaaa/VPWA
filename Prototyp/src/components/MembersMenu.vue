<template>
  <div>
    <q-btn
      dense
      flat
      :round="showMembers"
      icon="people"
      class="text-white"
      @click="showMembers = true"
      title="Show Members"
    />

    <!-- Members Popup -->
    <q-dialog v-model="showMembers" persistent>
      <q-card
        style="width: 360px; max-height: 420px; background-color: #355070; color: white;"
      >
        <q-card-section class="text-h6 text-center q-pt-md">
          Members of {{ currentChannel }}
        </q-card-section>

        <q-separator color="white" />

        <!-- Scrollable button list -->
        <q-scroll-area style="height: 300px;">
          <div class="q-pa-md">
            <div class="column q-gutter-sm">
              <q-btn
                v-for="member in members"
                :key="member"
                flat
                rounded
                color="white"
                text-color="#283C55"
                @click="onMemberClick(member)"
                class="member-btn"
                align="left"
              >
                {{ member }}
              </q-btn>
            </div>
          </div>
        </q-scroll-area>

        <q-separator color="white" />

        <q-card-actions align="center" class="q-pb-sm">
          <q-btn flat label="Close" color="white" @click="showMembers = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

defineProps<{
  currentChannel?: string
}>()

const showMembers = ref(false)

const members = [
  'Sophia Martinez', 'Liam Chen', 'Emma Rodriguez', 'Noah Williams', 'Olivia Johnson',
  'Ethan Brown', 'Ava Davis', 'Mason Garcia', 'Isabella Miller', 'Lucas Anderson',
  'Mia Thompson', 'Aiden Wilson', 'Charlotte Moore', 'Jackson Taylor', 'Amelia Thomas',
  'Logan Hernandez', 'Harper Lee', 'Sebastian White', 'Evelyn Harris', 'Alexander Clark'
]

function onMemberClick(member: string) {
  console.log('Clicked member:', member)
}
</script>

<style scoped>
.member-btn {
  width: 100%;
  justify-content: flex-start;
}
</style>