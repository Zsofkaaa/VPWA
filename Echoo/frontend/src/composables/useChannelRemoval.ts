import type { Ref } from 'vue'
import type { Router } from 'vue-router'
import type { QVueGlobals } from 'quasar'
import type { UserChannel, Message } from '@/types'

export function useChannelRemoval(
  privateChannels: Ref<UserChannel[]>,
  publicChannels: Ref<UserChannel[]>,
  currentChannelId: Ref<number | null>,
  currentChannelName: Ref<string>,
  activeChannelPath: Ref<string>,
  messages: Ref<Message[]>,
  router: Router,
  $q: QVueGlobals
) {

  // Odstráň kanál zo postranného panelu a resetuj stav, ak bol používateľ v tomto kanáli
  function removeChannelAndRedirect(
    channelId: number,
    shouldRedirect: boolean = true
  ) {
    // Odstráň kanál zo zoznamov
    privateChannels.value = privateChannels.value.filter(c => c.id !== channelId)
    publicChannels.value = publicChannels.value.filter(c => c.id !== channelId)

    // Ak bol používateľ v tomto kanáli, resetuj stav a presmeruj
    if (currentChannelId.value === channelId && shouldRedirect) {
      currentChannelId.value = null
      currentChannelName.value = ''
      activeChannelPath.value = ''
      messages.value = []

      void router.push('/')
    }
  }

  // Handle channel vymazal admin
  function handleChannelDeleted(
    channelId: number,
    channelName: string,
    deletedBy: number,
    currentUserId: number | null
  ) {
    console.log('[CHANNEL REMOVAL] Channel deleted:', { channelId, channelName, deletedBy })

    const isDeleter = currentUserId === deletedBy
    const wasInChannel = currentChannelId.value === channelId

    removeChannelAndRedirect(channelId, wasInChannel)

    // Zobraziť notifikáciu len ak používateľ NIE JE admin, ktorý ju vymazal
    if (wasInChannel && !isDeleter) {
      $q.notify({
        type: 'warning',
        message: `Channel "${channelName}" was deleted by admin`,
        position: 'top',
        timeout: 3000
      })
    }
  }

  /**
   * Spracuj používateľa vyhodeného z kanála
   */
  function handleUserKicked(
    userId: number,
    channelId: number,
    channelName: string,
    currentUserId: number | null
  ) {
    console.log('[CHANNEL REMOVAL] User kicked:', { userId, channelId, channelName })

    // Kontrola, či je vyhadzovaný používateľ aktuálny používateľ
    if (currentUserId !== userId) return

    const wasInChannel = currentChannelId.value === channelId

    removeChannelAndRedirect(channelId, wasInChannel)

    if (wasInChannel) {
      $q.notify({
        type: 'warning',
        message: `You were kicked from channel "${channelName}"`,
        position: 'top',
        timeout: 3000
      })
    }
  }

  // Spracuj používateľa zabanovaného z kanála
  function handleUserBanned(
    userId: number,
    channelId: number,
    channelName: string,
    currentUserId: number | null
  ) {
    console.log('[CHANNEL REMOVAL] User banned:', { userId, channelId, channelName })

    // Kontrola, či je zabanovaný používateľ aktuálny používateľ
    if (currentUserId !== userId) return

    const wasInChannel = currentChannelId.value === channelId

    removeChannelAndRedirect(channelId, wasInChannel)

    if (wasInChannel) {
      $q.notify({
        type: 'negative',
        message: `You were banned from channel "${channelName}"`,
        position: 'top',
        timeout: 3000
      })
    }
  }

  return {
    removeChannelAndRedirect,
    handleChannelDeleted,
    handleUserKicked,
    handleUserBanned
  }
}
