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

// Zoznam kanálov
router.get('/channels', async () => {
  try {
    return await Channel.query().orderBy('id', 'asc')
  } catch (error: any) {
    return { error: 'Unable to fetch channels', details: error.message }
  }
})

// Správy pre kanál
router.get('/channels/:id/messages', async (ctx) => {
  const module = await MessagesController()
  const controller = new module.default()
  return controller.index({
    params: { id: Number(ctx.params.id) },
    request: ctx.request,
  })
})

// Príkazy
router.get('/api/commands', '#controllers/commands_controller.index')

// Odoslanie správy do kanála (vyžaduje autentifikáciu)
router
  .post('/channels/:id/messages', async ({ auth, params, request }) => {
    const module = await MessagesController()
    const controller = new module.default()
    return controller.store({ auth, params, request })
  })
  .middleware([middleware.auth()])

// Autentifikačné trasy
router.post('/auth/login', [AuthController, 'login'])
router.post('/auth/register', [AuthController, 'register'])
router.post('/auth/logout', [AuthController, 'logout']).middleware([middleware.auth()])

// Vytvorenie kanála
router.post('/channels', [ChannelsController, 'store']).middleware([middleware.auth()])

// Pridanie používateľa do kanála
router
  .post('/user_channel', async ({ request, auth }) => {
    const module = await UserChannelController()
    const controller = new module.default()
    return controller.store({ request, auth })
  })
  .middleware([middleware.auth()])

// Zoznam používateľov
router.get('/users', async (ctx) => userController.index(ctx)).middleware([middleware.auth()])

// Aktuálny používateľ
router.get('/me', async (ctx) => userController.me(ctx)).middleware([middleware.auth()])

// Aktualizácia používateľa
router
  .put('/user/update', async (ctx) => userController.update(ctx))
  .middleware([middleware.auth()])

// Aktualizácia statusu používateľa
router
  .put('/user/status', async (ctx) => userController.updateStatus(ctx))
  .middleware([middleware.auth()])

// Získanie členov kanála
router.get('/channels/:id/members', async (ctx) => {
  const module = await UserChannelController()
  const controller = new module.default()
  return controller.members(ctx)
})

// Opustenie kanála
router
  .delete('/channels/:id/leave', async (ctx) => {
    const module = await UserChannelController()
    const controller = new module.default()
    return controller.leave(ctx)
  })
  .middleware([middleware.auth()])

// Získanie kanálov používateľa
router
  .get('/user/channels', async (ctx) => {
    const module = await UserChannelController()
    const controller = new module.default()
    return controller.getUserChannels(ctx)
  })
  .middleware([middleware.auth()])

// Zmazanie kanála
router.delete('/channels/:id', [ChannelsController, 'destroy']).middleware([middleware.auth()])

// Zabanovanie používateľa z kanála
router
  .delete('/channels/:id/ban/:userId', async (ctx) => {
    const module = await UserChannelController()
    const controller = new module.default()
    return controller.ban(ctx)
  })
  .middleware([middleware.auth()])

// Vyhodenie používateľa z kanála
router
  .delete('/channels/:id/kick/:userId', async (ctx) => {
    const module = await UserChannelController()
    const controller = new module.default()
    return controller.kick(ctx)
  })
  .middleware([middleware.auth()])

// Nastavenie notifikácií
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

// Pozvanie do kanála
router
  .post('/channels/:id/invite', async (ctx) => {
    const module = await InvitesController()
    const controller = new module.default()
    return controller.invite(ctx)
  })
  .middleware([middleware.auth()])

// Moje pozvánky
router
  .get('/invites/me', async (ctx) => {
    const module = await InvitesController()
    const controller = new module.default()
    return controller.myInvites(ctx)
  })
  .middleware([middleware.auth()])

// Prijatie pozvánky
router
  .post('/invites/:id/accept', async (ctx) => {
    const module = await InvitesController()
    const controller = new module.default()
    return controller.accept(ctx)
  })
  .middleware([middleware.auth()])

// Odmietnutie pozvánky
router
  .post('/invites/:id/reject', async (ctx) => {
    const module = await InvitesController()
    const controller = new module.default()
    return controller.reject(ctx)
  })
  .middleware([middleware.auth()])
