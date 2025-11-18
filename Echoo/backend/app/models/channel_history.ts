import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Channel from './channel.js'
import Message from './message.js'

export default class ChannelHistory extends BaseModel {
  @column({ isPrimary: true }) declare id: number
  @column() declare channelId: number
  @column() declare lastFetchedMessageId: number
  @column() declare hasMore: string
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime

  @belongsTo(() => Channel, { foreignKey: 'channelId' })
  declare channel: BelongsTo<typeof Channel>

  @belongsTo(() => Message, { localKey: 'lastFetchedMessageId', foreignKey: 'id' })
  declare lastFetchedMessage: BelongsTo<typeof Message>
}
