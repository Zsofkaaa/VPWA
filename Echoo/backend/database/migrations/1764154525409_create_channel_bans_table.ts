import { BaseSchema } from '@adonisjs/lucid/schema'

export default class ChannelBans extends BaseSchema {
  protected tableName = 'channel_bans'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('channel_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table
        .integer('banned_by')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      table.string('reason', 255).nullable()

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      // Egy user egyszer legyen bannolva egy csatornában
      table.unique(['channel_id', 'user_id'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
