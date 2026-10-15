import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute, stripSearchParams } from "@tanstack/react-router"
import { z } from "zod"
import { AgendaGroup } from "@/components/leads/agenda"
import { Segmented } from "@/components/shared/segmented"
import { Button } from "@/components/ui/button"
import { useMe } from "@/lib/api/auth"
import { leadsQueryOptions, type LeadFilters } from "@/lib/api/leads"
import { formatLongDay } from "@/lib/format"

const VIEW_OPTIONS = [
  { value: "mine", label: "Míos" },
  { value: "team", label: "Equipo" },
] as const

export const Route = createFileRoute("/_app/")({
  validateSearch: z.object({
    view: z.enum(["mine", "team"]).default("mine").catch("mine"),
  }),
  search: { middlewares: [stripSearchParams({ view: "mine" })] },
  component: TodayPage,
})

function TodayPage() {
  const me = useMe()
  const isAdmin = me.role === "admin"
  const { view } = Route.useSearch()
  const navigate = Route.useNavigate()
  const team = isAdmin && view === "team"
  const [longDay] = useState(() => formatLongDay(new Date()))

  const base: LeadFilters = {
    assigned_to: team ? undefined : "me",
    order_by: "next_follow_up_at",
    order_dir: "asc",
  }
  const overdue = useQuery(leadsQueryOptions({ ...base, follow_up: "overdue" }))
  const today = useQuery(leadsQueryOptions({ ...base, follow_up: "today" }))
  const upcoming = useQuery(leadsQueryOptions({ ...base, follow_up: "upcoming", limit: 10 }))
  const unassigned = useQuery({ ...leadsQueryOptions({ assigned_to: "unassigned", limit: 1 }), enabled: isAdmin })

  const unassignedTotal = unassigned.data?.total ?? 0
  const upcomingTotal = upcoming.data?.total ?? 0

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-tinta">Hoy, {longDay}</h1>
          {isAdmin && (
            <Segmented
              label="Ver seguimientos de"
              joined
              value={view}
              onChange={(next) => void navigate({ search: { view: next } })}
              options={VIEW_OPTIONS}
            />
          )}
        </div>
        {isAdmin && unassignedTotal > 0 && (
          <Link
            to="/leads"
            search={{ assigned_to: "unassigned" }}
            className="w-fit text-menta underline-offset-4 hover:underline"
          >
            {unassignedTotal === 1 ? "1 lead sin asignar" : `${unassignedTotal} leads sin asignar`}
          </Link>
        )}
      </header>

      <AgendaGroup
        kind="overdue"
        title="Vencidos"
        query={overdue}
        showAssignee={team}
        empty={<p>Sin seguimientos vencidos.</p>}
      />

      <AgendaGroup
        kind="today"
        title="Para hoy"
        query={today}
        showAssignee={team}
        empty={
          <>
            <p>{team ? "El equipo no tiene seguimientos para hoy." : "No tienes seguimientos para hoy."}</p>
            <Button asChild variant="link" className="h-auto px-0">
              <Link to="/leads" search={{ status: ["pendiente"], assigned_to: team ? undefined : "me" }}>
                Ver leads pendientes
              </Link>
            </Button>
          </>
        }
      />

      <AgendaGroup
        kind="upcoming"
        title="Próximos"
        query={upcoming}
        showAssignee={team}
        empty={<p>Sin seguimientos próximos.</p>}
        footer={
          upcomingTotal > 10 && (
            <Button asChild variant="link" className="w-fit px-0">
              <Link
                to="/leads"
                search={{
                  follow_up: "upcoming",
                  assigned_to: team ? undefined : "me",
                  order_by: "next_follow_up_at",
                  order_dir: "asc",
                }}
              >
                Ver los {upcomingTotal} próximos
              </Link>
            </Button>
          )
        }
      />
    </div>
  )
}
