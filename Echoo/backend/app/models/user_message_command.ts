import { BaseModel, column, belongsTo, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Command from './command.js'
import Message from './message.js'
import { DateTime } from 'luxon'

export default class UserMessageCommand extends BaseModel {
  @column({ isPrimary: true }) declare id: number
  @column() declare userId: number
  @column() declare commandId: number
  @column() declare messageId: number
  @column() declare args: string
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'user_id' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Message, { foreignKey: 'message_id' })
  declare message: BelongsTo<typeof Message>

  @belongsTo(() => Command, { foreignKey: 'command_id' })
  declare command: BelongsTo<typeof Command>
}
