import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import UserChannel from '#models/user_channel'
import { DateTime } from 'luxon'
import User from '#models/user'
import ChannelInvite from '#models/channel_invite'

export default class ChannelsController {
  // Vytvorenie novej channel
  public async store({ auth, request, response }: any) {
    try {
      const { name, type, invitedMembers, notificationSettings } = request.only([
        'name',
        'type',
        'invitedMembers',
        'notificationSettings',
      ])

      // Vytvorenie kanála
      const channel = await Channel.create({
        name,
        type,
        createdBy: auth.user.id,
        lastActiveAt: DateTime.now(),
      })

      // Pridanie tvorcu ako admina
      await UserChannel.create({
        channelId: channel.id,
        userId: auth.user.id,
        role: 'admin',
        notificationSettings: notificationSettings || 'all',
      })

      // Vytvorenie pozvánok pre ostatných používateľov
      if (Array.isArray(invitedMembers) && invitedMembers.length > 0) {
        for (const userId of invitedMembers) {
          const exists = await UserChannel.query()
            .where('channelId', channel.id)
            .where('userId', userId)
            .first()
          if (exists) continue

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
      console.error('[ChannelsController] Error creating channel:', err)
      return response.badRequest({ error: 'Failed to create channel' })
    }
  }

  // Zrušenie kanála
  public async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user as User
    const channelId = Number(params.id)

    // Získanie kanála
    const channel = await Channel.find(channelId)
    if (!channel) {
      return response.notFound({ message: 'Channel not found' })
    }

    // Overenie, či je používateľ admin
    const userChannel = await UserChannel.query()
      .where('channel_id', channelId)
      .andWhere('user_id', user.id)
      .first()

    if (!userChannel || userChannel.role !== 'admin') {
      return response.unauthorized({ message: 'Only admins can terminate channel' })
    }

    // Odstránenie všetkých user_channel záznamov
    await UserChannel.query().where('channel_id', channelId).delete()

    // Odstránenie kanála
    await channel.delete()

    return response.ok({ message: 'Channel terminated successfully' })
  }
}
