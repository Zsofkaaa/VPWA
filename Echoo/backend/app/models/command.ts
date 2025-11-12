import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import UserMessageCommand from './user_message_command.js'
import { DateTime } from 'luxon'

export default class Command extends BaseModel {
  @column({ isPrimary: true }) declare id: number
  @column() declare name: string
  @column() declare description: string
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime

  @hasMany(() => UserMessageCommand, { foreignKey: 'command_id' })
  declare userMessageCommands: HasMany<typeof UserMessageCommand>
}
