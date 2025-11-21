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

  public async store({
    auth,
    params,
    request,
  }: {
    auth: any
    params: Record<string, any>
    request: any
  }) {
    const channelId = Number(params.id)
    const { content } = request.only(['content'])

    // A bejelentkezett felhasználó ID-je
    const senderId = auth?.user?.id
    if (!senderId) {
      throw new Error('User not authenticated')
    }

    const message = await Message.create({
      channelId,
      senderId,
      content,
      hasPing: false,
      hasCommand: false,
    })

    await message.load('sender')

    await Channel.query().where('id', channelId).update({ lastActiveAt: DateTime.now() })

    return {
      id: message.id,
      userId: senderId,
      user: message.sender.nickName,
      text: message.content,
      isPing: message.hasPing,
    }
  }
}
