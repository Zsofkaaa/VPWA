import type { HttpContext } from '@adonisjs/core/http'
import UserChannel from '#models/user_channel'
import KickLog from '#models/kick_log'

export default class UserChannelController {
  public async store({ request, auth }: { request: any; auth: any }) {
    const data = request.only(['userId', 'channelId', 'role', 'notificationSettings', 'kickCount'])

    const user = auth.user
    if (!user) return { error: 'Unauthorized' }

    const userChannel = await UserChannel.create({
      ...data,
    })

    return userChannel
  }

  public async members({ params, response }: HttpContext) {
    const channelId = Number(params.id)
    const userChannels = await UserChannel.query().where('channelId', channelId).preload('user')

    console.log('UserChannels:', JSON.stringify(userChannels, null, 2))

    const members = userChannels.map((uc) => ({
      id: uc.user?.id ?? 0,
      nickName: uc.user?.nickName ?? 'UNKNOWN',
      role: uc.role,
    }))

    return response.ok(members)
  }

  public async leave({ params, auth, response }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized({ error: 'Unauthorized' })

    const channelId = Number(params.id)

    const userModel = auth.user as unknown as { id: number }

    // Ellenőrizzük, hogy benne van-e a csatornában
    const record = await UserChannel.query()
      .where('userId', userModel.id)
      .andWhere('channelId', channelId)
      .first()

    if (!record) {
      return response.notFound({ error: 'You are not a member of this channel' })
    }

    await record.delete()

    return response.ok({ message: 'Left the channel' })
  }

  public async getUserChannels({ auth, response }: HttpContext) {
    const user = auth.user as { id: number }
    if (!user) return response.unauthorized({ error: 'Unauthorized' })

    const userChannels = await UserChannel.query().where('userId', user.id).preload('channel')

    const channelsMap = new Map<number, any>()

    userChannels.forEach((uc) => {
      if (uc.channel && !channelsMap.has(uc.channel.id)) {
        channelsMap.set(uc.channel.id, {
          id: uc.channel.id,
          name: uc.channel.name,
          type: uc.channel.type, // 👈 MOST MÁR VAN
          path: `/chat/${uc.channel.id}`,
          role: uc.role,
        })
      }
    })

    return response.ok(Array.from(channelsMap.values()))
  }

  public async ban({ params, response }: HttpContext) {
    const channelId = Number(params.id)
    const userId = Number(params.userId)

    const record = await UserChannel.query()
      .where('channelId', channelId)
      .andWhere('userId', userId)
      .first()

    if (!record) {
      return response.notFound({ error: 'User is not in this channel' })
    }

    await record.delete()

    return response.ok({ message: 'User banned successfully' })
  }

  public async kick({ params, auth, response }: HttpContext) {
    const channelId = Number(params.id)
    const targetUserId = Number(params.userId)
    const kickerUser = auth.user as { id: number }

    // 1. A user benne van-e a csatornában?
    const record = await UserChannel.query()
      .where('channelId', channelId)
      .andWhere('userId', targetUserId)
      .first()

    if (!record) {
      return response.notFound({ error: 'User is not in this channel' })
    }

    // 2. Ellenőrizzük, hogy kicker már kickelte-e
    const alreadyKicked = await KickLog.query()
      .where('channelId', channelId)
      .andWhere('targetUserId', targetUserId)
      .andWhere('kickerUserId', kickerUser.id)
      .first()

    if (alreadyKicked) {
      return response.badRequest({ error: 'You already kicked this user' })
    }

    // 3. Kick logolása
    await KickLog.create({
      channelId,
      targetUserId,
      kickerUserId: kickerUser.id,
    })

    // 4. Megszámoljuk, hány különböző user kickelte
    const kicks = await KickLog.query()
      .where('channelId', channelId)
      .andWhere('targetUserId', targetUserId)

    const uniqueKickCount = kicks.length

    // 5. Ha elérte a 3 különböző kicket → ban
    if (uniqueKickCount >= 3) {
      await record.delete()
      return response.ok({
        message: 'User has been banned after 3 different users kicked them',
      })
    }

    return response.ok({
      message: `User kicked successfully (${uniqueKickCount}/3)`,
    })
  }
}
