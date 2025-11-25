import ChannelInvite from '#models/channel_invite'
import UserChannel from '#models/user_channel'

export default class InvitesController {
  // Poslanie pozvánky do kanála
  public async invite({ auth, request, params }: any) {
    const channelId = Number(params.id)
    const invitedUserId = Number(request.input('userId'))

    // Už je člen kanála?
    const exists = await UserChannel.query()
      .where('channel_id', channelId)
      .where('user_id', invitedUserId)
      .first()
    if (exists) return { error: 'User already in channel' }

    // Už existuje čakajúca pozvánka?
    const pending = await ChannelInvite.query()
      .where('channel_id', channelId)
      .where('user_id', invitedUserId)
      .where('status', 'pending')
      .first()
    if (pending) return { error: 'Invite already sent' }

    await ChannelInvite.create({
      channelId,
      userId: invitedUserId,
      invitedBy: auth.user.id,
      status: 'pending',
    })

    return { message: 'Invitation sent' }
  }

  // Získanie vlastných čakajúcich pozvánok
  public async myInvites({ auth }: any) {
    return ChannelInvite.query()
      .where('user_id', auth.user.id)
      .where('status', 'pending')
      .preload('channel')
  }

  // Akceptovanie pozvánky
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

  // Odmietnutie pozvánky
  public async reject({ auth, params }: any) {
    const inviteId = Number(params.id)
    const invite = await ChannelInvite.findOrFail(inviteId)
    if (invite.userId !== auth.user.id) return { error: 'Unauthorized' }

    invite.status = 'rejected'
    await invite.save()

    return { message: 'Invitation rejected' }
  }
}
