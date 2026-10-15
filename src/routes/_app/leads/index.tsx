import { useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { createFileRoute, stripSearchParams } from "@tanstack/react-router"
import { LeadDialog } from "@/components/leads/lead-dialog"
import { LeadFiltersBar } from "@/components/leads/lead-filters"
import { LeadsTable, LeadsTableSkeleton } from "@/components/leads/leads-table"
import {
  LEADS_SEARCH_DEFAULTS,
  hasActiveFilters,
  leadsSearchSchema,
  toLeadFilters,
  type LeadsSearch,
} from "@/components/leads/leads-search"
import { PageHeader } from "@/components/shared/page-header"
import { InlineError } from "@/components/shared/route-error"
import { Button } from "@/components/ui/button"
import { leadsQueryOptions } from "@/lib/api/leads"

export const Route = createFileRoute("/_app/leads/")({
  validateSearch: leadsSearchSchema,
  search: { middlewares: [stripSearchParams(LEADS_SEARCH_DEFAULTS)] },
  component: LeadsPage,
})

function LeadsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [creating, setCreating] = useState(false)
  const query = useQuery({ ...leadsQueryOptions(toLeadFilters(search)), placeholderData: keepPreviousData })

  const update = (patch: Partial<LeadsSearch>) => {
    void navigate({ search: (previous) => ({ ...previous, offset: 0, ...patch }) })
  }
  const clear = () => {
    void navigate({ search: { order_by: search.order_by, order_dir: search.order_dir, limit: search.limit } })
  }

  return (
    <div>
      <PageHeader title="Leads">
        <Button onClick={() => setCreating(true)}>Nuevo lead</Button>
      </PageHeader>

      <div className="flex flex-col gap-4">
        <LeadFiltersBar search={search} onChange={update} onClear={clear} />

        {query.isPending ? (
          <LeadsTableSkeleton />
        ) : query.isError ? (
          <InlineError error={query.error} onRetry={() => void query.refetch()} />
        ) : query.data.total === 0 ? (
          <EmptyLeads search={search} onClear={clear} onCreate={() => setCreating(true)} />
        ) : (
          <LeadsTable
            leads={query.data.items}
            total={query.data.total}
            search={search}
            loading={query.isPlaceholderData}
            onChange={update}
          />
        )}
      </div>

      <LeadDialog open={creating} onOpenChange={setCreating} />
    </div>
  )
}

function EmptyLeads({ search, onClear, onCreate }: { search: LeadsSearch; onClear: () => void; onCreate: () => void }) {
  const filtered = hasActiveFilters(search)
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-linea bg-card px-5 py-8">
      <p className="text-lg font-semibold text-tinta">
        {search.archived
          ? "No hay leads archivados con estos filtros."
          : filtered
            ? "No hay leads con estos filtros."
            : "Aún no hay leads."}
      </p>
      <p className="text-pizarra">
        {filtered
          ? "Prueba con otra búsqueda o quita algunos filtros."
          : "Da de alta los negocios que encuentres en Google Maps, redes o por referidos."}
      </p>
      {filtered ? (
        <Button variant="outline" onClick={onClear}>
          Limpiar filtros
        </Button>
      ) : (
        <Button onClick={onCreate}>Nuevo lead</Button>
      )}
    </div>
  )
}
