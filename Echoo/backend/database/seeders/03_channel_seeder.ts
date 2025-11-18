import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Channel from '#models/channel'
import { DateTime } from 'luxon'

export default class ChannelSeeder extends BaseSeeder {
  public async run() {
    await Channel.createMany([
      {
        name: 'General',
        type: 'public',
        createdBy: 1,
        lastActiveAt: DateTime.now(),
      },
      {
        name: 'Development',
        type: 'public',
        createdBy: 2,
        lastActiveAt: DateTime.now(),
      },
    ])
  }
}
