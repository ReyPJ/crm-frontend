import { useQuery } from "@tanstack/react-query"
import { ChevronDownIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react"
import { DebouncedInput } from "@/components/shared/debounced-input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldLabel } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { hasActiveFilters, type LeadsSearch } from "@/components/leads/leads-search"
import { useMe } from "@/lib/api/auth"
import type { LeadStatus } from "@/lib/api/types"
import { usersQueryOptions } from "@/lib/api/users"
import { fullName } from "@/lib/format"
import { CATEGORY_LABELS, LEAD_CATEGORIES, LEAD_SOURCES, LEAD_STATUSES, SOURCE_LABELS, STATUS_LABELS } from "@/lib/labels"

const ALL = "all"

const SORT_OPTIONS = {
  "created_at:desc": "Recién agregados",
  "next_follow_up_at:asc": "Próximo seguimiento",
  "last_contacted_at:desc": "Último contacto",
  "business_name:asc": "Nombre del negocio",
} as const

type SortKey = keyof typeof SORT_OPTIONS

interface LeadFiltersBarProps {
  search: LeadsSearch
  onChange: (patch: Partial<LeadsSearch>) => void
  onClear: () => void
}

export function LeadFiltersBar({ search, onChange, onClear }: LeadFiltersBarProps) {
  const me = useMe()
  const isAdmin = me.role === "admin"
  const users = useQuery({ ...usersQueryOptions, enabled: isAdmin })
  const statuses = search.status ?? []
  const extraCount = [search.business_type, search.source, search.city, search.has_website !== undefined].filter(Boolean).length
  const sortKey = `${search.order_by}:${search.order_dir}`

  const toggleStatus = (status: LeadStatus, checked: boolean) => {
    const next = checked ? [...statuses, status] : statuses.filter((item) => item !== status)
    onChange({ status: next.length ? LEAD_STATUSES.filter((item) => next.includes(item)) : undefined })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-auto sm:min-w-64 sm:flex-1 lg:max-w-80">
        <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-pizarra" />
        <DebouncedInput
          type="search"
          aria-label="Buscar"
          placeholder="Buscar negocio, contacto o teléfono"
          className="pl-9"
          value={search.q ?? ""}
          onCommit={(value) => onChange({ q: value.trim() ? value : undefined })}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="bg-card font-normal">
            Estado
            {statuses.length > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-menta px-1.5 text-xs font-bold text-white tabular-nums">
                {statuses.length}
              </span>
            )}
            <ChevronDownIcon className="text-pizarra" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {LEAD_STATUSES.map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={statuses.includes(status)}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(checked) => toggleStatus(status, checked === true)}
            >
              {STATUS_LABELS[status]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Select
        value={search.assigned_to ?? ALL}
        onValueChange={(value) => onChange({ assigned_to: value === ALL ? undefined : (value as LeadsSearch["assigned_to"]) })}
      >
        <SelectTrigger aria-label="Asignado" className="max-w-full">
          <span className="text-pizarra">Asignado:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos</SelectItem>
          <SelectItem value="me">Míos</SelectItem>
          <SelectItem value="unassigned">Sin asignar</SelectItem>
          {isAdmin &&
            (users.data ?? [])
              .filter((user) => user.id !== me.id)
              .map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {fullName(user)}
                </SelectItem>
              ))}
        </SelectContent>
      </Select>

      <Select
        value={search.follow_up ?? ALL}
        onValueChange={(value) => onChange({ follow_up: value === ALL ? undefined : (value as LeadsSearch["follow_up"]) })}
      >
        <SelectTrigger aria-label="Seguimiento">
          <span className="text-pizarra">Seguimiento:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos</SelectItem>
          <SelectItem value="overdue">Vencidos</SelectItem>
          <SelectItem value="today">Hoy</SelectItem>
          <SelectItem value="upcoming">Próximos</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="bg-card font-normal">
            <SlidersHorizontalIcon className="text-pizarra" />
            Más filtros
            {extraCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-menta px-1.5 text-xs font-bold text-white tabular-nums">
                {extraCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="flex w-72 flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="filter-business-type">Giro</FieldLabel>
            <Select
              value={search.business_type ?? ALL}
              onValueChange={(value) =>
                onChange({ business_type: value === ALL ? undefined : (value as LeadsSearch["business_type"]) })
              }
            >
              <SelectTrigger id="filter-business-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {LEAD_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="filter-source">Fuente</FieldLabel>
            <Select
              value={search.source ?? ALL}
              onValueChange={(value) => onChange({ source: value === ALL ? undefined : (value as LeadsSearch["source"]) })}
            >
              <SelectTrigger id="filter-source" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {LEAD_SOURCES.map((source) => (
                  <SelectItem key={source} value={source}>
                    {SOURCE_LABELS[source]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="filter-website">Sitio web</FieldLabel>
            <Select
              value={search.has_website === undefined ? ALL : String(search.has_website)}
              onValueChange={(value) => onChange({ has_website: value === ALL ? undefined : value === "true" })}
            >
              <SelectTrigger id="filter-website" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                <SelectItem value="true">Con sitio web</SelectItem>
                <SelectItem value="false">Sin sitio web</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="filter-city">Ciudad</FieldLabel>
            <DebouncedInput
              id="filter-city"
              placeholder="Nombre exacto, por ejemplo Puebla"
              value={search.city ?? ""}
              onCommit={(value) => onChange({ city: value.trim() ? value : undefined })}
            />
          </Field>
        </PopoverContent>
      </Popover>

      <div className="flex h-10 items-center gap-2 px-1 sm:h-9">
        <Switch id="filter-archived" checked={search.archived} onCheckedChange={(checked) => onChange({ archived: checked })} />
        <Label htmlFor="filter-archived" className="font-normal">
          Ver archivados
        </Label>
      </div>

      <Select
        value={sortKey in SORT_OPTIONS ? sortKey : "created_at:desc"}
        onValueChange={(value) => {
          const [orderBy, orderDir] = value.split(":") as [LeadsSearch["order_by"], LeadsSearch["order_dir"]]
          onChange({ order_by: orderBy, order_dir: orderDir })
        }}
      >
        <SelectTrigger aria-label="Ordenar" className="md:hidden">
          <span className="text-pizarra">Orden:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(SORT_OPTIONS) as SortKey[]).map((key) => (
            <SelectItem key={key} value={key}>
              {SORT_OPTIONS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters(search) && (
        <Button variant="link" className="px-2" onClick={onClear}>
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}
