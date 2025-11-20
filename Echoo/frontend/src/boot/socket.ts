import io from "socket.io-client"
import { boot } from "quasar/wrappers"

export default boot(({ app }) => {
  const socket = io("http://localhost:3333", {
    transports: ["websocket"],
  })

  console.log("Socket boot loaded:", socket)

  // Globális elérés
  app.config.globalProperties.$socket = socket
})
