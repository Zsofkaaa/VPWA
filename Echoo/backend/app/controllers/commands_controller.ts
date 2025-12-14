import type { HttpContext } from '@adonisjs/core/http'
import Command from '#models/command'

export default class CommandsController {
  // Vráti všetky dostupné príkazy
  async index({ response }: HttpContext) {
    try {
      const commands = await Command.query() // načítaj príkazy s popisom
        .select('id', 'name', 'description')
        .orderBy('id', 'asc')

      return response.ok({
        success: true,
        data: commands,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Failed to fetch commands',
      })
    }
  }
}
