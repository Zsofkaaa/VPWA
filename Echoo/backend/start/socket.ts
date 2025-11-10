import { Server } from 'socket.io'
import http from 'node:http'

const httpServer = http.createServer()
const io = new Server(httpServer, {
  cors: {
    origin: '*', // alebo frontend url
  },
})

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id)

  socket.on('message', (data: string) => {
    console.log('💬 Message:', data)
    socket.broadcast.emit('message', data)
  })

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id)
  })
})

// Indítás
httpServer.listen(3334, () => {
  console.log('WebSocket server running on port 3334')
})

export default io
