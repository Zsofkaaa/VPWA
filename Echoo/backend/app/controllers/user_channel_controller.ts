import type { HttpContext } from '@adonisjs/core/http'
import UserChannel from '#models/user_channel'
//import User from '#models/user'

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
    }))

    return response.ok(members)
  }
}
