import { defineConfig } from '@adonisjs/core/http'

export default defineConfig({
  allowMethodSpoofing: false,
  trustProxy: false,
  generateRequestId: true,

  cookie: {
    domain: '',
    path: '/',
    maxAge: '2h',
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  },
})
