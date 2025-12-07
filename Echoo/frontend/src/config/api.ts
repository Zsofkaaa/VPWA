// Centralized API configuration
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3333'

console.log('[API CONFIG] Using API URL:', API_URL)

export default API_URL
export { API_URL }
