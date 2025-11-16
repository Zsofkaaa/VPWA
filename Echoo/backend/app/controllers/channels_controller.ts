import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import { DateTime } from 'luxon'

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
}
