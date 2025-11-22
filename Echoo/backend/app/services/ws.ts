import { Server } from 'socket.io'
import server from '@adonisjs/core/services/server'
import Message from '#models/message'
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

      socket.on('message', async (data) => {
        const { channelId, userId, text } = data

        // 1️⃣ Mentés az adatbázisba
        const message = await Message.create({
          channelId,
          senderId: userId,
          content: text,
          hasPing: false,
          hasCommand: false,
          sentAt: DateTime.now(),
        })

        // 2️⃣ Betöltjük a sender-t a relációval
        await message.load('sender')

        // 3️⃣ Küldés a csatorna minden tagjának
        this.io?.to(`channel_${channelId}`).emit('newMessage', {
          id: message.id,
          text: message.content,
          userId: message.senderId,
          user: message.sender.nickName || `${message.sender.firstName} ${message.sender.lastName}`,
          channelId: channelId,
          sentAt: message.sentAt,
        })

        console.log(`[WS] Message sent`, message.content)
      })
    })

    console.log('[WS] WebSocket server running')
  }
}

export default new Ws()
