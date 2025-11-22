import Message from '#models/message'
import Channel from '#models/channel'
import { DateTime } from 'luxon'

export default class MessagesController {
  public async index({ params }: { params: { id: number } }) {
    const channelId = params.id

    const messages = await Message.query()
      .where('channel_id', channelId)
      .preload('sender')
      .orderBy('id', 'desc')
      .limit(30)

    return messages.map((msg) => ({
      id: msg.id,
      userId: msg.senderId,
      user: msg.sender.nickName,
      text: msg.content,
      isPing: msg.hasPing,
    }))
  }

  public async store({ auth, params, request }: any) {
    const channelId = Number(params.id)
    const { content } = request.only(['content'])

    const senderId = auth?.user?.id
    if (!senderId) throw new Error('User not authenticated')

    // Channel lekérése
    const channel = await Channel.findOrFail(channelId)

    // Üzenet létrehozása
    const message = await Message.create({
      channelId,
      senderId,
      content,
      hasPing: false,
      hasCommand: false,
    })

    await message.load('sender')

    // LastActiveAt frissítése - camelCase működik a model instance-on
    channel.lastActiveAt = DateTime.now()
    await channel.save()

    return {
      id: message.id,
      userId: senderId,
      user: message.sender.nickName,
      text: message.content,
      isPing: message.hasPing,
    }
  }
}
