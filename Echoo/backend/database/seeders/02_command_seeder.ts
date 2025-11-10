import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Command from '#models/command'

export default class CommandSeeder extends BaseSeeder {
  public async run() {
    await Command.createMany([
      {
        name: '/join channelName [private]',
        description:
          'Používateľ vytvorí nový súkromný kanál s názvom channelName. Používateľ, ktorý príkaz zadá, sa stáva správcom kanála.',
      },
      {
        name: '/join channelName',
        description:
          'Pridá používateľa do existujúceho verejného kanála s názvom channelName. Ak kanál neexistuje, automaticky sa vytvorí ako verejný a používateľ sa stáva jeho správcom.',
      },
      {
        name: '/invite nickName',
        description:
          'Pozve používateľa s daným nickName do aktuálneho kanála. V súkromnom kanáli môže pozývať iba správca, vo verejnom ktorýkoľvek člen. Ak má používateľ ban, pozvánka ho môže odblokovať.',
      },
      {
        name: '/revoke nickName',
        description:
          'Odoberie používateľovi s daným nickName prístup do aktuálneho kanála. Tento príkaz je dostupný iba správcovi súkromného kanála.',
      },
      {
        name: '/kick nickName',
        description:
          'Vo verejnom kanáli môžu členovia vyhodiť používateľa. Ak to spravia aspoň 3 členovia, používateľ dostáva trvalý ban. Správca môže používateľa kedykoľvek vyhodiť prístup pomocou /kick',
      },
      {
        name: '/quit',
        description:
          'Zruší aktuálny kanál, ak príkaz vykoná správca. Všetci členovia stratia prístup a názov kanála je opäť voľný.',
      },
      {
        name: '/cancel',
        description:
          'Odstráni používateľa z aktuálneho kanála. Ak príkaz vykoná správca, celý kanál zaniká.',
      },
      {
        name: '/list',
        description:
          'Zobrazí zoznam členov aktuálneho kanála. Prístupný iba používateľom, ktorí sú členmi kanála.',
      },
    ])
  }
}
