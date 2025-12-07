import axios from 'axios'
import type { Ref } from 'vue'
import type { UserChannel, AppUser, KickResponse, Channel, ChannelResponse, Message } from '@/types'
import type { QVueGlobals } from 'quasar'
import type { Router } from 'vue-router'
import API_URL from '../config/api'

// const API_URL = 'http://localhost:3333'

export function useChannelCommands(
  privateChannels: Ref<UserChannel[]>,
  publicChannels: Ref<UserChannel[]>,
  currentChannelId: Ref<number | null>,
  currentChannelName: Ref<string>,
  activeChannelPath: Ref<string>,
  messages: Ref<Message[]>,                   // ha van message típusod, az legyen messages: Ref<Message[]>
  currentUserId: Ref<number | null>,
  handleChannelLeft: (channelId: number) => void,
  $q: QVueGlobals,
  router: Router
) {

  // Command handlers - upravené na používanie existujúcich endpointov
  async function handleCancelCommand() {
    if (!currentChannelId.value) {
      $q.notify({ type: 'negative', message: 'You are not in any channel!' })
      return
    }

    const channelId = currentChannelId.value
    const allChannels = [...privateChannels.value, ...publicChannels.value]
    const channel = allChannels.find(ch => ch.id === channelId)

    if (!channel) {
      $q.notify({ type: 'negative', message: 'Channel not found!' })
      return
    }

    const token = localStorage.getItem('auth_token')
    const isAdmin = channel.role === 'admin'

    try {
      if (isAdmin) {
        // Admin vymaže celý kanál
        await axios.delete(`${API_URL}/channels/${channelId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        privateChannels.value = privateChannels.value.filter(c => c.id !== channelId)
        publicChannels.value = publicChannels.value.filter(c => c.id !== channelId)

        $q.notify({
          type: 'positive',
          message: `Channel "${channel.name}" deleted.`
        })
      } else {
        // Bežný používateľ opustí kanál - používame existujúci endpoint
        await axios.delete(`${API_URL}/channels/${channelId}/leave`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        handleChannelLeft(channelId)

        $q.notify({
          type: 'positive',
          message: `You left channel "${channel.name}".`
        })
      }

      currentChannelId.value = null
      currentChannelName.value = ''
      messages.value = []
      activeChannelPath.value = ''

      void router.push('/')
    } catch (err) {
      console.error(err)
      $q.notify({
        type: 'negative',
        message: 'Failed to cancel channel!'
      })
    }
  }

  async function handleKickCommand(parts: string[]) {
    if (!currentChannelId.value) {
      $q.notify({ type: 'negative', message: 'You are not in any channel!' })
      return
    }

    const channelId = currentChannelId.value
    const targetName = parts.slice(1).join(' ')

    if (!targetName) {
      $q.notify({ type: 'negative', message: 'Usage: /kick nickName' })
      return
    }

    const allChannels = [...privateChannels.value, ...publicChannels.value]
    const channel = allChannels.find(c => c.id === channelId)

    if (!channel) {
      $q.notify({ type: 'negative', message: 'Channel not found!' })
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const users = await axios.get<AppUser[]>(
        `${API_URL}/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const targetUser = users.data.find(
        u => u.nickName.toLowerCase() === targetName.toLowerCase()
      )

      if (!targetUser) {
        $q.notify({ type: 'negative', message: 'User not found!' })
        return
      }

      let endpoint = ''

      if (channel.role === 'admin') { // Admin → BAN
      endpoint = `${API_URL}/channels/${channelId}/ban/${targetUser.id}`
      const res = await axios.delete<KickResponse>(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      $q.notify({ type: 'positive', message: res.data.message || `User "${targetName}" has been banned` })

      } else { // Member → KICK
      endpoint = `${API_URL}/channels/${channelId}/kick/${targetUser.id}`
      const res = await axios.delete<KickResponse>(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      $q.notify({ type: 'positive', message: res.data.message })
      }

    /*
      if (channel.role === 'admin') {
        // Admin → BAN
        endpoint = `${API_URL}/channels/${channelId}/ban/${targetUser.id}`
      } else {
        // Member → KICK
        endpoint = `${API_URL}/channels/${channelId}/kick/${targetUser.id}`
      }

      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      })

      $q.notify({
        type: 'positive',
        message:
          channel.role === 'admin'
            ? `User "${targetName}" has been banned`
            : `User "${targetName}" has been kicked`
      })
      */

    } catch (err) {
      console.error(err)
      $q.notify({ type: 'negative', message: 'Failed to kick user!' })
    }
  }

  async function handleInviteCommand(parts: string[]) {
    if (!currentChannelId.value) {
      $q.notify({ type: 'negative', message: 'You are not in any channel!' })
      return
    }

    const channelId = currentChannelId.value
    const targetName = parts.slice(1).join(' ')

    if (!targetName) {
      $q.notify({ type: 'negative', message: 'Usage: /invite nickName' })
      return
    }

    const allChannels = [...privateChannels.value, ...publicChannels.value]
    const channel = allChannels.find(c => c.id === channelId)

    if (!channel) {
      $q.notify({ type: 'negative', message: 'Channel not found!' })
      return
    }

    const isPrivate = channel.type === 'private'
    const isAdmin = channel.role === 'admin'

    if (isPrivate && !isAdmin) {
      $q.notify({ type: 'negative', message: 'Only admin can invite in private channels!' })
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const users = await axios.get<AppUser[]>(
        `${API_URL}/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const targetUser = users.data.find(
        u => u.nickName.toLowerCase() === targetName.toLowerCase()
      )

      if (!targetUser) {
        $q.notify({ type: 'negative', message: 'User not found!' })
        return
      }

      // Pozývanie používateľa pomocou existujúceho endpointu
      await axios.post(
        `${API_URL}/channels/${channelId}/invite`,
        { userId: targetUser.id },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      $q.notify({
        type: 'positive',
        message: `Invite sent to "${targetName}"`
      })
    } catch (err) {
      console.error(err)
      $q.notify({ type: 'negative', message: 'Failed to invite user!' })
    }
  }

  async function handleBanCommand(parts: string[]) {
    if (!currentChannelId.value) {
      $q.notify({ type: 'negative', message: 'You are not in any channel!' })
      return
    }

    const channelId = currentChannelId.value
    const targetName = parts[1]

    if (!targetName) {
      $q.notify({ type: 'negative', message: 'Usage: /ban nickName' })
      return
    }

    const allChannels = [...privateChannels.value, ...publicChannels.value]
    const channel = allChannels.find(c => c.id === channelId)

    if (!channel) {
      $q.notify({ type: 'negative', message: 'Channel not found!' })
      return
    }

    const isAdmin = channel.role === 'admin'

    if (!isAdmin) {
      $q.notify({ type: 'negative', message: 'Only admin can ban users!' })
      return
    }

    try {
      const token = localStorage.getItem('auth_token')
      const users = await axios.get<AppUser[]>(
        `${API_URL}/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const targetUser = users.data.find(
        (u) => u.nickName.toLowerCase() === targetName.toLowerCase()
      )

      if (!targetUser) {
        $q.notify({ type: 'negative', message: 'User not found!' })
        return
      }

      // Ban používateľa pomocou existujúceho endpointu
      await axios.delete(
        `${API_URL}/channels/${channelId}/ban/${targetUser.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      $q.notify({ type: 'positive', message: `${targetName} banned from channel` })
    } catch (err) {
      console.error(err)
      $q.notify({ type: 'negative', message: 'Failed to ban user!' })
    }
  }

  async function handleListCommand() {
    if (!currentChannelId.value) {
      return $q.notify({ type: 'negative', message: 'You are not in any channel!' })
    }

    try {
      const token = localStorage.getItem('auth_token')

      const res = await axios.get(
        `${API_URL}/channels/${currentChannelId.value}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const members = res.data as { id: number, nickName: string, role: string }[]

      if (!members.length) {
        return $q.notify({ type: 'info', message: 'This channel has no members.' })
      }

      const formatted = members
        .map(m => `• ${m.nickName} (${m.role})`)
        .join('<br>')

      $q.notify({
        message: `Members:<br>${formatted}`,
        html: true,
        color: 'blue',
        textColor: 'white',
        timeout: 0
      })

    } catch (err) {
      console.error(err)
      return $q.notify({ type: 'negative', message: 'Failed to load members!' })
    }
  }

  async function handleQuitCommand() {
    if (!currentChannelId.value) {
      $q.notify({
        type: 'negative',
        message: 'You are not in any channel!'
      })
      return
    }

    const channelId = currentChannelId.value
    const allChannels = [...privateChannels.value, ...publicChannels.value]
    const channel = allChannels.find(ch => ch.id === channelId)

    if (!channel) {
      $q.notify({
        type: 'negative',
        message: 'Channel not found!'
      })
      return
    }

    // 🔒 ADMIN ELLENŐRZÉS
    if (channel.role !== 'admin') {
      $q.notify({
        type: 'negative',
        message: 'You cannot use this command, you are not the admin!'
      })
      return
    }

    const token = localStorage.getItem('auth_token')

    try {
      // 💣 Csatorna törlése
      await axios.delete(`${API_URL}/channels/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // törlés frontendből
      privateChannels.value = privateChannels.value.filter(c => c.id !== channelId)
      publicChannels.value = publicChannels.value.filter(c => c.id !== channelId)

      $q.notify({
        type: 'positive',
        message: `Channel "${channel.name}" deleted.`
      })

      // UI reset
      currentChannelId.value = null
      currentChannelName.value = ''
      messages.value = []
      activeChannelPath.value = ''

      void router.push('/')

    } catch (err) {
      console.error(err)
      $q.notify({
        type: 'negative',
        message: 'Failed to delete channel!'
      })
    }
  }

  async function handleRevokeCommand(parts: string[]) {
    if (!currentChannelId.value) {
      return $q.notify({ type: 'negative', message: 'You are not in any channel!' })
    }

    const channelId = currentChannelId.value
    const targetName = parts[1]

    if (!targetName) {
      return $q.notify({ type: 'negative', message: 'Usage: /revoke nickName' })
    }

    const allChannels = [...privateChannels.value, ...publicChannels.value]
    const channel = allChannels.find(c => c.id === channelId)

    if (!channel) {
      return $q.notify({ type: 'negative', message: 'Channel not found!' })
    }

    const isAdmin = channel.role === 'admin'

    if (!isAdmin) {
      return $q.notify({ type: 'negative', message: 'Only admin can revoke users!' })
    }

    try {
      const token = localStorage.getItem('auth_token')

      const users = await axios.get<AppUser[]>(
        `${API_URL}/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const targetUser = users.data.find(
        (u) => u.nickName.toLowerCase() === targetName.toLowerCase()
      )

      if (!targetUser) {
        return $q.notify({ type: 'negative', message: 'User not found!' })
      }

      await axios.delete(
        `${API_URL}/channels/${channelId}/ban/${targetUser.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      $q.notify({ type: 'positive', message: `${targetName} removed from channel` })

    } catch (err) {
      console.error(err)
      $q.notify({ type: 'negative', message: 'Failed to revoke user!' })
    }
  }

  async function handleJoinCommand(parts: string[]) {
    const isPrivate = parts.includes('[private]')

    const nameParts = parts.slice(1).filter(p => p !== '[private]')
    const channelName = nameParts.join(' ')

    if (!channelName) {
      return $q.notify({ type: 'negative', message: 'Channel name is required!' })
    }

    try {
      const token = localStorage.getItem('auth_token')
      if (!token || !currentUserId.value) throw new Error('Not authenticated')

      // 1️⃣ Lekérdezzük az összes csatornát globálisan
      const allChannelsRes = await axios.get(`${API_URL}/channels`)
      const allChannels = allChannelsRes.data as Channel[]

      const existingChannelGlobal = allChannels.find(
        c => c.name.toLowerCase() === channelName.toLowerCase() &&
            c.type === (isPrivate ? 'private' : 'public')
      )

      let channelId: number

      if (existingChannelGlobal) {
        // 2️⃣ CSATLAKOZÁS LÉTEZŐ CSATORNÁHOZ
        await axios.post(
          `${API_URL}/user_channel`,
          {
            channelId: existingChannelGlobal.id,
            userId: currentUserId.value,
            role: isPrivate ? 'admin' : 'member',
            notificationSettings: 'all'
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        channelId = existingChannelGlobal.id

        const newLocalChannel: UserChannel = {
          id: channelId,
          name: existingChannelGlobal.name,
          path: `/chat/${channelId}`,
          type: existingChannelGlobal.type,
          role: isPrivate ? 'admin' : 'member'
        }

        let alreadyJoined = false

        if (existingChannelGlobal.type === 'private') {
          if (!privateChannels.value.some(c => c.id === channelId)) {
            privateChannels.value.push(newLocalChannel)
          } else {
            alreadyJoined = true
          }
        } else {
          if (!publicChannels.value.some(c => c.id === channelId)) {
            publicChannels.value.push(newLocalChannel)
          } else {
            alreadyJoined = true
          }
        }

        $q.notify({
          type: alreadyJoined ? 'info' : 'positive',
          message: alreadyJoined
            ? `You are already a member of "${channelName}"`
            : `Joined channel "${channelName}"`
        })

      } else {
        // 4️⃣ LÉTREHOZÁS
        const res = await axios.post<ChannelResponse>(
          `${API_URL}/channels`,
          {
            name: channelName,
            type: isPrivate ? 'private' : 'public',
            invitedMembers: [],
            notificationSettings: 'all'
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        channelId = res.data.id

        const userChannelRes = await axios.post<UserChannel>(
          `${API_URL}/user_channel`,
          {
            channelId,
            userId: currentUserId.value,
            role: 'admin', // backend szerint mindig admin
            notificationSettings: 'all'
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        const newChannel: UserChannel = {
          id: channelId,
          name: channelName,
          path: `/chat/${channelId}`,
          type: isPrivate ? 'private' : 'public',
          role: userChannelRes.data.role
        }

        if (isPrivate) privateChannels.value.push(newChannel)
        else publicChannels.value.push(newChannel)

        $q.notify({
          type: 'positive',
          message: `Channel "${channelName}" created!`
        })
      }

      currentChannelName.value = channelName
      currentChannelId.value = channelId

      void router.push(`/chat/${channelId}`)

    } catch (err) {
      console.error(err)
      $q.notify({
        type: 'negative',
        message: 'Failed to join or create channel!'
      })
    }
  }

  async function handleCommand(cmd: string) {
    const parts = cmd.trim().split(' ')
    const command = parts[0]

    if (command === '/cancel') {
      await handleCancelCommand()
    } else if (command === '/kick') {
      await handleKickCommand(parts)
    } else if (command === '/invite') {
      await handleInviteCommand(parts)
    } else if (command === '/ban') {
      await handleBanCommand(parts)
    } else if (command === '/quit') {
      await handleQuitCommand()
    } else if (command === '/join') {
      await handleJoinCommand(parts)
    } else if (command === '/revoke') {
      await handleRevokeCommand(parts)
    } else if (command === '/list') {
      await handleListCommand()
    } else {
      $q.notify({ type: 'warning', message: 'Unknown command' })
    }
  }

  return { handleCommand }
}
