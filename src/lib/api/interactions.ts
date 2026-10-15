import { queryOptions } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/client"
import type { ContactChannel, Interaction, InteractionWithLead, Page } from "@/lib/api/types"

export interface ActivityFilters {
  user_id?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

export interface InteractionCreate {
  contact_channel: ContactChannel
  what_happened?: string | null
  next_follow_up_at?: string
}

export const leadInteractionsQueryOptions = (leadId: string) =>
  queryOptions({
    queryKey: ["lead", leadId, "interactions"],
    queryFn: ({ signal }) => apiFetch<Interaction[]>(`/leads/${leadId}/interactions/`, { signal }),
  })

export const activityQueryOptions = (filters: ActivityFilters) =>
  queryOptions({
    queryKey: ["interactions", filters],
    queryFn: ({ signal }) => apiFetch<Page<InteractionWithLead>>("/interactions/", { query: filters, signal }),
  })

export function createInteraction(leadId: string, data: InteractionCreate): Promise<Interaction> {
  return apiFetch<Interaction>(`/leads/${leadId}/interactions/`, { method: "POST", json: data })
}
