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

  /**
   * Remove channel from sidebar and reset state if user was in that channel
   */
  function removeChannelAndRedirect(
    channelId: number,
    shouldRedirect: boolean = true
  ) {
    // Remove channel from lists
    privateChannels.value = privateChannels.value.filter(c => c.id !== channelId)
    publicChannels.value = publicChannels.value.filter(c => c.id !== channelId)

    // If user was in this channel, reset state and redirect
    if (currentChannelId.value === channelId && shouldRedirect) {
      currentChannelId.value = null
      currentChannelName.value = ''
      activeChannelPath.value = ''
      messages.value = []

      void router.push('/')
    }
  }

  /**
   * Handle channel deleted by admin
   */
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

    // Only show notification if user is NOT the admin who deleted it
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
   * Handle user kicked from channel
   */
  function handleUserKicked(
    userId: number,
    channelId: number,
    channelName: string,
    currentUserId: number | null
  ) {
    console.log('[CHANNEL REMOVAL] User kicked:', { userId, channelId, channelName })

    // Check if kicked user is current user
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

  /**
   * Handle user banned from channel
   */
  function handleUserBanned(
    userId: number,
    channelId: number,
    channelName: string,
    currentUserId: number | null
  ) {
    console.log('[CHANNEL REMOVAL] User banned:', { userId, channelId, channelName })

    // Check if banned user is current user
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
