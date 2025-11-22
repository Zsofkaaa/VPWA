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

    for (const channel of channels) {
      // A channel.createdBy alapján megkapjuk az admin user_id-ját
      const creatorId = channel.createdBy

      for (const user of users) {
        const isCreator = user.id === creatorId

        await UserChannel.create({
          userId: user.id,
          channelId: channel.id,
          role: isCreator ? 'admin' : 'member',
          notificationSettings: 'all',
        })
      }
    }
  }
}
