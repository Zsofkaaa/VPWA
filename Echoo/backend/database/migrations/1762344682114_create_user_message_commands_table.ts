import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_commands'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table
        .integer('command_id')
        .unsigned()
        .references('id')
        .inTable('commands')
        .onDelete('CASCADE')
      table
        .integer('message_id')
        .unsigned()
        .references('id')
        .inTable('messages')
        .onDelete('CASCADE')
      table.string('args')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
