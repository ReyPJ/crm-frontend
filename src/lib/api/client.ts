import { endSession, getToken } from "@/lib/auth"

export const API_URL: string = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "")

export interface DuplicateLeadDetail {
  msg: string
  lead_id: string
  business_name: string
}

export interface ValidationIssue {
  loc: (string | number)[]
  msg: string
  type: string
}

export class ApiError extends Error {
  readonly status: number
  readonly detail: unknown

  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : `Request failed with status ${status}`)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
  }

  get duplicateLead(): DuplicateLeadDetail | null {
    const detail = this.detail
    if (this.status === 409 && detail && typeof detail === "object" && "lead_id" in detail) {
      return detail as DuplicateLeadDetail
    }
    return null
  }

  get validationIssues(): ValidationIssue[] {
    return this.status === 422 && Array.isArray(this.detail) ? (this.detail as ValidationIssue[]) : []
  }
}

type QueryPrimitive = string | number | boolean
type QueryValue = QueryPrimitive | readonly QueryPrimitive[] | null | undefined

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  json?: unknown
  form?: Record<string, string>
  query?: object
  signal?: AbortSignal
  auth?: boolean
}

export function buildUrl(path: string, query?: object): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries((query ?? {}) as Record<string, QueryValue>)) {
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) {
      if (item === undefined || item === null || item === "") continue
      params.append(key, String(item))
    }
  }
  const search = params.toString()
  return `${API_URL}${path}${search ? `?${search}` : ""}`
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", json, form, query, signal, auth = true } = options
  const headers = new Headers({ Accept: "application/json" })
  let body: BodyInit | undefined

  if (json !== undefined) {
    headers.set("Content-Type", "application/json")
    body = JSON.stringify(json)
  } else if (form) {
    body = new URLSearchParams(form)
  }

  if (auth) {
    const token = getToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), { method, headers, body, signal })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError(0, null)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const detail = data && typeof data === "object" && "detail" in data ? data.detail : null
    if (response.status === 401 && auth) {
      endSession({ keepLocation: true })
    }
    throw new ApiError(response.status, detail)
  }

  return data as T
}

export function validationMessage(issue: ValidationIssue): string {
  const limit = issue.msg.match(/(\d+)/)?.[1]
  switch (issue.type) {
    case "string_too_long":
      return limit ? `Escribe máximo ${limit} caracteres.` : "El texto es demasiado largo."
    case "string_too_short":
    case "missing":
      return "Este campo es obligatorio."
    case "decimal_max_digits":
    case "decimal_whole_digits":
      return "El monto máximo es 99,999,999.99."
    case "decimal_max_places":
      return "Usa máximo 2 decimales."
    case "decimal_parsing":
      return "Escribe un monto válido, por ejemplo 15000.50."
    case "datetime_parsing":
    case "datetime_from_date_parsing":
    case "timezone_aware":
      return "Elige una fecha y hora válidas."
    case "enum":
    case "literal_error":
    case "uuid_parsing":
    case "uuid_type":
      return "Elige una opción de la lista."
    default:
      return "Revisa este dato."
  }
}

export function bodyFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {}
  const fields: Record<string, string> = {}
  for (const issue of error.validationIssues) {
    if (issue.loc[0] === "body" && typeof issue.loc[1] === "string" && !fields[issue.loc[1]]) {
      fields[issue.loc[1]] = validationMessage(issue)
    }
  }
  return fields
}

export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError) || error.status === 0 || error.status >= 500) {
    return "Algo salió mal, intenta de nuevo"
  }
  switch (error.status) {
    case 401:
      return "Tu sesión terminó. Vuelve a entrar."
    case 403:
      return "No tienes permiso para hacer esto"
    case 404:
      return "Este registro ya no existe. Recarga la página."
    case 409:
      return "Estos datos chocan con un registro existente. Revísalos e intenta de nuevo."
    case 422:
      return "Revisa los datos marcados e intenta de nuevo."
    default:
      return "Algo salió mal, intenta de nuevo"
  }
}
