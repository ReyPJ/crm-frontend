import type { ContactChannel, LeadCategory, LeadSource, LeadStatus, Role } from "@/lib/api/types"

export const LEAD_STATUSES = [
  "pendiente",
  "contactado",
  "cotizacion enviada",
  "vendido",
  "no interesado",
  "cancelado",
] as const satisfies readonly LeadStatus[]

export const STATUS_LABELS: Record<LeadStatus, string> = {
  pendiente: "Pendiente",
  contactado: "Contactado",
  "cotizacion enviada": "Cotización enviada",
  vendido: "Vendido",
  "no interesado": "No interesado",
  cancelado: "Cancelado",
}

export const LEAD_CATEGORIES = [
  "dentista",
  "clinica",
  "veterinario",
  "restaurante",
  "bar",
  "cafe",
  "abogado",
  "contabilidad",
  "inmobiliaria",
  "tienda",
  "barberia",
  "salon de belleza",
  "otro",
] as const satisfies readonly LeadCategory[]

export const CATEGORY_LABELS: Record<LeadCategory, string> = {
  dentista: "Dentista",
  clinica: "Clínica",
  veterinario: "Veterinario",
  restaurante: "Restaurante",
  bar: "Bar",
  cafe: "Café",
  abogado: "Abogado",
  contabilidad: "Contabilidad",
  inmobiliaria: "Inmobiliaria",
  tienda: "Tienda",
  barberia: "Barbería",
  "salon de belleza": "Salón de belleza",
  otro: "Otro",
}

export const LEAD_SOURCES = ["maps", "redes", "referido", "otro"] as const satisfies readonly LeadSource[]

export const SOURCE_LABELS: Record<LeadSource, string> = {
  maps: "Google Maps",
  redes: "Redes sociales",
  referido: "Referido",
  otro: "Otro",
}

export const CONTACT_CHANNELS = [
  "whatsapp",
  "llamada",
  "email",
  "en persona",
  "otro",
] as const satisfies readonly ContactChannel[]

export const CHANNEL_LABELS: Record<ContactChannel, string> = {
  whatsapp: "WhatsApp",
  llamada: "Llamada",
  email: "Correo",
  "en persona": "En persona",
  otro: "Otro",
}

export const ROLES = ["user", "admin"] as const satisfies readonly Role[]

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  user: "Vendedor",
}
