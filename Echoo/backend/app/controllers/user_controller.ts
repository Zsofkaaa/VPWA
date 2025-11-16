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

    return response.ok({
      id: user.id,
      nickName: user.nickName,
    })
  }
}
