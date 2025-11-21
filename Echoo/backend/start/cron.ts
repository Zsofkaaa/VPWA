import cron from 'node-cron'
import Channel from '#models/channel'
import { DateTime } from 'luxon'

cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Channel cleanup running...')
  const thirtyDaysAgo = DateTime.now().minus({ days: 30 })

  const deleted = await Channel.query()
    .where('lastActiveAt', '<', thirtyDaysAgo.toJSDate())
    .delete()

  console.log(`[CRON] Deleted ${deleted} channels older than 30 days`)
})
