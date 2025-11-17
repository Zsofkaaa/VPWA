import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import Channel from '#models/channel'
import UserChannel from '#models/user_channel'

export default class AuthController {
  public async login({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    const user = await User.findBy('email', email)
    if (!user) {
      // NE használj .unauthorized(), csak sima response
      return response.status(400).json({
        message: 'Invalid email or password',
      })
    }

    const isValid = await hash.verify(user.password, password)

    if (!isValid) {
      return response.status(400).json({
        message: 'Invalid email or password',
      })
    }

    const token = await User.accessTokens.create(user)

    return response.json({
      type: 'bearer',
      token: token.value!.release(),
      user,
    })
  }

  public async register({ request, response }: HttpContext) {
    const { firstName, lastName, nickname, email, password } = request.only([
      'firstName',
      'lastName',
      'nickname',
      'email',
      'password',
    ])

    try {
      // Ellenőrizd hogy létezik-e már az email
      const existingEmail = await User.findBy('email', email)
      if (existingEmail) {
        return response.status(400).json({
          message: 'This email is already registered',
        })
      }

      // Ellenőrizd hogy létezik-e már a nickname
      const existingNickname = await User.findBy('nick_name', nickname)
      if (existingNickname) {
        return response.status(400).json({
          message: 'This nickname is already taken',
        })
      }

      const user = await User.create({
        firstName,
        lastName,
        nickName: nickname,
        email,
        password,
      })

      // Automatikus beléptetés minden public csatornába
      const publicChannels = await Channel.query().where('type', 'public')

      for (const channel of publicChannels) {
        await UserChannel.create({
          userId: user.id,
          channelId: channel.id,
          role: 'member',
          notificationSettings: 'all',
          kickCount: 0,
        })
      }

      const token = await User.accessTokens.create(user)

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
}
