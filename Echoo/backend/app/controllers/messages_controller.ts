import Message from '#models/message'
import Channel from '#models/channel'
import { DateTime } from 'luxon'

export default class MessagesController {
  // Získanie posledných správ z kanála
  public async index({ params }: { params: { id: number } }) {
    const channelId = params.id

    // Načítame správy s autormi a mentions
    const messages = await Message.query()
      .where('channel_id', channelId)
      .preload('sender')
      .preload('mentions', (q) => q.select('mentionedUserId'))
      .orderBy('id', 'desc')
      .limit(30)

    // Transformujeme do formátu pre frontend
    return messages.map((msg) => ({
      id: msg.id,
      userId: msg.senderId,
      user: msg.sender.nickName,
      text: msg.content,
      mentionedUserIds: msg.mentions.map((m) => m.mentionedUserId),
    }))
  }

  // Vytvorenie novej správy (HTTP POST)
  public async store({ auth, params, request }: any) {
    const channelId = Number(params.id)
    const { content } = request.only(['content'])

    const senderId = auth?.user?.id
    if (!senderId) throw new Error('Používateľ nie je autentifikovaný')

    // Načítame kanál
    const channel = await Channel.findOrFail(channelId)

    // Vytvoríme novú správu
    const message = await Message.create({
      channelId,
      senderId,
      content,
      hasPing: false,
      hasCommand: false,
    })

    // Načítame autora správy
    await message.load('sender')

    // Aktualizujeme čas poslednej aktivity kanála
    channel.lastActiveAt = DateTime.now()
    await channel.save()

    // Vrátime správu vo formáte pre frontend
    return {
      id: message.id,
      userId: senderId,
      user: message.sender.nickName,
      text: message.content,
      mentionedUserIds: [],
    }
  }
}
