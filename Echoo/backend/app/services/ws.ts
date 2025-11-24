import { Server } from 'socket.io'
import server from '@adonisjs/core/services/server'
import Message from '#models/message'
import MessageMention from '#models/message_mention'
import User from '#models/user'
import { DateTime } from 'luxon'

class Ws {
  io: Server | undefined
  private booted = false

  boot() {
    if (this.booted) return
    this.booted = true

    this.io = new Server(server.getNodeServer(), {
      cors: { origin: '*' },
    })

    this.io.on('connection', (socket) => {
      console.log(`[WS] New client: ${socket.id}`)

      socket.on('join', (room: string) => {
        socket.join(room)
        console.log(`[WS] Joined room: ${room}`)
      })

      socket.on('leave', (room: string) => {
        socket.leave(room)
        console.log(`[WS] Left room: ${room}`)
      })

      socket.on('message', async (data) => {
        const { channelId, userId, text } = data

        try {
          // Extrakcia @nickname-ov zo textu
          const mentionedNicknames = this.extractMentions(text)
          let mentionedUserIds: number[] = []

          // Ak sú nejaké mentions, vyhľadáme používateľov v DB
          if (mentionedNicknames.length > 0) {
            const mentionedUsers = await User.query().whereIn('nickName', mentionedNicknames)

            // Odstránime duplikáty a vylúčime samotného pošilatela
            mentionedUserIds = [
              ...new Set(mentionedUsers.filter((u) => u.id !== userId).map((u) => u.id)),
            ]
          }

          // Vytvoríme správu v databáze
          const message = await Message.create({
            channelId,
            senderId: userId,
            content: text,
            hasPing: mentionedUserIds.length > 0,
            hasCommand: false,
            sentAt: DateTime.now(),
          })

          // Ak sú spomenutí používatelia, uložíme ich do MessageMention tabuľky
          if (mentionedUserIds.length > 0) {
            const mentions = mentionedUserIds.map((mentionedUserId) => ({
              messageId: message.id,
              mentionedUserId,
            }))
            await MessageMention.createMany(mentions)
          }

          // Načítame údaje o pošilateľovi (meno, priezvisko, prezývka)
          await message.load('sender')

          // Pripravíme payload pre klientov
          const messagePayload = {
            id: message.id,
            text: message.content,
            userId: message.senderId,
            user:
              message.sender.nickName || `${message.sender.firstName} ${message.sender.lastName}`,
            channelId: channelId,
            sentAt: message.sentAt,
            isPing: mentionedUserIds.length > 0, // ← PRIDANÉ: flag či správa obsahuje mentions
            mentionedUserIds: mentionedUserIds, // ← Zoznam ID spomenutých používateľov
          }

          // Pošleme správu všetkým klientom v kanáli
          this.io?.to(`channel_${channelId}`).emit('newMessage', messagePayload)

          console.log(`[WS] Message sent`, {
            content: message.content,
            mentions: mentionedNicknames,
            mentionedUserIds: mentionedUserIds,
            isPing: messagePayload.isPing, // ← Debug log
          })
        } catch (error) {
          console.error('[WS] Sending error:', error)
          socket.emit('error', { message: 'Message cannot be sent' })
        }
      })

      socket.on('disconnect', () => {
        console.log(`[WS] Client disconnected: ${socket.id}`)
      })
    })

    console.log('[WS] WebSocket server is running')
  }

  // Extrahuje všetky @nickname z textu správy
  // Príklad: "Ahoj @janko a @marko!" -> ['janko', 'marko']
  private extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g
    const matches = text.matchAll(mentionRegex)
    return Array.from(matches, (m) => m[1])
  }
}

export default new Ws()
