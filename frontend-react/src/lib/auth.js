const AUTH_KEY = 'tastematch_auth'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

export function getApiUrl(path) {
  return `${API_BASE}${path}`
}

export function getAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveAuthSession(session) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_KEY)
}

export function getAuthHeaders() {
  const session = getAuthSession()
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {}
}