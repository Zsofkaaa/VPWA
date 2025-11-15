import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class AuthController {
  public async login({ request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    const user = await User.findBy('email', email)
    if (!user) {
      // NE használj .unauthorized(), csak sima response
      return response.status(400).json({ 
        message: 'Invalid email or password' 
      })
    }

    const isValid = await hash.verify(user.password, password)
    
    if (!isValid) {
      return response.status(400).json({ 
        message: 'Invalid email or password' 
      })
    }

    const token = await User.accessTokens.create(user)
    
    return response.json({ 
      type: 'bearer',
      token: token.value!.release(),
      user 
    })
  }

  public async register({ request, response }: HttpContext) {
    const { firstName, lastName, nickname, email, password } = request.only([
      'firstName', 'lastName', 'nickname', 'email', 'password'
    ])
    
    try {
      const user = await User.create({ 
        firstName, 
        lastName, 
        nickName: nickname,
        email, 
        password 
      })
      
      const token = await User.accessTokens.create(user)
      
      return response.created({ 
        type: 'bearer',
        token: token.value!.release(),
        user 
      })
    } catch (error) {
      return response.status(400).json({ 
        message: error.message || 'Registration failed' 
      })
    }
  }
}