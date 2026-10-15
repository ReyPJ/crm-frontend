export type Role = "admin" | "user"
export type LeadStatus = "pendiente" | "contactado" | "cotizacion enviada" | "no interesado" | "vendido" | "cancelado"
export type LeadCategory =
  | "restaurante" | "bar" | "cafe" | "veterinario" | "clinica" | "dentista" | "barberia"
  | "salon de belleza" | "abogado" | "contabilidad" | "inmobiliaria" | "tienda" | "otro"
export type LeadSource = "redes" | "maps" | "referido" | "otro"
export type ContactChannel = "whatsapp" | "llamada" | "email" | "en persona" | "otro"

export interface Page<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface UserSummary {
  id: string
  name: string
}

export interface User {
  id: string
  username: string
  name: string
  second_name: string | null
  role: Role
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  business_name: string
  contact_name: string | null
  phone_number: string | null
  whatsapp_number: string | null
  city: string | null
  business_type: LeadCategory
  source: LeadSource
  status: LeadStatus
  notes: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  email: string | null
  quoted_price: string | null
  assigned_to_id: string | null
  assigned_to: UserSummary | null
  next_follow_up_at: string | null
  last_contacted_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface Interaction {
  id: string
  lead_id: string
  user_id: string
  user: UserSummary
  contact_channel: ContactChannel
  what_happened: string | null
  created_at: string
}

export interface InteractionWithLead extends Interaction {
  lead: { id: string; business_name: string }
}
