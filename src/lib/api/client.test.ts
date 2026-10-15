import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError, apiFetch, bodyFieldErrors } from "@/lib/api/client"
import { getToken, setSessionEndHandler, setToken } from "@/lib/auth"

function createStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  }
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal("localStorage", createStorage())
  vi.stubGlobal("fetch", fetchMock)
  setToken("token-de-prueba")
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
  setSessionEndHandler(() => {})
})

describe("apiFetch", () => {
  it("agrega el token y repite los parámetros de arreglo", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { items: [], total: 0, limit: 50, offset: 0 }))
    await apiFetch("/leads/", { query: { status: ["pendiente", "contactado"], q: "", archived: false } })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("http://localhost:8000/leads/?status=pendiente&status=contactado&archived=false")
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token-de-prueba")
  })

  it("devuelve undefined con 204 sin intentar leer JSON", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    await expect(apiFetch("/leads/1", { method: "DELETE" })).resolves.toBeUndefined()
  })

  it("cierra la sesión ante un 401", async () => {
    const handler = vi.fn()
    setSessionEndHandler(handler)
    fetchMock.mockResolvedValue(jsonResponse(401, { detail: "Could not validate credentials" }))
    const error = await apiFetch("/users/me").catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(401)
    expect(handler).toHaveBeenCalledWith({ keepLocation: true })
    expect(getToken()).toBeNull()
  })

  it("no cierra la sesión cuando falla el login", async () => {
    const handler = vi.fn()
    setSessionEndHandler(handler)
    fetchMock.mockResolvedValue(jsonResponse(401, { detail: "Invalid credentials" }))
    await expect(apiFetch("/users/login", { method: "POST", form: {}, auth: false })).rejects.toBeInstanceOf(ApiError)
    expect(handler).not.toHaveBeenCalled()
  })

  it("expone el lead duplicado de un 409 con objeto", async () => {
    const detail = { msg: "Lead already exists", lead_id: "abc", business_name: "Clínica Peña" }
    fetchMock.mockResolvedValue(jsonResponse(409, { detail }))
    const error = (await apiFetch("/leads/", { method: "POST", json: {} }).catch((caught: unknown) => caught)) as ApiError
    expect(error.duplicateLead).toEqual(detail)
  })

  it("no confunde un 409 con texto con un duplicado", async () => {
    fetchMock.mockResolvedValue(jsonResponse(409, { detail: "Username already exists" }))
    const error = (await apiFetch("/users/", { method: "POST", json: {} }).catch((caught: unknown) => caught)) as ApiError
    expect(error.duplicateLead).toBeNull()
    expect(error.detail).toBe("Username already exists")
  })

  it("mapea los errores 422 del cuerpo a sus campos", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, {
        detail: [
          { loc: ["body", "business_name"], msg: "String should have at most 255 characters", type: "string_too_long" },
          { loc: ["query", "limit"], msg: "Input should be less than or equal to 100", type: "less_than_equal" },
        ],
      }),
    )
    const error = await apiFetch("/leads/", { method: "POST", json: {} }).catch((caught: unknown) => caught)
    expect(bodyFieldErrors(error)).toEqual({ business_name: "Escribe máximo 255 caracteres." })
  })

  it("convierte un error de red en ApiError con status 0", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"))
    const error = (await apiFetch("/leads/").catch((caught: unknown) => caught)) as ApiError
    expect(error.status).toBe(0)
  })
})
