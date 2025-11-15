import Message from '#models/message'
//import User from '#models/user'

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
      user: msg.sender.nickName,
      text: msg.content,
      isPing: msg.hasPing,
    }))
  }

  public async store({
    params,
    request,
  }: {
    auth: any
    params: Record<string, any>
    request: any
  }) {
    const channelId = Number(params.id)
    const { content } = request.only(['content'])

    // IDEIGLENES USER, amíg nincs auth
    const fakeUserId = 1

    const message = await Message.create({
      channelId,
      senderId: fakeUserId,
      content,
      hasPing: false,
      hasCommand: false,
    })

    await message.load('sender')

    return {
      id: message.id,
      user: message.sender.nickName,
      text: message.content,
      isPing: message.hasPing,
    }
  }
}
