import { defineConfig } from '@adonisjs/cors'

const corsConfig = defineConfig({
  enabled: true,

  // Jednoduchšie riešenie – funkcia, ktorá vracia boolean
  origin: (origin) => {
    // Ak nie je origin (napríklad Postman alebo priame volanie), povolíme ho
    if (!origin) return true

    try {
      const url = new URL(origin)
      const hostname = url.hostname

      // Localhost (vždy povolený)
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return true
      }

      // Súkromné siete (RFC 1918)
      // 10.0.0.0 - 10.255.255.255
      if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        return true
      }

      // 172.16.0.0 - 172.31.255.255
      if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        return true
      }

      // 192.168.0.0 - 192.168.255.255
      if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        return true
      }

      // Produkčná doména (pri nasadení sem pridajte svoju doménu)
      // if (hostname === 'yourdomain.com') {
      //   return true
      // }

      // Inak origin nepovolíme
      console.log('[CORS] Rejected origin:', origin)
      return false
    } catch (err) {
      console.error('[CORS] Error parsing origin:', origin, err)
      return false
    }
  },

  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'],
  headers: true,
  exposeHeaders: ['Authorization'],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
