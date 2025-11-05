import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Message from '#models/message'
import { DateTime } from 'luxon'

export default class MessageSeeder extends BaseSeeder {
  public async run() {
    await Message.createMany([
      {
        channelId: 1,
        senderId: 1,
        content: 'Szia, ez az első üzenet!',
        sentAt: DateTime.now(),
      },
      {
        channelId: 1,
        senderId: 2,
        content: 'Helló, jó látni itt mindenkit!',
        sentAt: DateTime.now(),
      },
      {
        channelId: 2,
        senderId: 2,
        content: 'Fejlesztői csatorna elindult 🚀',
        sentAt: DateTime.now(),
      },
    ])
  }
}
