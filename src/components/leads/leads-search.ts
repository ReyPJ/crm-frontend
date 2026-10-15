import { z } from "zod"
import type { LeadFilters } from "@/lib/api/leads"
import { LEAD_CATEGORIES, LEAD_SOURCES, LEAD_STATUSES } from "@/lib/labels"

export const LEADS_SEARCH_DEFAULTS = {
  archived: false,
  order_by: "created_at",
  order_dir: "desc",
  limit: 50,
  offset: 0,
} as const

export const leadsSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  status: z.array(z.enum(LEAD_STATUSES)).optional().catch(undefined),
  assigned_to: z.union([z.literal("me"), z.literal("unassigned"), z.uuid()]).optional().catch(undefined),
  follow_up: z.enum(["today", "overdue", "upcoming"]).optional().catch(undefined),
  business_type: z.enum(LEAD_CATEGORIES).optional().catch(undefined),
  source: z.enum(LEAD_SOURCES).optional().catch(undefined),
  city: z.string().optional().catch(undefined),
  has_website: z.boolean().optional().catch(undefined),
  archived: z.boolean().default(LEADS_SEARCH_DEFAULTS.archived).catch(LEADS_SEARCH_DEFAULTS.archived),
  order_by: z
    .enum(["created_at", "last_contacted_at", "next_follow_up_at", "business_name"])
    .default(LEADS_SEARCH_DEFAULTS.order_by)
    .catch(LEADS_SEARCH_DEFAULTS.order_by),
  order_dir: z.enum(["asc", "desc"]).default(LEADS_SEARCH_DEFAULTS.order_dir).catch(LEADS_SEARCH_DEFAULTS.order_dir),
  limit: z.number().int().min(1).max(100).default(LEADS_SEARCH_DEFAULTS.limit).catch(LEADS_SEARCH_DEFAULTS.limit),
  offset: z.number().int().min(0).default(LEADS_SEARCH_DEFAULTS.offset).catch(LEADS_SEARCH_DEFAULTS.offset),
})

export type LeadsSearch = z.output<typeof leadsSearchSchema>

export function toLeadFilters(search: LeadsSearch): LeadFilters {
  return {
    q: search.q?.trim() || undefined,
    status: search.status?.length ? search.status : undefined,
    assigned_to: search.assigned_to,
    follow_up: search.follow_up,
    business_type: search.business_type,
    source: search.source,
    city: search.city?.trim() || undefined,
    has_website: search.has_website,
    archived: search.archived,
    order_by: search.order_by,
    order_dir: search.order_dir,
    limit: search.limit,
    offset: search.offset,
  }
}

export function hasActiveFilters(search: LeadsSearch): boolean {
  return Boolean(
    search.q ||
      search.status?.length ||
      search.assigned_to ||
      search.follow_up ||
      search.business_type ||
      search.source ||
      search.city ||
      search.has_website !== undefined ||
      search.archived,
  )
}
