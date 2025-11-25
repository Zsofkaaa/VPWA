import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UsersController {
  // Získanie zoznamu používateľov s ID a prezývkou
  public async index({ response }: HttpContext) {
    const users = await User.query().select('id', 'nickName')
    return response.ok(users)
  }

  // Získanie údajov o aktuálne prihlásenom používateľovi
  public async me({ auth, response }: HttpContext) {
    const user = auth.user as User | null
    if (!user) return response.unauthorized()

    return response.ok({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      nickName: user.nickName,
      email: user.email,
    })
  }

  // Aktualizácia profilu používateľa
  public async update({ auth, request, response }: HttpContext) {
    const user = auth.user as unknown as User | null
    if (!user) return response.unauthorized()

    const payload = request.only(['firstName', 'lastName', 'nickName', 'email', 'password']) as any

    // Len ak existujú a sú string, aktualizujeme polia
    if (typeof payload.firstName === 'string') {
      user.firstName = payload.firstName
    }
    if (typeof payload.lastName === 'string') {
      user.lastName = payload.lastName
    }
    if (typeof payload.nickName === 'string') {
      user.nickName = payload.nickName
    }
    if (typeof payload.email === 'string') {
      user.email = payload.email
    }
    if (typeof payload.password === 'string' && payload.password.length > 0) {
      // beforeSave hook sa postará o hashovanie hesla
      user.password = payload.password
    }

    await user.save()

    return response.ok({
      message: 'Profile updated successfully',
      user,
    })
  }
}
