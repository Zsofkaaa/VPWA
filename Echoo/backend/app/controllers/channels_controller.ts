import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import UserChannel from '#models/user_channel'
import { DateTime } from 'luxon'
import User from '#models/user'
import ChannelInvite from '#models/channel_invite'
import ws from '#services/ws'

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

      // 0️⃣ Név alapján megnézzük, létezik-e már ilyen csatorna
      const sameNameChannels = await Channel.query().where('name', name)

      if (sameNameChannels.length > 0) {
        // Név egyezik → ellenőrizzük a típust
        const sameTypeChannel = sameNameChannels.find((c) => c.type === type)

        if (sameTypeChannel) {
          return response.badRequest({
            error: `A '${name}' nevű ${type} csatorna már létezik.`,
          })
        }
        // Ha más típus → ENGEDJÜK
      }

      // 1️⃣ Új csatorna létrehozása
      const channel = await Channel.create({
        name,
        type,
        createdBy: auth.user.id,
        lastActiveAt: DateTime.now(),
      })

      // 2️⃣ Pridanie tvorcu ako admina
      await UserChannel.create({
        channelId: channel.id,
        userId: auth.user.id,
        role: 'admin',
        notificationSettings: notificationSettings || 'all',
      })

      // 3️⃣ Invite-ok létrehozása + WebSocket értesítések
      if (Array.isArray(invitedMembers) && invitedMembers.length > 0) {
        for (const userId of invitedMembers) {
          const alreadyMember = await UserChannel.query()
            .where('channelId', channel.id)
            .where('userId', userId)
            .first()

          if (alreadyMember) continue

          const pendingInvite = await ChannelInvite.query()
            .where('channelId', channel.id)
            .where('userId', userId)
            .where('status', 'pending')
            .first()

          if (pendingInvite) continue

          // Invite létrehozása
          const invite = await ChannelInvite.create({
            channelId: channel.id,
            userId,
            invitedBy: auth.user.id,
            status: 'pending',
          })

          // ⭐ WebSocket értesítés küldése ⭐
          ws.sendInviteNotification(userId, {
            id: invite.id,
            channel_id: channel.id,
            channel: {
              id: channel.id,
              name: channel.name,
            },
          })

          // console.log(`[CHANNEL CREATE] Sent invite notification to user ${userId}`)
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

    // ⭐ WebSocket értesítés ELŐTTE (amikor még mindenki a channel room-ban van) ⭐
    ws.sendChannelDeleted(channelId, channel.name, user.id)

    // Odstránenie všetkých user_channel záznamov
    await UserChannel.query().where('channel_id', channelId).delete()

    // Odstránenie kanála
    await channel.delete()

    return response.ok({ message: 'Channel terminated successfully' })
  }
}
