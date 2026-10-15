const TOKEN_KEY = "agency-crm.token"

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    return
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    return
  }
}

export function getTokenExpiration(token: string): number | null {
  const payload = token.split(".")[1]
  if (!payload) return null
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=")
    const data: unknown = JSON.parse(atob(base64))
    if (data && typeof data === "object" && "exp" in data && typeof data.exp === "number") {
      return data.exp * 1000
    }
    return null
  } catch {
    return null
  }
}

export function hasValidToken(now: number = Date.now()): boolean {
  const token = getToken()
  if (!token) return false
  const expiration = getTokenExpiration(token)
  return expiration !== null && expiration > now
}

type SessionEndHandler = (options: { keepLocation: boolean }) => void

let sessionEndHandler: SessionEndHandler = () => {}

export function setSessionEndHandler(handler: SessionEndHandler): void {
  sessionEndHandler = handler
}

export function endSession(options: { keepLocation: boolean } = { keepLocation: false }): void {
  clearToken()
  sessionEndHandler(options)
}

export function canEditLead(lead: { assigned_to_id: string | null }, me: { id: string; role: string }): boolean {
  return me.role === "admin" || lead.assigned_to_id === me.id
}
