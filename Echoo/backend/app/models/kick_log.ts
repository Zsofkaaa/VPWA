import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class KickLog extends BaseModel {
  @column({ isPrimary: true }) declare id: number
  @column() declare channelId: number
  @column() declare targetUserId: number
  @column() declare kickerUserId: number
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
}
