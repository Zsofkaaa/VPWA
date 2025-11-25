import router from '@adonisjs/core/services/router'
import server from '@adonisjs/core/services/server'
import app from '@adonisjs/core/services/app'
import { startCronJobs } from './cron.js'

// Nastavenie globálneho error handlera
server.errorHandler(() => import('#exceptions/handler'))

// Globálne middleware pre všetky requesty
server.use([
  () => import('#middleware/container_bindings_middleware'),
  () => import('#middleware/force_json_response_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
])

// Middleware pre router (body parser, auth)
router.use([
  () => import('@adonisjs/core/bodyparser_middleware'),
  () => import('@adonisjs/auth/initialize_auth_middleware'),
])

// Named middleware (napr. auth)
export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware'),
})

// Spustenie cron jobov
startCronJobs()

// Inicializácia WebSocket po spustení aplikácie
app.ready(() => {
  import('#services/ws').then(({ default: Ws }) => {
    Ws.boot()
  })
})
