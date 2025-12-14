import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import Channel from '#models/channel'
import UserChannel from '#models/user_channel'
import ws from '#services/ws'

export default class AuthController {
  // Prihlásenie
  public async login({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    // Nájdeme používateľa podľa emailu
    const user = await User.findBy('email', email)
    if (!user) {
      return response.status(400).json({ message: 'Invalid email or password' })
    }

    // Overíme heslo hashom
    const isValid = await hash.verify(user.password, password)
    if (!isValid) {
      return response.status(400).json({ message: 'Invalid email or password' })
    }

    // Vygenerujeme bearer token
    const token = await User.accessTokens.create(user)

    return response.json({
      type: 'bearer',
      token: token.value!.release(),
      user,
    })
  }

  // Registrácia
  public async register({ request, response }: HttpContext) {
    const { firstName, lastName, nickname, email, password } = request.only([
      'firstName',
      'lastName',
      'nickname',
      'email',
      'password',
    ])

    try {
      // Zastav ak už existuje email
      const existingEmail = await User.findBy('email', email)
      if (existingEmail) {
        return response.status(400).json({ message: 'This email is already registered' })
      }

      // Zastav ak už existuje prezývka
      const existingNickname = await User.findBy('nick_name', nickname)
      if (existingNickname) {
        return response.status(400).json({ message: 'This nickname is already taken' })
      }

      // Vytvoríme používateľa so statusom online
      const user = await User.create({
        firstName,
        lastName,
        nickName: nickname,
        email,
        password,
        status: 'online',
      })

      // Pridáme do vopred definovaných verejných kanálov
      const targetChannelNames = ['General', 'Development']
      const targetChannels = await Channel.query()
        .whereIn('name', targetChannelNames)
        .andWhere('type', 'public')

      for (const channel of targetChannels) {
        // Nový používateľ vstupuje ako member s notifikáciami all
        await UserChannel.create({
          userId: user.id,
          channelId: channel.id,
          role: 'member',
          notificationSettings: 'all',
        })
      }

      // Token pre okamžité prihlásenie
      const token = await User.accessTokens.create(user)

      // Rozpošleme info o statuse cez WS
      ws.broadcastUserStatus(user.id, user.status)

      return response.created({
        type: 'bearer',
        token: token.value!.release(),
        user,
      })
    } catch (error) {
      console.error('Registration error:', error)
      return response.status(400).json({
        message: 'Registration failed. Please try again.',
      })
    }
  }

  // Odhlásenie
  public async logout({ auth, response }: HttpContext) {
    try {
      const apiAuth: any = auth.use('api')
      const user = auth.user as User | null

      if (user) {
        // Nastavíme status offline a oznámime WS
        user.status = 'offline'
        await user.save()
        ws.broadcastUserStatus(user.id, user.status)
      }

      if (apiAuth.token) {
        // Zrušíme aktívny token
        await apiAuth.token.delete()
      }

      return response.json({ message: 'Logged out successfully' })
    } catch (error) {
      console.error('Logout error:', error)
      return response.status(500).json({
        message: 'Logout failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
