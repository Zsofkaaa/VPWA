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
      cors: {
        // ⭐ Ugyanaz mint HTTP CORS, de callback nélkül
        origin: (origin, callback) => {
          if (!origin) return callback(null, true)

          try {
            const url = new URL(origin)
            const hostname = url.hostname

            // Localhost
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
              return callback(null, true)
            }

            // Private networks (RFC 1918)
            if (
              /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
              /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
              /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)
            ) {
              return callback(null, true)
            }

            console.log('[WS] ❌ Rejected origin:', origin)
            callback(new Error('Not allowed by CORS'))
          } catch (err) {
            console.error('[WS] ⚠️ Error parsing origin:', origin, err)
            callback(new Error('Invalid origin'))
          }
        },
        credentials: true,
        methods: ['GET', 'POST'],
      },
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

      // User joins their personal room for invite notifications
      socket.on('join_user_room', (userId: number) => {
        const userRoom = `user_${userId}`
        socket.join(userRoom)
        console.log(`[WS] User ${userId} joined personal room: ${userRoom}`)
      })

      socket.on('typing', (data: { channelId: number; user: string }) => {
        const room = `channel_${data.channelId}`
        // console.log('TYPING EVENT:', data, ' -> broadcasting to ', room)

        // Broadcast mindenki másnak a roomban, kivéve a küldőt
        socket.to(room).emit('user_typing', { user: data.user, channelId: data.channelId })

        // Opció: automatikus stop 5 másodperc után, ha nem jön új gépelés
        setTimeout(() => {
          socket.to(room).emit('user_stop_typing', { user: data.user })
        }, 5000)
      })

      socket.on('stop_typing', (data: { channelId: number; user: string }) => {
        const room = `channel_${data.channelId}`
        // Broadcast stop typing with username
        socket.to(room).emit('user_stop_typing', { user: data.user })
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
          // Vylepšené extrahovanie mentions - podporuje aj viacrozmerné mená
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

  // Send invite notification to specific user
  sendInviteNotification(userId: number, inviteData: any) {
    const userRoom = `user_${userId}`
    // console.log(`[WS] Sending invite notification to user ${userId} in room ${userRoom}`)
    this.io?.to(userRoom).emit('new_invite', inviteData)
  }

  // Notify user about channel updates (when accepted invite)
  sendChannelUpdate(userId: number, channelData: any) {
    const userRoom = `user_${userId}`
    // console.log(`[WS] Sending channel update to user ${userId}`)
    this.io?.to(userRoom).emit('channel_joined', channelData)
  }

  // Notify all users in channel that it was deleted
  sendChannelDeleted(channelId: number, channelName: string, deletedBy: number) {
    const channelRoom = `channel_${channelId}`
    // console.log(`[WS] Sending channel deleted notification to channel ${channelId}`)
    this.io?.to(channelRoom).emit('channel_deleted', {
      channelId,
      channelName,
      deletedBy,
    })
  }

  // Notify user that they were kicked from channel
  sendUserKicked(userId: number, channelId: number, channelName: string) {
    const userRoom = `user_${userId}`
    // console.log(`[WS] Sending user kicked notification to user ${userId}`)
    this.io?.to(userRoom).emit('user_kicked', {
      userId,
      channelId,
      channelName,
    })
  }

  // Notify user that they were banned from channel
  sendUserBanned(userId: number, channelId: number, channelName: string) {
    const userRoom = `user_${userId}`
    console.log(`[WS] Sending user banned notification to user ${userId}`)
    this.io?.to(userRoom).emit('user_banned', {
      userId,
      channelId,
      channelName,
    })
  }

  // Vylepšená funkcia na extrakciu všetkých @nickname zo správy
  // Podporuje aj @"user name" a @'user name' formát
  private extractMentions(text: string): string[] {
    // Regex pre @"user name", @'user name' alebo @username
    const mentionRegex = /@(?:"([^"]+)"|'([^']+)'|(\S+))/g
    const matches = text.matchAll(mentionRegex)
    const mentions: string[] = []

    for (const match of matches) {
      // match[1] = quoted with ", match[2] = quoted with ', match[3] = single word
      const mention = match[1] || match[2] || match[3]
      if (mention) {
        mentions.push(mention)
      }
    }

    return mentions
  }
}

export default new Ws()
