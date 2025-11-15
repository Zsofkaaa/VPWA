import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Channel from './channel.js'
import { DateTime } from 'luxon'

export default class UserChannel extends BaseModel {
  @column({ isPrimary: true }) declare id: number
  @column() declare userId: number | null
  @column() declare channelId: number | null
  @column() declare role: string
  @column() declare notificationSettings: string
  @column() declare kickCount: number
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Channel, { foreignKey: 'channelId' })
  declare channel: BelongsTo<typeof Channel>
}
