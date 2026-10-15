import { queryOptions } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/client"
import type { Role, User } from "@/lib/api/types"

export interface UserCreate {
  username: string
  name: string
  second_name?: string | null
  password: string
  role?: Role
}

export interface UserUpdate {
  role?: Role
  is_active?: boolean
}

export const usersQueryOptions = queryOptions({
  queryKey: ["users"],
  queryFn: ({ signal }) => apiFetch<User[]>("/users/", { signal }),
  staleTime: 60_000,
})

export function createUser(data: UserCreate): Promise<User> {
  return apiFetch<User>("/users/", { method: "POST", json: data })
}

export function updateUser(id: string, data: UserUpdate): Promise<User> {
  return apiFetch<User>(`/users/${id}`, { method: "PATCH", json: data })
}
