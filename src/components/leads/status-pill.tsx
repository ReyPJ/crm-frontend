import type { LeadStatus } from "@/lib/api/types"
import { STATUS_LABELS } from "@/lib/labels"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<LeadStatus, string> = {
  pendiente: "bg-pizarra/10 text-pizarra",
  contactado: "bg-menta/10 text-menta",
  "cotizacion enviada": "bg-hoy/10 text-hoy",
  vendido: "bg-vendido/10 text-vendido",
  "no interesado": "bg-vencido/10 text-vencido",
  cancelado: "bg-vencido/10 text-vencido",
}

export function StatusPill({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
