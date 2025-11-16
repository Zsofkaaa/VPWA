import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Channel from '#models/channel'
import UserChannel from '#models/user_channel'

export default class UserChannelSeeder extends BaseSeeder {
  public async run() {
    const users = await User.all()
    const channels = await Channel.all()

    if (users.length === 0 || channels.length === 0) {
      console.log('No users or channels found. Skipping user_channel seeding.')
      return
    }

    for (const user of users) {
      for (const channel of channels) {
        await UserChannel.create({
          userId: user.id,
          channelId: channel.id,
          role: 'member',
          notificationSettings: 'all',
          kickCount: 0,
        })
      }
    }

    console.log('UserChannel seeding complete.')
  }
}
