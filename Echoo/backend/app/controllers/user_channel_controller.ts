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
}
