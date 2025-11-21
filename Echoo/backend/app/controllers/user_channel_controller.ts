import type { HttpContext } from '@adonisjs/core/http'
import UserChannel from '#models/user_channel'

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
}
