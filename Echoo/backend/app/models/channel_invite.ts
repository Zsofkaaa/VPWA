import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Channel from './channel.js'
import User from './user.js'
import { DateTime } from 'luxon'

export default class ChannelInvite extends BaseModel {
  public static table = 'channel_invites'

  @column({ isPrimary: true }) declare id: number
  @column() declare channelId: number
  @column() declare userId: number
  @column() declare invitedBy: number
  @column() declare status: 'pending' | 'accepted' | 'rejected'
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime

  @belongsTo(() => Channel, {
    foreignKey: 'channelId',
  })
  declare channel: BelongsTo<typeof Channel>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'invitedBy',
  })
  declare inviter: BelongsTo<typeof User>
}
