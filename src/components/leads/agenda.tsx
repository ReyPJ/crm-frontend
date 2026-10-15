import type { ReactNode } from "react"
import type { UseQueryResult } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { InteractionDialog } from "@/components/interactions/interaction-dialog"
import { ContactButtons } from "@/components/leads/contact-actions"
import { StatusPill } from "@/components/leads/status-pill"
import { InlineError } from "@/components/shared/route-error"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Lead, Page } from "@/lib/api/types"
import { formatDayShort, formatPhone, formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"

export type AgendaKind = "overdue" | "today" | "upcoming"

const COUNT_STYLES: Record<AgendaKind, string> = {
  overdue: "bg-vencido/10 text-vencido",
  today: "bg-hoy/10 text-hoy",
  upcoming: "bg-pizarra/10 text-pizarra",
}

interface AgendaGroupProps {
  kind: AgendaKind
  title: string
  query: UseQueryResult<Page<Lead>>
  showAssignee: boolean
  empty: ReactNode
  footer?: ReactNode
}

export function AgendaGroup({ kind, title, query, showAssignee, empty, footer }: AgendaGroupProps) {
  const heading = (count?: number) => (
    <div className="flex items-center gap-2">
      <h2 className="text-lg font-semibold text-tinta">{title}</h2>
      {count !== undefined && (
        <span className={cn(
            "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold tabular-nums",
            count > 0 ? COUNT_STYLES[kind] : COUNT_STYLES.upcoming,
          )}>
          {count}
        </span>
      )}
    </div>
  )

  if (query.isPending) {
    return (
      <section aria-busy="true" className="flex flex-col gap-3">
        {heading()}
        <div className="divide-y divide-linea rounded-xl border border-linea bg-card">
          <AgendaRowSkeleton showDay={kind !== "today"} />
          <AgendaRowSkeleton showDay={kind !== "today"} />
        </div>
      </section>
    )
  }

  if (query.isError) {
    return (
      <section className="flex flex-col gap-3">
        {heading()}
        <InlineError error={query.error} onRetry={() => void query.refetch()} />
      </section>
    )
  }

  const { items, total } = query.data

  if (total === 0) {
    return (
      <section className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-linea pb-4">
        {heading(0)}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-pizarra">{empty}</div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3">
      {heading(total)}
      <ul className="divide-y divide-linea rounded-xl border border-linea bg-card">
        {items.map((lead) => (
          <AgendaRow key={lead.id} lead={lead} kind={kind} showAssignee={showAssignee} />
        ))}
      </ul>
      {footer}
    </section>
  )
}

function AgendaRow({ lead, kind, showAssignee }: { lead: Lead; kind: AgendaKind; showAssignee: boolean }) {
  const followUp = lead.next_follow_up_at ?? lead.created_at
  const phone = lead.phone_number || lead.whatsapp_number
  return (
    <li className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 px-4 py-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:px-5">
      {kind === "overdue" && <span aria-hidden className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-vencido" />}
      <div className="flex flex-col tabular-nums">
        {kind !== "today" && (
          <span className={cn("text-xs font-semibold", kind === "overdue" ? "text-vencido" : "text-pizarra")}>
            {formatDayShort(followUp)}
          </span>
        )}
        <time dateTime={followUp} className="text-agenda font-bold text-tinta">
          {formatTime(followUp)}
        </time>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Link
            to="/leads/$leadId"
            params={{ leadId: lead.id }}
            className="min-w-0 text-lg font-semibold break-words text-tinta hover:text-menta hover:underline"
          >
            {lead.business_name}
          </Link>
          <StatusPill status={lead.status} />
        </div>
        {(lead.contact_name || phone) && (
          <p className="flex flex-wrap gap-x-3 text-pizarra">
            {lead.contact_name && <span>{lead.contact_name}</span>}
            {phone && <span className="tabular-nums">{formatPhone(phone)}</span>}
          </p>
        )}
        {showAssignee && (
          <p className="text-xs text-pizarra">{lead.assigned_to ? `Asignado a ${lead.assigned_to.name}` : "Sin asignar"}</p>
        )}
      </div>
      <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-start-2 sm:flex sm:flex-wrap">
        <ContactButtons lead={lead} />
        <InteractionDialog leadId={lead.id} businessName={lead.business_name}>
          <Button className="col-span-2">Registrar contacto</Button>
        </InteractionDialog>
      </div>
    </li>
  )
}

function AgendaRowSkeleton({ showDay }: { showDay: boolean }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 px-4 py-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:px-5">
      <div className="flex flex-col gap-1.5">
        {showDay && <Skeleton className="h-3.5 w-12" />}
        <Skeleton className="h-7 w-16" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-56 max-w-full" />
        <Skeleton className="h-4 w-40 max-w-full" />
      </div>
      <div className="col-span-2 flex gap-2 sm:col-start-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-40" />
      </div>
    </div>
  )
}
