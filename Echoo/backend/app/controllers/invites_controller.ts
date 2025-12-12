import ChannelInvite from '#models/channel_invite'
import UserChannel from '#models/user_channel'
import ChannelBan from '#models/channel_ban'
import ws from '#services/ws'

// Namiesto HttpContextContract použijeme typ any
export default class InvitesController {
  public async invite({ auth, request, params, response }: any) {
    const channelId = Number(params.id)
    const invitedUserId = Number(request.input('userId'))
    const inviterId = auth.user.id

    // 1) rola pozývajúceho
    const inviterChannel = await UserChannel.query()
      .where('channelId', channelId)
      .andWhere('userId', inviterId)
      .first()

    if (!inviterChannel) {
      return response.status(403).json({ error: 'You are not in this channel' })
    }

    const inviterRole = inviterChannel.role

    // 2) je používateľ zabanovaný?
    const banned = await ChannelBan.query()
      .where('channelId', channelId)
      .andWhere('userId', invitedUserId)
      .first()

    if (banned && inviterRole !== 'admin') {
      return response.status(403).json({ error: 'User is banned from channel' })
    }

    // 3) je už členom?
    const exists = await UserChannel.query()
      .where('channelId', channelId)
      .andWhere('userId', invitedUserId)
      .first()

    if (exists) {
      return response.status(409).json({ error: 'User already in channel' })
    }

    // 4) čaká na pozvánku?
    const pending = await ChannelInvite.query()
      .where('channelId', channelId)
      .where('userId', invitedUserId)
      .where('status', 'pending')
      .first()

    if (pending) {
      return response.status(409).json({ error: 'Invite already sent' })
    }

    // 5) vytvorenie pozvánky
    const invite = await ChannelInvite.create({
      channelId,
      userId: invitedUserId,
      invitedBy: inviterId,
      status: 'pending',
    })

    // 6) načítanie informácií o kanáli pre WebSocket notifikáciu
    await invite.load('channel')

    // 7) odoslanie real-time notifikácie pozvanému používateľovi
    ws.sendInviteNotification(invitedUserId, {
      id: invite.id,
      channel_id: channelId,
      channel: {
        id: invite.channel.id,
        name: invite.channel.name,
      },
    })

    return response.status(200).json({ message: 'Invitation sent' })
  }

  public async myInvites({ auth }: any) {
    return ChannelInvite.query()
      .where('user_id', auth.user.id)
      .where('status', 'pending')
      .preload('channel')
  }

  public async accept({ auth, params }: any) {
    const inviteId = Number(params.id)
    const invite = await ChannelInvite.findOrFail(inviteId)

    if (invite.userId !== auth.user.id) return { error: 'Unauthorized' }

    invite.status = 'accepted'
    await invite.save()

    await ChannelBan.query()
      .where('channelId', invite.channelId)
      .andWhere('userId', invite.userId)
      .delete()

    await UserChannel.create({
      userId: auth.user.id,
      channelId: invite.channelId,
      role: 'member',
      notificationSettings: 'all',
    })

    // Načítanie informácií o kanáli
    await invite.load('channel')

    // Odošli real-time notifikáciu používateľovi
    ws.sendChannelUpdate(auth.user.id, {
      id: invite.channel.id,
      name: invite.channel.name,
      type: invite.channel.type,
      path: `/chat/${invite.channel.id}`,
      role: 'member',
    })

    return { message: 'Joined channel' }
  }

  public async reject({ auth, params }: any) {
    const inviteId = Number(params.id)
    const invite = await ChannelInvite.findOrFail(inviteId)

    if (invite.userId !== auth.user.id) return { error: 'Unauthorized' }

    invite.status = 'rejected'
    await invite.save()

    return { message: 'Invitation rejected' }
  }
}
