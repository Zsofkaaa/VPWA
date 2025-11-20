import { boot } from 'quasar/wrappers'
import io from 'socket.io-client'

export default boot(({ app }) => {
  const socket = io('http://localhost:3333', {
    transports: ['websocket']
  })

  // Globális elérés
  app.config.globalProperties.$socket = socket
})
