import { BaseModel, column, belongsTo, hasMany, manyToMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany, HasOne } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Message from './message.js'
import ChannelHistory from './channel_history.js'
import UserChannel from './user_channel.js'
import { DateTime } from 'luxon'

export default class Channel extends BaseModel {
  @column({ isPrimary: true }) declare id: number
  @column() declare name: string
  @column() declare type: string
  @column() declare createdBy: number
  @column.dateTime() declare lastActiveAt: DateTime
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>

  @hasOne(() => ChannelHistory, { foreignKey: 'channelId' })
  declare history: HasOne<typeof ChannelHistory>

  @hasMany(() => Message, { foreignKey: 'channelId' })
  declare messages: HasMany<typeof Message>

  @hasMany(() => UserChannel, { foreignKey: 'channelId' })
  declare userChannels: HasMany<typeof UserChannel>

  @manyToMany(() => User, {
    pivotTable: 'user_channel',
    pivotForeignKey: 'channelId',
    pivotRelatedForeignKey: 'userId',
  })
  declare members: ManyToMany<typeof User>
}
