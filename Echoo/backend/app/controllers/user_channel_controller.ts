import type { HttpContext } from '@adonisjs/core/http'
import UserChannel from '#models/user_channel'
import KickLog from '#models/kick_log'
import ChannelBan from '#models/channel_ban'
import Channel from '#models/channel'
import ws from '#services/ws'

export default class UserChannelController {
  // Pridanie používateľa do kanála
  public async store({ request, auth }: { request: any; auth: any }) {
    const data = request.only(['userId', 'channelId', 'role', 'notificationSettings'])
    const user = auth.user
    if (!user) return { error: 'Unauthorized' } // potrebuje prihláseného používateľa

    const { userId, channelId } = data

    // Kontrola: je už používateľ členom kanála?
    const exists = await UserChannel.query()
      .where('userId', userId)
      .andWhere('channelId', channelId)
      .first()

    if (exists) {
      return exists // nebudeme vytvárať nový záznam
    }

    // Kontrola: je používateľ zabanovaný?
    const banned = await ChannelBan.query()
      .where('channelId', channelId)
      .andWhere('userId', userId)
      .first()

    if (banned) return { error: 'You are banned from this channel' }

    const userChannel = await UserChannel.create({ ...data }) // vytvor novú väzbu user-channel
    return userChannel
  }

  // Získanie členov kanála
  public async members({ params, response }: HttpContext) {
    const channelId = Number(params.id)
    const userChannels = await UserChannel.query().where('channelId', channelId).preload('user') // načítaj user info

    // Namapujeme výsledok na shape pre frontend
    const members = userChannels.map((uc) => ({
      id: uc.user?.id ?? 0,
      nickName: uc.user?.nickName ?? 'UNKNOWN',
      role: uc.role,
      status: uc.user?.status ?? 'offline',
    }))

    return response.ok(members)
  }

  // Získanie notifikačných nastavení používateľa
  public async getNotificationSettings({ params, response }: HttpContext) {
    const userId = Number(params.userId)
    const channelId = Number(params.channelId)

    const userChannel = await UserChannel.query() // nájdi konkrétne user-channel nastavenie
      .where('userId', userId)
      .andWhere('channelId', channelId)
      .first()

    if (!userChannel) return response.notFound({ error: 'User is not a member of this channel' }) // validácia členstva

    return response.ok({
      notificationSettings: userChannel.notificationSettings || 'all',
    })
  }

  // Aktualizácia notifikačných nastavení
  public async updateNotificationSettings({ params, request, response }: HttpContext) {
    const userId = Number(params.userId)
    const channelId = Number(params.channelId)
    const { notificationSettings } = request.only(['notificationSettings'])

    const userChannel = await UserChannel.query() // vytiahni user-channel záznam
      .where('userId', userId)
      .andWhere('channelId', channelId)
      .first()

    if (!userChannel) return response.notFound({ error: 'User is not a member of this channel' }) // validácia členstva
    if (!['all', 'mentions', 'none'].includes(notificationSettings)) {
      return response.badRequest({ error: 'Invalid notification setting' }) // neplatná hodnota
    }

    userChannel.notificationSettings = notificationSettings // uloženie novej preferencie
    await userChannel.save()

    return response.ok({
      message: 'Notification settings updated',
      notificationSettings: userChannel.notificationSettings,
    })
  }

  // Odchod používateľa z kanála
  public async leave({ params, auth, response }: HttpContext) {
    const user = auth.user
    if (!user) return response.unauthorized({ error: 'Unauthorized' })

    const channelId = Number(params.id)
    const record = await UserChannel.query() // nájdi vlastný záznam členstva
      .where('userId', (user as { id: number }).id)
      .andWhere('channelId', channelId)
      .first()

    if (!record) return response.notFound({ error: 'You are not a member of this channel' }) // musí byť členom

    await record.delete()
    return response.ok({ message: 'Left the channel' })
  }

  // Získanie všetkých kanálov používateľa
  public async getUserChannels({ auth, response }: HttpContext) {
    const user = auth.user as { id: number }
    if (!user) return response.unauthorized({ error: 'Unauthorized' })

    const userChannels = await UserChannel.query().where('userId', user.id).preload('channel') // všetky väzby user-channel

    const channelsMap = new Map<number, any>() // deduplikácia kanálov
    userChannels.forEach((uc) => {
      if (uc.channel && !channelsMap.has(uc.channel.id)) {
        channelsMap.set(uc.channel.id, {
          id: uc.channel.id,
          name: uc.channel.name,
          type: uc.channel.type,
          path: `/chat/${uc.channel.id}`,
          role: uc.role,
          notificationSettings: uc.notificationSettings || 'all',
        })
      }
    })

    return response.ok(Array.from(channelsMap.values()))
  }

  // Ban používateľa z kanála
  public async ban({ params, auth, response }: HttpContext) {
    const channelId = Number(params.id)
    const userId = Number(params.userId)
    const adminUser = auth.user as { id: number }

    const record = await UserChannel.query() // záznam cieľového používateľa
      .where('channelId', channelId)
      .andWhere('userId', userId)
      .first()

    if (!record) return response.notFound({ error: 'User is not in this channel' }) // musí byť členom

    // Zisti názov kanála pre notifikáciu
    const channel = await Channel.find(channelId) // kvôli názvu v notifikácii
    const channelName = channel?.name || 'Unknown Channel'

    // 1) odstránenie členstva v kanáli
    await record.delete() // odober člena

    // 2) uloženie záznamu o banne
    await ChannelBan.create({
      userId,
      channelId,
      bannedBy: adminUser.id,
    })

    // 3) WebSocket notifikácia pre zabanovaného používateľa
    ws.sendUserBanned(userId, channelId, channelName) // realtime notifikácia

    return response.ok({ message: 'User banned successfully' })
  }

  // Kick používateľa z kanála
  public async kick({ params, auth, response }: HttpContext) {
    const channelId = Number(params.id)
    const targetUserId = Number(params.userId)
    const kickerUser = auth.user as { id: number }

    const targetRecord = await UserChannel.query() // cieľ kicku
      .where('channelId', channelId)
      .andWhere('userId', targetUserId)
      .first()

    if (!targetRecord) return response.notFound({ error: 'User is not in this channel' })
    if (targetRecord.role === 'admin')
      return response.unauthorized({ error: 'You cannot kick the channel admin' })
    if (targetUserId === kickerUser.id)
      return response.badRequest({ error: 'You cannot kick yourself' })

    const kickerRecord = await UserChannel.query() // údaje o kickerovi
      .where('channelId', channelId)
      .andWhere('userId', kickerUser.id)
      .first()

    if (!kickerRecord) return response.unauthorized({ error: 'You are not in this channel' })

    const isAdmin = kickerRecord.role === 'admin'

    // Zisti názov kanála pre notifikáciu
    const channel = await Channel.find(channelId) // názov pre notifikáciu
    const channelName = channel?.name || 'Unknown Channel'

    // Ak admin, ban permanentne
    if (isAdmin) {
      await targetRecord.delete() // admin rovno odstráni člena

      // WebSocket notifikácia – ban od admina
      ws.sendUserBanned(targetUserId, channelId, channelName) // notifikácia o bane

      return response.ok({ message: 'User permanently banned' })
    }

    const alreadyKicked = await KickLog.query() // ochrana pred opakovaným kickom tým istým userom
      .where('channelId', channelId)
      .andWhere('targetUserId', targetUserId)
      .andWhere('kickerUserId', kickerUser.id)
      .first()

    if (alreadyKicked) return response.badRequest({ error: 'You already kicked this user' })

    await KickLog.create({ channelId, targetUserId, kickerUserId: kickerUser.id }) // zapíš kick

    const kicks = await KickLog.query() // počet jedinečných kickov
      .where('channelId', channelId)
      .andWhere('targetUserId', targetUserId)

    // Po troch rôznych kickoch sa používateľ zabanne
    if (kicks.length >= 3) {
      // 1) odstránenie user_channel záznamu (používateľ už nie je člen)
      await targetRecord.delete() // vymaž členstvo po treťom kicku

      // 2) vytvorenie záznamu v ChannelBan
      await ChannelBan.create({
        userId: targetUserId,
        channelId,
        bannedBy: kickerUser.id,
      })

      // 3) WebSocket notifikácia – po troch kickoch ban
      ws.sendUserBanned(targetUserId, channelId, channelName) // notifikácia o banu po 3 kickoch

      return response.ok({ message: 'User has been banned after 3 different users kicked them' })
    }

    // WebSocket notifikácia – kick (bez banu)
    ws.sendUserKicked(targetUserId, channelId, channelName) // notifikácia o kicku bez banu

    return response.ok({ message: `User kicked successfully (${kicks.length}/3)` })
  }
}
