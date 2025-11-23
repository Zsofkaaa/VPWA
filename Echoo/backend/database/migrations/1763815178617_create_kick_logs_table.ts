import { BaseSchema } from '@adonisjs/lucid/schema'

export default class KickLogs extends BaseSchema {
  protected tableName = 'kick_logs'

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
        .integer('target_user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table
        .integer('kicker_user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // ❗ Nagyon fontos: egy user csak egyszer kickelhet egy másikat egy csatornában
      table.unique(['channel_id', 'target_user_id', 'kicker_user_id'])

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
