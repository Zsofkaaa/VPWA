import { Server } from 'socket.io'
import server from '@adonisjs/core/services/server'

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
      console.log(`[WS] Új kliens csatlakozott: ${socket.id}`)

      socket.on('join', (room: string) => {
        socket.join(room)
        console.log(`[WS] Csatlakozott a room-hoz: ${room}`)
      })

      socket.on('message', (data) => {
        const { channelId, ...msg } = data
        console.log(`[WS] Üzenet a channel_${channelId}-ban:`, msg)
        this.io?.to(`channel_${channelId}`).emit('newMessage', msg)
      })
    })

    console.log('[WS] WebSocket szerver elindult ✅')
  }
}

export default new Ws()
