const SESSION_KEY = 'noka-auth-session'
const SESSION_EVENT = 'noka:auth-session'

function userIdFromToken(token) {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')))
    const userId = Number(payload.user_id)
    return Number.isSafeInteger(userId) && userId > 0 ? userId : null
  } catch {
    return null
  }
}

function announceSessionChange() {
  window.dispatchEvent(new Event(SESSION_EVENT))
}

export function saveAuthSession(session) {
  const userId = userIdFromToken(session.access_token)
  if (!userId) {
    throw new Error('Token login tidak memiliki user_id yang valid.')
  }

  const savedSession = { ...session, user_id: userId }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(savedSession))
  announceSessionChange()
}

export function getAuthSession() {
  const stored = sessionStorage.getItem(SESSION_KEY)
  if (!stored) return null

  try {
    const session = JSON.parse(stored)
    const userId = userIdFromToken(session.access_token)
    if (!userId) return null
    return { ...session, user_id: userId }
  } catch {
    return null
  }
}

export function clearAuthSession() {
  sessionStorage.removeItem(SESSION_KEY)
  announceSessionChange()
}

export function subscribeToAuthSession(callback) {
  window.addEventListener(SESSION_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(SESSION_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}
