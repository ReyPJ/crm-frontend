import { queryOptions, useSuspenseQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/client"
import type { User } from "@/lib/api/types"

export interface TokenResponse {
  access_token: string
  token_type: string
}

export function login(username: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/users/login", {
    method: "POST",
    form: { username: username.trim(), password },
    auth: false,
  })
}

export const meQueryOptions = queryOptions({
  queryKey: ["me"],
  queryFn: ({ signal }) => apiFetch<User>("/users/me", { signal }),
  staleTime: 5 * 60_000,
})

export function useMe(): User {
  return useSuspenseQuery(meQueryOptions).data
}
