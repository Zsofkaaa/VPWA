import { BaseModel, column, belongsTo, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Channel from './channel.js'
import User from './user.js'
import MessageMention from './message_mention.js'
import ChannelHistory from './channel_history.js'
import UserMessageCommand from './user_message_command.js'
import { DateTime } from 'luxon'

export default class Message extends BaseModel {
  @column({ isPrimary: true }) declare id: number
  @column() declare channelId: number
  @column() declare senderId: number
  @column() declare content: string
  @column() declare hasPing: boolean
  @column() declare hasCommand: boolean
  @column.dateTime() declare sentAt: DateTime
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'senderId' })
  declare sender: BelongsTo<typeof User>

  @belongsTo(() => Channel, { foreignKey: 'channelId' })
  declare channel: BelongsTo<typeof Channel>

  @hasOne(() => UserMessageCommand, { foreignKey: 'messageId' })
  declare userMessageCommands: HasOne<typeof UserMessageCommand>

  @hasMany(() => MessageMention, { foreignKey: 'messageId' })
  declare mentions: HasMany<typeof MessageMention>

  @hasOne(() => ChannelHistory, { foreignKey: 'lastFetchedMessageId' })
  declare relatedHistories: HasOne<typeof ChannelHistory>
}
