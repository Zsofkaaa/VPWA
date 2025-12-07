import { defineConfig } from '@adonisjs/cors'

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */

const corsConfig = defineConfig({
  enabled: true,
  origin: [
    'http://localhost:9200', // 9000 → 9200
    'http://127.0.0.1:9200', // 9000 → 9200
    process.env.CORS_ORIGIN || 'http://192.168.43.120:9200',
  ],
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'],
  headers: true,
  exposeHeaders: ['Authorization'],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
