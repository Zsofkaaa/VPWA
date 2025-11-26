import cron from 'node-cron'
import Channel from '#models/channel'
import { DateTime } from 'luxon'

export function startCronJobs() {
  // Každú noc o polnoci
  //cron.schedule('* * * * *', async () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[CRON] Channel cleanup started')

      //const thirtyDaysAgo = DateTime.now().minus({ minutes: 1 })
      const thirtyDaysAgo = DateTime.now().minus({ days: 30 })

      // Odstrániť kanály, ktoré neboli aktívne viac ako 30 dní
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
