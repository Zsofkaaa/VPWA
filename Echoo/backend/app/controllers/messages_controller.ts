import Message from '#models/message'
import Channel from '#models/channel'
import { DateTime } from 'luxon'

export default class MessagesController {
  // Získanie posledných správ z kanála s podporou infinite scroll
  public async index({ params, request }: { params: { id: number }; request: any }) {
    const channelId = params.id

    // Parametre pre pagination
    const before = request.input('before') // ID správy, pred ktorou chceme načítať staršie
    const limit = Number(request.input('limit', 30)) // Počet správ (default 30)

    /*
    console.log('[MESSAGES CONTROLLER] Loading messages:', {
      channelId,
      before,
      limit,
    })
    */

    let query = Message.query()
      .where('channel_id', channelId)
      .preload('sender')
      .preload('mentions', (q) => q.select('mentionedUserId'))
      .orderBy('id', 'desc')
      .limit(limit)

    // Ak je zadané before, načítame len správy staršie ako táto
    if (before) {
      query = query.where('id', '<', Number(before))
    }

    const messages = await query
    // console.log('[MESSAGES CONTROLLER] Found messages:', messages.length)

    // Transformujeme do formátu pre frontend
    const result = messages.map((msg) => ({
      id: msg.id,
      userId: msg.senderId,
      user: msg.sender.nickName,
      text: msg.content,
      mentionedUserIds: msg.mentions.map((m) => m.mentionedUserId),
    }))

    // console.log('[MESSAGES CONTROLLER] Returning messages:', result.length)
    return result
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
