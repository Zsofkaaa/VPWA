import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Command from '#models/command'

export default class CommandSeeder extends BaseSeeder {
  public async run() {
    await Command.createMany([
      { name: '/join channelName [private]', description: 'BLABLABLA' },
      { name: '/join channelName', description: 'BLABLABLA' },
      { name: '/invite nickName', description: 'BLABLABLA' },
      { name: '/revoke nickName', description: 'BLABLABLA' },
      { name: '/kick nickName', description: 'BLABLABLA' },
      { name: '/quit', description: 'BLABLABLA' },
      { name: '/cancel', description: 'BLABLABLA' },
      { name: '/list', description: 'BLABLABLA' },
    ])
  }
}
