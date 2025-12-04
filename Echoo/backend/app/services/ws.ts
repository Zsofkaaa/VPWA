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

    // Inicializácia Socket.IO
    this.io = new Server(server.getNodeServer(), {
      cors: { origin: '*' },
    })

    this.io.on('connection', (socket) => {
      // console.log(`[WS] New client: ${socket.id}`)

      socket.on('join', (room: string) => {
        socket.join(room)
        // console.log(`[WS] Joined room: ${room}`)
      })

      socket.on('leave', (room: string) => {
        socket.leave(room)
        // console.log(`[WS] Left room: ${room}`)
      })

      socket.on('typing', (data: { channelId: number; user: string }) => {
        const room = `channel_${data.channelId}`
        // console.log('TYPING EVENT:', data, ' -> broadcasting to ', room)

        // Broadcast mindenki másnak a roomban, kivéve a küldőt
        socket.to(room).emit('user_typing', { user: data.user, channelId: data.channelId })

        // Opció: automatikus stop 5 másodperc után, ha nem jön új gépelés
        setTimeout(() => {
          socket.to(room).emit('user_stop_typing')
        }, 5000)
      })

      socket.on('stop_typing', (data: { channelId: number }) => {
        const room = `channel_${data.channelId}`
        socket.to(room).emit('user_stop_typing')
      })

      socket.on('typing_content', (data: { channelId: number; user: string; content: string }) => {
        const room = `channel_${data.channelId}`
        // console.log('[WS] Typing content from', data.user, ':', data.content)

        // Broadcast everyone else in the room
        socket.to(room).emit('user_typing_content', {
          user: data.user,
          channelId: data.channelId,
          content: data.content,
        })
      })

      socket.on('message', async (data) => {
        const { channelId, userId, text } = data

        try {
          // Extrahuje všetky @nickname
          const mentionedNicknames = this.extractMentions(text)
          let mentionedUserIds: number[] = []

          if (mentionedNicknames.length > 0) {
            const mentionedUsers = await User.query().whereIn('nickName', mentionedNicknames)

            // Odstránenie duplikátov a vylúčenie samotného pošliteľa
            mentionedUserIds = [
              ...new Set(mentionedUsers.filter((u) => u.id !== userId).map((u) => u.id)),
            ]
          }

          // Uložíme správu do DB
          const message = await Message.create({
            channelId,
            senderId: userId,
            content: text,
            hasPing: mentionedUserIds.length > 0,
            hasCommand: false,
            sentAt: DateTime.now(),
          })

          // Uložíme zmienky do MessageMention tabuľky
          if (mentionedUserIds.length > 0) {
            const mentions = mentionedUserIds.map((mentionedUserId) => ({
              messageId: message.id,
              mentionedUserId,
            }))
            await MessageMention.createMany(mentions)
          }

          await message.load('sender')

          // Payload pre klientov
          const messagePayload = {
            id: message.id,
            text: message.content,
            userId: message.senderId,
            user:
              message.sender.nickName || `${message.sender.firstName} ${message.sender.lastName}`,
            channelId,
            sentAt: message.sentAt,
            isPing: mentionedUserIds.length > 0,
            mentionedUserIds,
          }

          // Pošleme správu všetkým klientom v kanáli
          this.io?.to(`channel_${channelId}`).emit('newMessage', messagePayload)

          // console.log(`[WS] Message sent`, {
          //   content: message.content,
          //   mentions: mentionedNicknames,
          //   mentionedUserIds,
          //   isPing: messagePayload.isPing,
          // })
        } catch (error) {
          console.error('[WS] Sending error:', error)
          socket.emit('error', { message: 'Message cannot be sent' })
        }
      })

      // socket.on('disconnect', () => {
      //   console.log(`[WS] Client disconnected: ${socket.id}`)
      // })
    })

    console.log('[WS] WebSocket server is running')
  }

  // Funkcia na extrakciu všetkých @nickname zo správy
  private extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g
    const matches = text.matchAll(mentionRegex)
    return Array.from(matches, (m) => m[1])
  }
}

export default new Ws()
