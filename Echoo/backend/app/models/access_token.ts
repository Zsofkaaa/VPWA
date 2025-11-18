import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class AccessToken extends BaseModel {
  @column({ isPrimary: true }) public id!: number
  @column() public token!: string
  @column() public userId!: number

  @belongsTo(() => User, { foreignKey: 'userId' })
  public user!: BelongsTo<typeof User>
}
