import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import UserChannel from '#models/user_channel'
import { DateTime } from 'luxon'
import User from '#models/user'
import ChannelInvite from '#models/channel_invite'
import ws from '#services/ws'

export default class ChannelsController {
  // Vytvorenie nového kanála
  public async store({ auth, request, response }: any) {
    try {
      const { name, type, invitedMembers, notificationSettings } = request.only([
        'name',
        'type',
        'invitedMembers',
        'notificationSettings',
      ])

      // 0) Overíme duplicitný názov kanála
      const sameNameChannels = await Channel.query().where('name', name)

      if (sameNameChannels.length > 0) {
        // Ak názov existuje, preveríme typ aby sme neduplikovali
        const sameTypeChannel = sameNameChannels.find((c) => c.type === type)

        if (sameTypeChannel) {
          return response.badRequest({
            error: `A '${name}' nevű ${type} csatorna már létezik.`,
          })
        }
        // Ak je typ odlišný, povolíme vytvorenie
      }

      // 1) Vytvoríme kanál s creatorom a last_active
      const channel = await Channel.create({
        name,
        type,
        createdBy: auth.user.id,
        lastActiveAt: DateTime.now(),
      })

      // 2) Pridáme tvorcu ako admina do user_channel
      await UserChannel.create({
        channelId: channel.id,
        userId: auth.user.id,
        role: 'admin',
        notificationSettings: notificationSettings || 'all',
      })

      // 3) Pre pozvaných pripravíme pending invites a odošleme WS
      if (Array.isArray(invitedMembers) && invitedMembers.length > 0) {
        for (const userId of invitedMembers) {
          // Preskočíme ak je už členom
          const alreadyMember = await UserChannel.query()
            .where('channelId', channel.id)
            .where('userId', userId)
            .first()

          if (alreadyMember) continue

          // Preskočíme ak už existuje pending pozvánka
          const pendingInvite = await ChannelInvite.query()
            .where('channelId', channel.id)
            .where('userId', userId)
            .where('status', 'pending')
            .first()

          if (pendingInvite) continue

          // Vytvoríme pozvánku so stavom pending
          const invite = await ChannelInvite.create({
            channelId: channel.id,
            userId,
            invitedBy: auth.user.id,
            status: 'pending',
          })

          // Pošleme WebSocket notifikáciu konkrétnemu používateľovi
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

    // Načítame kanál podľa ID
    const channel = await Channel.find(channelId)
    if (!channel) {
      return response.notFound({ message: 'Channel not found' })
    }

    // Overíme, či má používateľ rolu admin v danom kanáli
    const userChannel = await UserChannel.query()
      .where('channel_id', channelId)
      .andWhere('user_id', user.id)
      .first()

    if (!userChannel || userChannel.role !== 'admin') {
      return response.unauthorized({ message: 'Only admins can terminate channel' })
    }

    // Odkomunikujeme zmazanie kanála cez WS ešte pred jeho odstránením
    ws.sendChannelDeleted(channelId, channel.name, user.id)

    // Odstránenie všetkých user_channel záznamov
    await UserChannel.query().where('channel_id', channelId).delete()

    // Odstránenie kanála
    await channel.delete()

    return response.ok({ message: 'Channel terminated successfully' })
  }
}
