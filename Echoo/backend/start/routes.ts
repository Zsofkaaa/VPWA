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

// Dynamické importy controllerov
const MessagesController = () => import('#controllers/messages_controller')
const AuthController = () => import('#controllers/auth_controller')
const ChannelsController = () => import('#controllers/channels_controller')
const UserChannelController = () => import('#controllers/user_channel_controller')
const InvitesController = () => import('#controllers/invites_controller')

import UserControllerClass from '#controllers/user_controller'
const userController = new UserControllerClass()

// Channels list
router.get('/channels', async () => {
  try {
    return await Channel.query().orderBy('id', 'asc')
  } catch (error: any) {
    return { error: 'Unable to fetch channels', details: error.message }
  }
})

// Messages for a channel
router.get('/channels/:id/messages', async (ctx) => {
  const module = await MessagesController()
  const controller = new module.default()
  return controller.index({
    params: { id: Number(ctx.params.id) },
    request: ctx.request,
  })
})

// Commands
router.get('/api/commands', '#controllers/commands_controller.index')

// Post message to channel (auth required)
router
  .post('/channels/:id/messages', async ({ auth, params, request }) => {
    const module = await MessagesController()
    const controller = new module.default()
    return controller.store({ auth, params, request })
  })
  .middleware([middleware.auth()])

// Auth routes
router.post('/auth/login', [AuthController, 'login'])
router.post('/auth/register', [AuthController, 'register'])
router.post('/auth/logout', [AuthController, 'logout']).middleware([middleware.auth()])

// Create channel
router.post('/channels', [ChannelsController, 'store']).middleware([middleware.auth()])

// Join user to channel
router
  .post('/user_channel', async ({ request, auth }) => {
    const module = await UserChannelController()
    const controller = new module.default()
    return controller.store({ request, auth })
  })
  .middleware([middleware.auth()])

// Users list
router.get('/users', async (ctx) => userController.index(ctx)).middleware([middleware.auth()])

// Current user
router.get('/me', async (ctx) => userController.me(ctx)).middleware([middleware.auth()])

// Update user
router
  .put('/user/update', async (ctx) => userController.update(ctx))
  .middleware([middleware.auth()])

// Get channel members
router.get('/channels/:id/members', async (ctx) => {
  const module = await UserChannelController()
  const controller = new module.default()
  return controller.members(ctx)
})

// Leave channel
router
  .delete('/channels/:id/leave', async (ctx) => {
    const module = await UserChannelController()
    const controller = new module.default()
    return controller.leave(ctx)
  })
  .middleware([middleware.auth()])

// Get user's channels
router
  .get('/user/channels', async (ctx) => {
    const module = await UserChannelController()
    const controller = new module.default()
    return controller.getUserChannels(ctx)
  })
  .middleware([middleware.auth()])

// Delete channel
router.delete('/channels/:id', [ChannelsController, 'destroy']).middleware([middleware.auth()])

// Ban user from channel
router
  .delete('/channels/:id/ban/:userId', async (ctx) => {
    const module = await UserChannelController()
    const controller = new module.default()
    return controller.ban(ctx)
  })
  .middleware([middleware.auth()])

// Kick user from channel
router
  .delete('/channels/:id/kick/:userId', async (ctx) => {
    const module = await UserChannelController()
    const controller = new module.default()
    return controller.kick(ctx)
  })
  .middleware([middleware.auth()])

// Notification settings
router
  .get('/user_channel/:userId/:channelId', async (ctx) => {
    const module = await UserChannelController()
    const controller = new module.default()
    return controller.getNotificationSettings(ctx)
  })
  .middleware([middleware.auth()])

router
  .put('/user_channel/:userId/:channelId', async (ctx) => {
    const module = await UserChannelController()
    const controller = new module.default()
    return controller.updateNotificationSettings(ctx)
  })
  .middleware([middleware.auth()])

// Invite to channel
router
  .post('/channels/:id/invite', async (ctx) => {
    const module = await InvitesController()
    const controller = new module.default()
    return controller.invite(ctx)
  })
  .middleware([middleware.auth()])

// My invites
router
  .get('/invites/me', async (ctx) => {
    const module = await InvitesController()
    const controller = new module.default()
    return controller.myInvites(ctx)
  })
  .middleware([middleware.auth()])

// Accept invite
router
  .post('/invites/:id/accept', async (ctx) => {
    const module = await InvitesController()
    const controller = new module.default()
    return controller.accept(ctx)
  })
  .middleware([middleware.auth()])

// Reject invite
router
  .post('/invites/:id/reject', async (ctx) => {
    const module = await InvitesController()
    const controller = new module.default()
    return controller.reject(ctx)
  })
  .middleware([middleware.auth()])
