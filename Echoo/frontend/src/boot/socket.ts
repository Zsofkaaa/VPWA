import io from "socket.io-client"
import { boot } from "quasar/wrappers"

export default boot(({ app }) => {
  const socket = io("http://localhost:3333", {
  //const socket = io("https://abc123.ngrok.io", {
    transports: ["websocket", "polling"], // Polling is hozzáadva fallback-nek
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10
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

  console.log("[SOCKET] Socket boot loaded")

  // Globális elérés
  app.config.globalProperties.$socket = socket
})
