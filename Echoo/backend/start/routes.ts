/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import Channel from '#models/channel'
import { middleware } from '#start/kernel'
const MessagesController = () => import('#controllers/messages_controller')
const AuthController = () => import('#controllers/auth_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.get('/channels', async () => {
  try {
    const channels = await Channel.query().orderBy('id', 'asc')
    return channels
  } catch (error) {
    return { error: 'Unable to fetch channels', details: error.message }
  }
})

//router.get('/channels/:id/messages', [MessagesController, 'index'])

router.get('/channels/:id/messages', async (ctx) => {
  const module = await MessagesController()
  const ControllerClass = module.default
  const controllerInstance = new ControllerClass()
  return controllerInstance.index({ params: { id: Number(ctx.params.id) } })
})

router
  .post('/channels/:id/messages', async ({ auth, params, request }) => {
    const module = await MessagesController()
    const ControllerClass = module.default
    const controllerInstance = new ControllerClass()

    return controllerInstance.store({ auth, params, request })
  })
  .middleware([middleware.auth()])

router.post('/auth/login', [AuthController, 'login'])
router.post('/auth/register', [AuthController, 'register'])
