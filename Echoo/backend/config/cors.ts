import { defineConfig } from '@adonisjs/cors'

const corsConfig = defineConfig({
  enabled: true,

  // ⭐ Egyszerűbb megoldás - function ami boolean-t ad vissza
  origin: (origin) => {
    // Ha nincs origin (pl. Postman, direct access), engedélyezd
    if (!origin) return true

    try {
      const url = new URL(origin)
      const hostname = url.hostname

      // Localhost (mindig engedélyezve)
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return true
      }

      // Privát hálózatok (RFC 1918)
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

      // Production domain (add your domain here when deploying)
      // if (hostname === 'yourdomain.com') {
      //   return true
      // }

      // Egyébként ne engedélyezd
      console.log('[CORS] ❌ Rejected origin:', origin)
      return false
    } catch (err) {
      console.error('[CORS] ⚠️ Error parsing origin:', origin, err)
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
