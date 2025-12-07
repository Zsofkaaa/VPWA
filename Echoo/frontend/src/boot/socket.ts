import io from "socket.io-client"
import { boot } from "quasar/wrappers"

export default boot(({ app }) => {
  const SOCKET_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3333'

  const socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    // ⭐ withCredentials törölve - nem kell Socket.IO-hoz
  })

  socket.on('connect', () => {
    console.log('[SOCKET] ✅ Connected to server! Socket ID:', socket.id)
  })

  socket.on('disconnect', (reason: unknown) => {
    console.log('[SOCKET] ❌ Disconnected from server. Reason:', reason)
  })

  socket.on('connect_error', (error: { message: unknown }) => {
    console.error('[SOCKET] ⚠️ Connection error:', error.message)
  })

  console.log("[SOCKET] Socket boot loaded, connecting to:", SOCKET_URL)

  // Globális elérés
  app.config.globalProperties.$socket = socket
})
