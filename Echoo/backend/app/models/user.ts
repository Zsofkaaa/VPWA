import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Message from './message.js'
import Channel from './channel.js'
import UserMessageCommand from './user_message_command.js'
import MessageMention from './message_mention.js'
import UserChannel from './user_channel.js'
import { DateTime } from 'luxon'

export default class User extends BaseModel {
  @column({ isPrimary: true }) declare id: number
  @column() declare firstName: string
  @column() declare lastName: string
  @column() declare nickName: string
  @column() declare email: string
  @column({ serializeAs: null }) declare password: string
  @column() declare status: string
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime

  @hasMany(() => UserMessageCommand, { foreignKey: 'user_id' })
  declare userMessageCommands: HasMany<typeof UserMessageCommand>

  @hasMany(() => MessageMention, { foreignKey: 'mentioned_user_id' })
  declare mentions: HasMany<typeof MessageMention>

  @hasMany(() => Message, { foreignKey: 'sender_id' })
  declare messages: HasMany<typeof Message>

  @hasMany(() => Channel, { foreignKey: 'created_by' })
  declare createdChannels: HasMany<typeof Channel>

  @hasMany(() => UserChannel, { foreignKey: 'user_id' })
  declare userChannels: HasMany<typeof UserChannel>

  @manyToMany(() => Channel, {
    pivotTable: 'user_channel',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'channel_id',
  })
  declare channels: ManyToMany<typeof Channel>
}
