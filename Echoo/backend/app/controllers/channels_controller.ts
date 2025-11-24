import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import UserChannel from '#models/user_channel'
import { DateTime } from 'luxon'
import User from '#models/user'
import ChannelInvite from '#models/channel_invite'

export default class ChannelsController {
  public async store({ auth, request, response }: any) {
    try {
      const { name, type, invitedMembers, notificationSettings } = request.only([
        'name',
        'type',
        'invitedMembers',
        'notificationSettings',
      ])

      // 1️⃣ Új csatorna létrehozása
      const channel = await Channel.create({
        name,
        type,
        createdBy: auth.user.id,
        lastActiveAt: DateTime.now(),
      })

      // 2️⃣ Creator felvétele tagként
      await UserChannel.create({
        channelId: channel.id,
        userId: auth.user.id,
        role: 'admin',
        notificationSettings: notificationSettings || 'all',
      })

      // 3️⃣ Invite-ok létrehozása a selected usereknek
      if (Array.isArray(invitedMembers) && invitedMembers.length > 0) {
        for (const userId of invitedMembers) {
          // Már tag?
          const exists = await UserChannel.query()
            .where('channelId', channel.id)
            .where('userId', userId)
            .first()
          if (exists) continue

          // Már pending invite?
          const pending = await ChannelInvite.query()
            .where('channelId', channel.id)
            .where('userId', userId)
            .where('status', 'pending')
            .first()
          if (pending) continue

          await ChannelInvite.create({
            channelId: channel.id,
            userId,
            invitedBy: auth.user.id,
            status: 'pending',
          })
        }
      }

      return response.ok(channel)
    } catch (err) {
      console.error(err)
      return response.badRequest({ error: 'Failed to create channel' })
    }
  }

  public async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user as User
    const channelId = params.id

    // 1. Csatorna lekérése
    const channel = await Channel.find(channelId)
    if (!channel) {
      return response.notFound({ message: 'Channel not found' })
    }

    // 2. Jogosultság ellenőrzés (csak admin)
    const userChannel = await UserChannel.query()
      .where('channel_id', channelId)
      .andWhere('user_id', user.id)
      .first()

    if (!userChannel || userChannel.role !== 'admin') {
      return response.unauthorized({ message: 'Only admins can terminate channel' })
    }

    // 3. Minden user_channel törlése
    await UserChannel.query().where('channel_id', channelId).delete()

    // 4. A channel törlése
    await channel.delete()

    return { message: 'Channel terminated successfully' }
  }
}
