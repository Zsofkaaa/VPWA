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
const ChannelsController = () => import('#controllers/channels_controller')
const UserChannelController = () => import('#controllers/user_channel_controller')
const InvitesController = () => import('#controllers/invites_controller')

import UserControllerClass from '#controllers/user_controller'
const userController = new UserControllerClass()

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

router.get('/channels/:id/messages', async (ctx) => {
  const module = await MessagesController()
  const ControllerClass = module.default
  const controllerInstance = new ControllerClass()
  return controllerInstance.index({ params: { id: Number(ctx.params.id) } })
})

router.get('/api/commands', '#controllers/commands_controller.index')

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
router.post('/auth/logout', [AuthController, 'logout']).middleware([middleware.auth()])

router.post('/channels', [ChannelsController, 'store']).middleware([middleware.auth()])

router
  .post('/user_channel', async ({ request, auth }) => {
    const module = await UserChannelController()
    const controllerInstance = new module.default()
    return controllerInstance.store({ request, auth })
  })
  .middleware([middleware.auth()])

router
  .get('/users', async (ctx) => {
    return userController.index(ctx)
  })
  .middleware([middleware.auth()])

router
  .get('/me', async (ctx) => {
    return userController.me(ctx)
  })
  .middleware([middleware.auth()])

router
  .put('/user/update', async (ctx) => userController.update(ctx))
  .middleware([middleware.auth()])

router.get('/channels/:id/members', async (ctx) => {
  const module = await UserChannelController()
  const ControllerClass = module.default
  const controllerInstance = new ControllerClass()
  return controllerInstance.members(ctx)
})

router
  .delete('/channels/:id/leave', async (ctx) => {
    const module = await UserChannelController()
    const ControllerClass = module.default
    const controllerInstance = new ControllerClass()
    return controllerInstance.leave(ctx)
  })
  .middleware([middleware.auth()])

router
  .get('/user/channels', async (ctx) => {
    const module = await UserChannelController()
    const controllerInstance = new module.default()
    return controllerInstance.getUserChannels(ctx)
  })
  .middleware([middleware.auth()])

router.delete('/channels/:id', [ChannelsController, 'destroy']).middleware([middleware.auth()])

router
  .delete('/channels/:id/ban/:userId', async (ctx) => {
    const module = await UserChannelController()
    const ControllerClass = module.default
    const controllerInstance = new ControllerClass()
    return controllerInstance.ban(ctx)
  })
  .middleware([middleware.auth()])

router
  .delete('/channels/:id/kick/:userId', async (ctx) => {
    const module = await UserChannelController()
    const ControllerClass = module.default
    const controllerInstance = new ControllerClass()
    return controllerInstance.kick(ctx)
  })
  .middleware([middleware.auth()])

// ROUTES PRE NOTIFICATION SETTINGS
router
  .get('/user_channel/:userId/:channelId', async (ctx) => {
    const module = await UserChannelController()
    const ControllerClass = module.default
    const controllerInstance = new ControllerClass()
    return controllerInstance.getNotificationSettings(ctx)
  })
  .middleware([middleware.auth()])

router
  .put('/user_channel/:userId/:channelId', async (ctx) => {
    const module = await UserChannelController()
    const ControllerClass = module.default
    const controllerInstance = new ControllerClass()
    return controllerInstance.updateNotificationSettings(ctx)
  })
  .middleware([middleware.auth()])

router
  .post('/channels/:id/invite', async (ctx) => {
    const module = await InvitesController()
    const ControllerClass = module.default
    const controller = new ControllerClass()
    return controller.invite(ctx)
  })
  .middleware([middleware.auth()])

router
  .get('/invites/me', async (ctx) => {
    const module = await InvitesController()
    const ControllerClass = module.default
    const controller = new ControllerClass()
    return controller.myInvites(ctx)
  })
  .middleware([middleware.auth()])

router
  .post('/invites/:id/accept', async (ctx) => {
    const module = await InvitesController()
    const ControllerClass = module.default
    const controller = new ControllerClass()
    return controller.accept(ctx)
  })
  .middleware([middleware.auth()])

router
  .post('/invites/:id/reject', async (ctx) => {
    const module = await InvitesController()
    const ControllerClass = module.default
    const controller = new ControllerClass()
    return controller.reject(ctx)
  })
  .middleware([middleware.auth()])
