import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UsersController {
  public async index({ response }: HttpContext) {
    // VISSZAADJUK A VALÓS MEZŐKET
    const users = await User.query().select('id', 'nickName')
    return response.ok(users)
  }

  public async me({ auth, response }: HttpContext) {
    const user = auth.user as User | null

    if (!user) return response.unauthorized()

    // ITT CSAK AZ ID ES A NICKNAME
    return response.ok({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      nickName: user.nickName,
      email: user.email,
    })
  }

  public async update({ auth, request, response }: HttpContext) {
    // castoljuk auth.user mint unknown -> User, így TS nem panaszkodik
    const user = auth.user as unknown as User | null
    if (!user) return response.unauthorized()

    // Korlátozott, egyszerű típusellenőrzés: request.only visszaadása runtime objektum,
    // így castoljuk 'any'-ra, majd ellenőrizzük a mezőket, mielőtt hozzárendelnénk.
    const payload = request.only(['firstName', 'lastName', 'nickName', 'email', 'password']) as any

    // Csak akkor írjuk át, ha a beérkező érték string
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
      // a modell beforeSave() hook-ja hash-eli majd a jelszót
      user.password = payload.password
    }

    await user.save()

    return response.ok({
      message: 'Profile updated successfully',
      user,
    })
  }
}
