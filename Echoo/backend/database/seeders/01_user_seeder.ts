import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
//import Hash from '@adonisjs/core/services/hash'

export default class UserSeeder extends BaseSeeder {
  public async run() {
    await User.createMany([
      {
        firstName: 'Adam',
        lastName: 'Kovacs',
        nickName: 'adamk',
        email: 'adam@example.com',
        password: 'password123',
        status: 'active',
      },
      {
        firstName: 'Bela',
        lastName: 'Nagy',
        nickName: 'belus',
        email: 'bela@example.com',
        password: 'password123',
        status: 'active',
      },
      {
        firstName: 'Cecilia',
        lastName: 'Toth',
        nickName: 'cecilia',
        email: 'cecilia@example.com',
        password: 'password123',
        status: 'inactive',
      },
    ])
  }
}
