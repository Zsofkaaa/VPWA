import ChannelInvite from '#models/channel_invite'
import UserChannel from '#models/user_channel'
import ChannelBan from '#models/channel_ban'

// a HttpContextContract helyett használjunk any-t
export default class InvitesController {
  public async invite({ auth, request, params }: any) {
    const channelId = Number(params.id)
    const invitedUserId = Number(request.input('userId'))
    const inviterId = auth.user.id

    // 1) Lekérdezzük az inviter role-ját
    const inviterChannel = await UserChannel.query()
      .where('channelId', channelId)
      .andWhere('userId', inviterId)
      .first()

    if (!inviterChannel) return { error: 'You are not in this channel' }

    const inviterRole = inviterChannel.role

    // 2) Ellenőrizzük, hogy a meghívott bannolt-e
    const banned = await ChannelBan.query()
      .where('channelId', channelId)
      .andWhere('userId', invitedUserId)
      .first()

    if (banned && inviterRole !== 'admin') {
      return { error: 'You cannot invite a banned user' }
    }

    // 3) Már tag?
    const exists = await UserChannel.query()
      .where('channelId', channelId)
      .where('userId', invitedUserId)
      .first()
    if (exists) return { error: 'User already in channel' }

    // 4) Már van pending invite?
    const pending = await ChannelInvite.query()
      .where('channelId', channelId)
      .where('userId', invitedUserId)
      .where('status', 'pending')
      .first()
    if (pending) return { error: 'Invite already sent' }

    // 5) Létrehozzuk az invite-ot
    await ChannelInvite.create({
      channelId,
      userId: invitedUserId,
      invitedBy: inviterId,
      status: 'pending',
    })

    return { message: 'Invitation sent' }
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

    await UserChannel.create({
      userId: auth.user.id,
      channelId: invite.channelId,
      role: 'member',
      notificationSettings: 'all',
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
