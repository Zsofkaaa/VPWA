import io from "socket.io-client"
import { boot } from "quasar/wrappers"
import API_URL from '../config/api' // Import z configu

export default boot(({ app }) => {
  console.log("[SOCKET] Using API_URL from config:", API_URL)

  // Vytvorenie socket.io klienta s nastaveniami pripojenia
  const socket = io(API_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  })

  // Po úspešnom pripojení k serveru
  socket.on('connect', () => {
    console.log('[SOCKET] Connected to server! Socket ID:', socket.id)
  })

  // Po odpojení od servera
  socket.on('disconnect', (reason: unknown) => {
    console.log('[SOCKET] Disconnected from server. Reason:', reason)
  })

  // Pri chybe pripojenia
  socket.on('connect_error', (error: { message: unknown }) => {
    console.error('[SOCKET] Connection error:', error.message)
  })

  // Informácia o načítaní socket boot súboru
  console.log("[SOCKET] Socket boot loaded, connecting to:", API_URL)

  // Registrácia $socket do globálnych vlastností Vue aplikácie
  app.config.globalProperties.$socket = socket
})
