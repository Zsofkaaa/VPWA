import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Message from './message.js'
import User from './user.js'
import { DateTime } from 'luxon'

export default class MessageMention extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare messageId: number

  @column()
  declare mentionedUserId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // 👇 Kapcsolatok
  @belongsTo(() => Message)
  declare message: BelongsTo<typeof Message>

  @belongsTo(() => User, { foreignKey: 'mentionedUserId' })
  declare mentionedUser: BelongsTo<typeof User>
}
