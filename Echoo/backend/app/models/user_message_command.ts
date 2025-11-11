import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Command from './command.js'
import Message from './message.js'
import { DateTime } from 'luxon'

export default class UserMessageCommand extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare commandId: number

  @column()
  declare messageId: number

  @column()
  declare args: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Command)
  declare command: BelongsTo<typeof Command>

  @belongsTo(() => Message)
  declare message: BelongsTo<typeof Message>
}
