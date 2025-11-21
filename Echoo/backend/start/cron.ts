import cron from 'node-cron'
import Channel from '#models/channel'
import { DateTime } from 'luxon'

export function startCronJobs() {
  // Minden nap éjfélkor fut
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[CRON] Running channel cleanup...')

      const thirtyDaysAgo = DateTime.now().minus({ days: 30 })

      const deleted = await Channel.query()
        .where('last_active_at', '<', thirtyDaysAgo.toSQL())
        .delete()

      console.log(`[CRON] Deleted ${deleted} inactive channels`)
    } catch (error) {
      console.error('[CRON ERROR]', error)
    }
  })

  console.log('[CRON] Cron jobs registered')
}
