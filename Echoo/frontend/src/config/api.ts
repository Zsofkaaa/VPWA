// Centralized API configuration - FULLY DYNAMIC, NO HARDCODED IPs!

const BACKEND_PORT = 3333

// Automatikusan használja az aktuális hostname-t, amin a frontend fut
const currentHostname = window.location.hostname
const currentPort = window.location.port

console.log('[API CONFIG] Window location:', window.location.href)
console.log('[API CONFIG] Frontend hostname:', currentHostname)
console.log('[API CONFIG] Frontend port:', currentPort)

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

// Environment variable override - DE CSAK HA LOCALHOST!
if (import.meta.env.VITE_API_URL) {
  const envUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '')

  console.log('[API CONFIG] Found VITE_API_URL:', envUrl)

  // Ha localhost-ról jössz, használj localhost-ot még env variable esetén is
  if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
    API_URL = `http://localhost:${BACKEND_PORT}`
    console.log('[API CONFIG] Localhost detected, forcing localhost backend')
  } else {
    // Network IP esetén FIGYELMEN KÍVÜL HAGYJUK az env variable-t!
    console.log('[API CONFIG] Network IP detected, ignoring env variable')
    API_URL = `http://${currentHostname}:${BACKEND_PORT}`
  }
}

console.log('[API CONFIG] ✅ Final API URL:', API_URL)

export default API_URL
export { API_URL }
