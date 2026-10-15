import { useNavigate, Link } from "@tanstack/react-router"
import {
  createColumnHelper,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react"
import { ContactIconActions } from "@/components/leads/contact-actions"
import { FollowUpDate } from "@/components/leads/follow-up-date"
import type { LeadsSearch } from "@/components/leads/leads-search"
import { StatusPill } from "@/components/leads/status-pill"
import { RelativeDate } from "@/components/shared/relative-date"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Lead } from "@/lib/api/types"
import { formatPhone } from "@/lib/format"
import { cn } from "@/lib/utils"

const features = tableFeatures({ rowSortingFeature, rowPaginationFeature })
const helper = createColumnHelper<typeof features, Lead>()

const columns = helper.columns([
  helper.accessor("business_name", {
    header: "Negocio",
    enableSorting: true,
    sortDescFirst: false,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col">
        <Link
          to="/leads/$leadId"
          params={{ leadId: row.original.id }}
          className="font-semibold break-words text-tinta hover:text-menta hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {row.original.business_name}
        </Link>
        {row.original.city && <span className="text-xs text-pizarra">{row.original.city}</span>}
      </div>
    ),
  }),
  helper.accessor("contact_name", {
    header: "Contacto",
    enableSorting: false,
    cell: ({ row }) => {
      const phone = row.original.phone_number || row.original.whatsapp_number
      return (
        <div className="flex flex-col">
          <span className="text-tinta">{row.original.contact_name ?? ""}</span>
          {phone && <span className="text-xs text-pizarra tabular-nums">{formatPhone(phone)}</span>}
        </div>
      )
    },
  }),
  helper.accessor("status", {
    header: "Estado",
    enableSorting: false,
    cell: ({ getValue }) => <StatusPill status={getValue()} />,
  }),
  helper.accessor((lead) => lead.assigned_to?.name ?? null, {
    id: "assigned_to",
    header: "Asignado",
    enableSorting: false,
    cell: ({ getValue }) => <span className={getValue() ? "text-tinta" : "text-pizarra"}>{getValue() ?? "Sin asignar"}</span>,
  }),
  helper.accessor("next_follow_up_at", {
    header: "Próximo seguimiento",
    enableSorting: true,
    sortDescFirst: false,
    cell: ({ getValue }) => <FollowUpDate value={getValue()} />,
  }),
  helper.accessor("last_contacted_at", {
    header: "Último contacto",
    enableSorting: true,
    sortDescFirst: true,
    cell: ({ getValue }) => {
      const value = getValue()
      return value ? <RelativeDate value={value} className="text-tinta" /> : <span className="text-pizarra">Nunca</span>
    },
  }),
  helper.display({
    id: "actions",
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => <ContactIconActions lead={row.original} />,
  }),
])

interface LeadsTableProps {
  leads: Lead[]
  total: number
  search: LeadsSearch
  loading: boolean
  onChange: (patch: Partial<LeadsSearch>) => void
}

export function LeadsTable({ leads, total, search, loading, onChange }: LeadsTableProps) {
  const navigate = useNavigate()
  const sorting: SortingState =
    search.order_by === "created_at" ? [] : [{ id: search.order_by, desc: search.order_dir === "desc" }]
  const pagination: PaginationState = {
    pageIndex: Math.floor(search.offset / search.limit),
    pageSize: search.limit,
  }

  const table = useTable({
    features,
    columns,
    data: leads,
    rowCount: total,
    getRowId: (lead) => lead.id,
    state: { sorting, pagination },
    manualSorting: true,
    manualPagination: true,
    enableMultiSort: false,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater
      const first = next[0]
      onChange(
        first
          ? { order_by: first.id as LeadsSearch["order_by"], order_dir: first.desc ? "desc" : "asc", offset: 0 }
          : { order_by: "created_at", order_dir: "desc", offset: 0 },
      )
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater
      onChange({ offset: next.pageIndex * next.pageSize, limit: next.pageSize })
    },
  })

  const openLead = (leadId: string) => navigate({ to: "/leads/$leadId", params: { leadId } })
  const from = total === 0 ? 0 : search.offset + 1
  const to = Math.min(search.offset + leads.length, total)

  return (
    <div className={cn("flex flex-col gap-4 transition-opacity", loading && "opacity-60")}>
      <div className="hidden overflow-hidden rounded-xl border border-linea bg-card md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={sorted ? (sorted === "asc" ? "ascending" : "descending") : undefined}
                      className="h-11 px-4 text-xs font-semibold text-pizarra"
                    >
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="-mx-1 inline-flex items-center gap-1 rounded-md px-1 py-1 hover:text-tinta focus-visible:outline-2 focus-visible:outline-menta"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUpIcon className="size-4 text-menta" />
                          ) : sorted === "desc" ? (
                            <ArrowDownIcon className="size-4 text-menta" />
                          ) : (
                            <ChevronsUpDownIcon className="size-4" />
                          )}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-porcelana"
                onClick={() => openLead(row.original.id)}
              >
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3 align-middle whitespace-normal">
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-linea rounded-xl border border-linea bg-card md:hidden">
        {leads.map((lead) => {
          const phone = lead.phone_number || lead.whatsapp_number
          return (
            <li key={lead.id} className="flex items-start gap-2 px-4 py-3">
              <Link to="/leads/$leadId" params={{ leadId: lead.id }} className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold break-words text-tinta">{lead.business_name}</span>
                  <StatusPill status={lead.status} />
                </span>
                {(lead.contact_name || phone) && (
                  <span className="flex flex-wrap gap-x-3 text-xs text-pizarra">
                    {lead.contact_name && <span>{lead.contact_name}</span>}
                    {phone && <span className="tabular-nums">{formatPhone(phone)}</span>}
                  </span>
                )}
                <span className="flex flex-wrap gap-x-3 text-xs text-pizarra">
                  <span>{lead.assigned_to?.name ?? "Sin asignar"}</span>
                  {lead.next_follow_up_at && (
                    <span>
                      Seguimiento <FollowUpDate value={lead.next_follow_up_at} plain />
                    </span>
                  )}
                </span>
              </Link>
              <ContactIconActions lead={lead} />
            </li>
          )
        })}
      </ul>

      <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-pizarra tabular-nums">
          Mostrando {from}–{to} de {total}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-card" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
            Anterior
          </Button>
          <Button variant="outline" className="bg-card" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            Siguiente
          </Button>
        </div>
      </nav>
    </div>
  )
}

export function LeadsTableSkeleton() {
  return (
    <div aria-busy="true" className="rounded-xl border border-linea bg-card">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-6 border-b border-linea px-4 py-4 last:border-0">
          <div className="flex w-56 flex-col gap-1.5">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="hidden w-40 flex-col gap-1.5 md:flex">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="hidden h-4 w-28 lg:block" />
        </div>
      ))}
    </div>
  )
}
