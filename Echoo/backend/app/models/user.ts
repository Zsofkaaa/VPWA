import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Message from './message.js'
import Channel from './channel.js'
import UserMessageCommand from './user_message_command.js'
import MessageMention from './message_mention.js'
import UserChannel from './user_channel.js'
import { DateTime } from 'luxon'
import AccessToken from './access_token.js'

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

  @hasMany(() => UserMessageCommand, { foreignKey: 'userId' })
  declare userMessageCommands: HasMany<typeof UserMessageCommand>

  @hasMany(() => MessageMention, { foreignKey: 'mentionedUserId' })
  declare mentions: HasMany<typeof MessageMention>

  @hasMany(() => Message, { foreignKey: 'senderId' })
  declare messages: HasMany<typeof Message>

  @hasMany(() => Channel, { foreignKey: 'createdBy' })
  declare createdChannels: HasMany<typeof Channel>

  @hasMany(() => UserChannel, { foreignKey: 'userId' })
  declare userChannels: HasMany<typeof UserChannel>

  @manyToMany(() => Channel, {
    pivotTable: 'user_channel',
    pivotForeignKey: 'userId',
    pivotRelatedForeignKey: 'channelId',
  })
  declare channels: ManyToMany<typeof Channel>

  @hasMany(() => AccessToken)
  declare accessTokens: HasMany<typeof AccessToken>
}
