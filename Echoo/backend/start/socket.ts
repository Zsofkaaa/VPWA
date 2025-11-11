import { createServer } from 'node:http'
import { Server } from 'socket.io'

// Ha az Adonis CLI (ace) fut, akkor ne indítsd el a socket szervert
const isAceCommand = process.argv.some((arg) => arg.includes('ace'))

if (!isAceCommand) {
  const httpServer = createServer()
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  })

  io.on('connection', (socket) => {
    console.log('✅ Socket connected:', socket.id)

    socket.on('message', (data) => {
      console.log('💬 Message received:', data)
      socket.broadcast.emit('message', data)
    })

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected:', socket.id)
    })
  })

  httpServer.listen(3334, () => {
    console.log('🚀 WebSocket server running on port 3334')
  })
}
