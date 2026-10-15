import { queryOptions } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api/client"
import type { Lead, LeadCategory, LeadSource, LeadStatus, Page } from "@/lib/api/types"

export type FollowUpFilter = "today" | "overdue" | "upcoming"
export type LeadOrderBy = "created_at" | "last_contacted_at" | "next_follow_up_at" | "business_name"
export type OrderDir = "asc" | "desc"

export interface LeadFilters {
  status?: LeadStatus[]
  assigned_to?: string
  business_type?: LeadCategory
  source?: LeadSource
  city?: string
  has_website?: boolean
  follow_up?: FollowUpFilter
  archived?: boolean
  q?: string
  order_by?: LeadOrderBy
  order_dir?: OrderDir
  limit?: number
  offset?: number
}

export interface LeadCreate {
  business_name: string
  business_type: LeadCategory
  source: LeadSource
  contact_name?: string | null
  phone_number?: string | null
  whatsapp_number?: string | null
  city?: string | null
  status?: LeadStatus
  notes?: string | null
  website?: string | null
  instagram?: string | null
  facebook?: string | null
  email?: string | null
  quoted_price?: string | null
  assigned_to_id?: string | null
  next_follow_up_at?: string | null
}

export type LeadUpdate = Partial<LeadCreate>

export const leadsQueryOptions = (filters: LeadFilters) =>
  queryOptions({
    queryKey: ["leads", filters],
    queryFn: ({ signal }) => apiFetch<Page<Lead>>("/leads/", { query: filters, signal }),
  })

export const leadQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["lead", id],
    queryFn: ({ signal }) => apiFetch<Lead>(`/leads/${id}`, { signal }),
  })

export function createLead(data: LeadCreate): Promise<Lead> {
  return apiFetch<Lead>("/leads/", { method: "POST", json: data })
}

export function updateLead(id: string, data: LeadUpdate): Promise<Lead> {
  return apiFetch<Lead>(`/leads/${id}`, { method: "PATCH", json: data })
}

export function archiveLead(id: string): Promise<Lead> {
  return apiFetch<Lead>(`/leads/${id}/archive`, { method: "POST" })
}

export function unarchiveLead(id: string): Promise<Lead> {
  return apiFetch<Lead>(`/leads/${id}/unarchive`, { method: "POST" })
}

export function deleteLead(id: string): Promise<void> {
  return apiFetch<void>(`/leads/${id}`, { method: "DELETE" })
}
