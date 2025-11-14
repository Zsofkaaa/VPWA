import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class AuthController {
  public async login({ request, response, auth }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    const user = await User.findBy('email', email)
    if (!user) {
      return response.unauthorized({ error: 'Invalid credentials' })
    }

    const isValid = await hash.verify(user.password, password)
    if (!isValid) {
      return response.unauthorized({ error: 'Invalid credentials' })
    }

    const token = await auth.use('api').createToken(user)

    return { user, token }
  }

  public async register({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    try {
      const user = await User.create({ email, password })
      return response.created({ user })
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }
}
