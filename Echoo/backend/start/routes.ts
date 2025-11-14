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
const AuthController = () => import('#controllers/auth_controller')

// Alap route
router.get('/', async () => {
  return {
    hello: 'world',
  }
})

// API route a csatornák lekérésére
router.get('/channels', async () => {
  try {
    const channels = await Channel.query().orderBy('id', 'asc')
    return channels
  } catch (error) {
    return { error: 'Unable to fetch channels', details: error.message }
  }
})

router.post('/auth/login', [AuthController, 'login'])
router.post('/auth/register', [AuthController, 'register'])
