// Centralized API configuration - FULLY DYNAMIC, NO HARDCODED IPs!

const BACKEND_PORT = 3333

// Automatikusan használja az aktuális hostname-t, amin a frontend fut
const currentHostname = window.location.hostname
const currentPort = window.location.port

// Smart API URL detection
let API_URL: string

// Ha localhost-on fut a frontend, a backend is localhost-on van
if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
  API_URL = `http://localhost:${BACKEND_PORT}`
} else {
  // Ha bármilyen más IP-n fut (192.168.x.x, 10.x.x.x, stb.)
  // akkor feltételezzük hogy a backend UGYANAZON az IP-n fut
  API_URL = `http://${currentHostname}:${BACKEND_PORT}`
}

// Environment variable override (optional, de nem kötelező)
if (import.meta.env.VITE_API_URL) {
  const envUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '')

  // Ha localhost-ról jössz, használj localhost-ot még env variable esetén is
  if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
    API_URL = `http://localhost:${BACKEND_PORT}`
  } else {
    API_URL = envUrl
  }
}

console.log('[API CONFIG] Frontend hostname:', currentHostname)
console.log('[API CONFIG] Frontend port:', currentPort)
console.log('[API CONFIG] Detected API URL:', API_URL)

export default API_URL
export { API_URL }
