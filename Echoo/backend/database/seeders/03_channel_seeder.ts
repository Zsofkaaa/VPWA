import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Channel from '#models/channel'
import { DateTime } from 'luxon'

export default class ChannelSeeder extends BaseSeeder {
  public async run() {
    await Channel.createMany([
      {
        name: 'general',
        type: 'public',
        createdBy: 1,
        lastActiveAt: DateTime.now(),
      },
      {
        name: 'development',
        type: 'private',
        createdBy: 2,
        lastActiveAt: DateTime.now(),
      },
    ])
  }
}
