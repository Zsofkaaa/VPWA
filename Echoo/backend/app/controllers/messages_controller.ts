import Message from '#models/message'
import Channel from '#models/channel'
import User from '#models/user'
import MessageMention from '#models/message_mention'
import { DateTime } from 'luxon'

export default class MessagesController {
  // Pomocná funkcia na extrakciu mentions
  private async extractMentions(content: string) {
    // Najprv skúsime nájsť všetkých používateľov
    const allUsers = await User.all()
    const mentionedUserIds: number[] = []

    // Regex pre @ mentions - zachytí aj viacrozmerné mená
    // Hľadáme @username alebo @"user name" alebo @'user name'
    const mentionRegex = /@(?:"([^"]+)"|'([^']+)'|(\S+))/g

    let match
    while ((match = mentionRegex.exec(content)) !== null) {
      // match[1] = text v úvodzovkách ", match[2] = text v úvodzovkách ', match[3] = jedno slovo
      const mentionText = (match[1] || match[2] || match[3] || '').toLowerCase()

      // Nájdeme používateľa s touto prezývkou
      const user = allUsers.find((u) => u.nickName.toLowerCase() === mentionText)
      if (user && !mentionedUserIds.includes(user.id)) {
        mentionedUserIds.push(user.id)
      }
    }

    return mentionedUserIds
  }

  public async index({ params, request }: { params: { id: number }; request: any }) {
    const channelId = params.id
    const before = request.input('before')
    const limit = Number(request.input('limit', 30))

    let query = Message.query()
      .where('channel_id', channelId)
      .preload('sender')
      .preload('mentions')
      .orderBy('id', 'desc')
      .limit(limit)

    if (before) {
      query = query.where('id', '<', Number(before))
    }

    const messages = await query

    const result = messages.map((msg) => ({
      id: msg.id,
      userId: msg.senderId,
      user: msg.sender.nickName,
      text: msg.content,
      mentionedUserIds: msg.mentions.map((m) => m.mentionedUserId),
    }))

    return result
  }

  public async store({ auth, params, request }: any) {
    const channelId = Number(params.id)
    const { content } = request.only(['content'])

    const senderId = auth?.user?.id
    if (!senderId) throw new Error('Používateľ nie je autentifikovaný')

    const channel = await Channel.findOrFail(channelId)

    // Vytvoríme správu
    const message = await Message.create({
      channelId,
      senderId,
      content,
      hasPing: false,
      // hasCommand: false,
    })

    await message.load('sender')

    // Extrahovanie a uloženie mentions
    const mentionedUserIds = await this.extractMentions(content)

    if (mentionedUserIds.length > 0) {
      // Uložíme mentions do databázy
      for (const userId of mentionedUserIds) {
        await MessageMention.create({
          messageId: message.id,
          mentionedUserId: userId,
        })
      }

      message.hasPing = true
      await message.save()
    }

    // Aktualizujeme kanál
    channel.lastActiveAt = DateTime.now()
    await channel.save()

    return {
      id: message.id,
      userId: senderId,
      user: message.sender.nickName,
      text: message.content,
      mentionedUserIds: mentionedUserIds,
    }
  }
}
