import io from "socket.io-client"
import { boot } from "quasar/wrappers"
import API_URL from '../config/api' // ⭐ IMPORT a config-ból!

export default boot(({ app }) => {
  console.log("[SOCKET] Using API_URL from config:", API_URL)

  const socket = io(API_URL, { // ⭐ Használd a config/api.ts-ből!
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
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

  console.log("[SOCKET] Socket boot loaded, connecting to:", API_URL)

  // Globális elérés
  app.config.globalProperties.$socket = socket
})
