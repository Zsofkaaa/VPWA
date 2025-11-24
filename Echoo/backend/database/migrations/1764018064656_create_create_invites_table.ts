import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invites'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Channel reference
      table.integer('channel_id').unsigned().notNullable()
      table.foreign('channel_id').references('id').inTable('channels').onDelete('CASCADE')

      // User who is invited
      table.integer('user_id').unsigned().notNullable()
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')

      // User who sent the invite
      table.integer('invited_by').unsigned().notNullable()
      table.foreign('invited_by').references('id').inTable('users').onDelete('CASCADE')

      // Invite status
      table.enum('status', ['pending', 'accepted', 'rejected']).defaultTo('pending')

      // Timestamps
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Ensure unique invites (user can't be invited multiple times to same channel)
      table.unique(['channel_id', 'user_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
