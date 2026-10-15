import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Link, createFileRoute, stripSearchParams } from "@tanstack/react-router"
import { z } from "zod"
import { ChannelIcon } from "@/components/interactions/channel-icon"
import { DatePicker } from "@/components/shared/date-picker"
import { PageHeader } from "@/components/shared/page-header"
import { RelativeDate } from "@/components/shared/relative-date"
import { InlineError } from "@/components/shared/route-error"
import { Segmented } from "@/components/shared/segmented"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useMe } from "@/lib/api/auth"
import { activityQueryOptions } from "@/lib/api/interactions"
import { usersQueryOptions } from "@/lib/api/users"
import { formatDate, fullName, mxDateTimeToIso, rangeBounds, type RangePreset } from "@/lib/format"
import { CHANNEL_LABELS } from "@/lib/labels"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 50
const ALL = "all"

const RANGE_OPTIONS = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "custom", label: "Personalizado" },
] as const

const RANGE_TEXT: Record<Exclude<RangePreset, "custom">, string> = {
  today: "hoy",
  week: "esta semana",
  month: "este mes",
}

const searchDefaults = { range: "week", offset: 0 } as const

export const Route = createFileRoute("/_app/activity")({
  validateSearch: z.object({
    range: z.enum(["today", "week", "month", "custom"]).default(searchDefaults.range).catch(searchDefaults.range),
    from: z.iso.date().optional().catch(undefined),
    to: z.iso.date().optional().catch(undefined),
    user: z.uuid().optional().catch(undefined),
    offset: z.number().int().min(0).default(searchDefaults.offset).catch(searchDefaults.offset),
  }),
  search: { middlewares: [stripSearchParams(searchDefaults)] },
  component: ActivityPage,
})

function dayLabel(value: string): string {
  return formatDate(mxDateTimeToIso(value, "12:00"))
}

function ActivityPage() {
  const me = useMe()
  const isAdmin = me.role === "admin"
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const users = useQuery({ ...usersQueryOptions, enabled: isAdmin })
  const bounds = rangeBounds(search.range, { from: search.from, to: search.to })
  const query = useQuery({
    ...activityQueryOptions({
      user_id: search.user,
      date_from: bounds.from,
      date_to: bounds.to,
      limit: PAGE_SIZE,
      offset: search.offset,
    }),
    placeholderData: keepPreviousData,
  })

  const update = (patch: Partial<typeof search>) => {
    void navigate({ search: (previous) => ({ ...previous, offset: 0, ...patch }) })
  }

  const selectedUser = isAdmin ? users.data?.find((user) => user.id === search.user) : undefined
  const rangeText =
    search.range !== "custom"
      ? RANGE_TEXT[search.range]
      : search.from && search.to
        ? `del ${dayLabel(search.from)} al ${dayLabel(search.to)}`
        : search.from
          ? `desde el ${dayLabel(search.from)}`
          : search.to
            ? `hasta el ${dayLabel(search.to)}`
            : "en total"
  const whoText = search.user ? (search.user === me.id ? " por ti" : selectedUser ? ` por ${fullName(selectedUser)}` : "") : ""

  const total = query.data?.total ?? 0
  const items = query.data?.items ?? []
  const from = total === 0 ? 0 : search.offset + 1
  const to = Math.min(search.offset + items.length, total)

  return (
    <div>
      <PageHeader title="Actividad" />

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Segmented
            label="Periodo"
            value={search.range}
            onChange={(range) => update({ range })}
            options={RANGE_OPTIONS}
          />
          {isAdmin ? (
            <Select value={search.user ?? ALL} onValueChange={(value) => update({ user: value === ALL ? undefined : value })}>
              <SelectTrigger aria-label="Usuario">
                <span className="text-pizarra">Usuario:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todo el equipo</SelectItem>
                {(users.data ?? []).map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {fullName(user)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Segmented
              label="Usuario"
              joined
              value={search.user === me.id ? "me" : "all"}
              onChange={(value) => update({ user: value === "me" ? me.id : undefined })}
              options={[
                { value: "all", label: "Todo el equipo" },
                { value: "me", label: "Solo yo" },
              ]}
            />
          )}
        </div>

        {search.range === "custom" && (
          <div className="flex flex-wrap gap-3">
            <Field className="w-full sm:w-60">
              <FieldLabel htmlFor="activity-from">Desde</FieldLabel>
              <DatePicker id="activity-from" value={search.from ?? ""} onChange={(value) => update({ from: value })} />
            </Field>
            <Field className="w-full sm:w-60">
              <FieldLabel htmlFor="activity-to">Hasta</FieldLabel>
              <DatePicker id="activity-to" value={search.to ?? ""} onChange={(value) => update({ to: value })} />
            </Field>
          </div>
        )}

        {query.isPending ? (
          <ActivitySkeleton />
        ) : query.isError ? (
          <InlineError error={query.error} onRetry={() => void query.refetch()} />
        ) : (
          <>
            <p className={cn("text-lg text-tinta transition-opacity", query.isPlaceholderData && "opacity-60")}>
              <span className="font-bold tabular-nums">{total}</span>{" "}
              {total === 1 ? "contacto registrado" : "contactos registrados"} {rangeText}
              {whoText}
            </p>

            {total === 0 ? (
              <div className="flex flex-col items-start gap-3 rounded-xl border border-linea bg-card px-5 py-8">
                <p className="text-pizarra">No hay contactos registrados en este periodo.</p>
                <Button asChild>
                  <Link to="/">Ver seguimientos de hoy</Link>
                </Button>
              </div>
            ) : (
              <div className={cn("flex flex-col gap-4 transition-opacity", query.isPlaceholderData && "opacity-60")}>
                <ul className="divide-y divide-linea rounded-xl border border-linea bg-card">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="grid gap-x-4 gap-y-1 px-4 py-3 md:grid-cols-[132px_140px_128px_minmax(0,1fr)_minmax(0,1.4fr)] md:items-center md:px-5"
                    >
                      <span className="order-2 text-xs text-pizarra md:order-none md:text-sm md:text-tinta">
                        <RelativeDate value={item.created_at} />
                      </span>
                      <span className="order-3 hidden truncate text-tinta md:order-none md:block">{item.user.name}</span>
                      <span className="order-3 flex items-center gap-2 text-xs text-pizarra md:order-none md:text-sm md:text-tinta">
                        <ChannelIcon channel={item.contact_channel} />
                        {CHANNEL_LABELS[item.contact_channel]}
                        <span className="md:hidden">por {item.user.name}</span>
                      </span>
                      <Link
                        to="/leads/$leadId"
                        params={{ leadId: item.lead.id }}
                        className="order-1 min-w-0 truncate font-semibold text-tinta hover:text-menta hover:underline md:order-none"
                      >
                        {item.lead.business_name}
                      </Link>
                      <span className="order-4 truncate text-pizarra md:order-none" title={item.what_happened ?? undefined}>
                        {item.what_happened ?? "Sin nota"}
                      </span>
                    </li>
                  ))}
                </ul>
                <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-pizarra tabular-nums">
                    Mostrando {from}–{to} de {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="bg-card"
                      disabled={search.offset === 0}
                      onClick={() => update({ offset: Math.max(0, search.offset - PAGE_SIZE) })}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-card"
                      disabled={search.offset + PAGE_SIZE >= total}
                      onClick={() => update({ offset: search.offset + PAGE_SIZE })}
                    >
                      Siguiente
                    </Button>
                  </div>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <Skeleton className="h-6 w-72 max-w-full" />
      <div className="divide-y divide-linea rounded-xl border border-linea bg-card">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2 px-5 py-3.5 md:flex-row md:items-center md:gap-6">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
