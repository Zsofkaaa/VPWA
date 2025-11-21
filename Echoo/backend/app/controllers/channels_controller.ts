import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import UserChannel from '#models/user_channel'
import { DateTime } from 'luxon'
import User from '#models/user'

export default class ChannelsController {
  public async store({ request, auth, response }: HttpContext) {
    try {
      const user = auth.user as any
      if (!user) {
        return response.unauthorized('Not authenticated')
      }

      const { name, type } = request.only(['name', 'type'])

      // channel create
      const channel = await Channel.create({
        name,
        type,
        createdBy: user.id,
        lastActiveAt: DateTime.now(),
      })

      return channel
    } catch (error) {
      console.error('Channel creation error:', error)
      return response.badRequest('Failed to create channel')
    }
  }

  public async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user as User
    const channelId = params.id

    // 1. Csatorna lekérése
    const channel = await Channel.find(channelId)
    if (!channel) {
      return response.notFound({ message: 'Channel not found' })
    }

    // 2. Jogosultság ellenőrzés (csak admin)
    const userChannel = await UserChannel.query()
      .where('channel_id', channelId)
      .andWhere('user_id', user.id)
      .first()

    if (!userChannel || userChannel.role !== 'admin') {
      return response.unauthorized({ message: 'Only admins can terminate channel' })
    }

    // 3. Minden user_channel törlése
    await UserChannel.query().where('channel_id', channelId).delete()

    // 4. A channel törlése
    await channel.delete()

    return { message: 'Channel terminated successfully' }
  }
}
