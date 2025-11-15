import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class AuthController {
  public async login({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    const user = await User.findBy('email', email)
    if (!user) {
      return response.unauthorized({ error: 'Invalid credentials' })
    }

    // Add logging to debug
    console.log('Login attempt:', { email, providedPassword: password })
    console.log('Stored hash:', user.password)

    const isValid = await hash.verify(user.password, password)
    console.log('Password valid:', isValid)

    if (!isValid) {
      return response.unauthorized({ error: 'Invalid credentials' })
    }

    const token = await User.accessTokens.create(user)

    const responseData = { 
      type: 'bearer',
      token: token.value!.release(),
      user,
    }

    console.log('Sending response:', responseData)

    return responseData
  }

  public async register({ request, response }: HttpContext) {
    const { firstName, lastName, nickname, email, password } = request.only([
      'firstName', 'lastName', 'nickname', 'email', 'password'
    ])
    
    try {
      // Log what we're creating
      console.log('Creating user:', { firstName, lastName, nickname, email })
      
      const user = await User.create({ 
        firstName, 
        lastName, 
        nickName: nickname,
        email, 
        password // Will be auto-hashed by beforeSave hook
      })
      
      console.log('User created with hashed password')
      
      const token = await User.accessTokens.create(user)
      
      return response.created({ 
        type: 'bearer',
        token: token.value!.release(),
        user 
      })
    } catch (error) {
      console.error('Registration error:', error)
      return response.badRequest({ error: error.message })
    }
  }
}
