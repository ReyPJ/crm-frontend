import { useState, type ReactNode } from "react"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router"
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ChevronLeftIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  GlobeIcon,
  MailIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"
import { InteractionForm } from "@/components/interactions/interaction-form"
import { InteractionTimeline } from "@/components/interactions/interaction-timeline"
import { AssigneeCombobox } from "@/components/leads/assignee-combobox"
import { ContactButtons } from "@/components/leads/contact-actions"
import { FollowUpDate } from "@/components/leads/follow-up-date"
import { LeadDialog } from "@/components/leads/lead-dialog"
import { StatusPill } from "@/components/leads/status-pill"
import { NotFound } from "@/components/shared/not-found"
import { RelativeDate } from "@/components/shared/relative-date"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useMe } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { leadInteractionsQueryOptions } from "@/lib/api/interactions"
import { archiveLead, deleteLead, leadQueryOptions, unarchiveLead, updateLead, type LeadUpdate } from "@/lib/api/leads"
import type { Lead, LeadStatus } from "@/lib/api/types"
import { canEditLead } from "@/lib/auth"
import { formatCurrency, formatDate, formatPhone, socialUrl, websiteUrl } from "@/lib/format"
import { CATEGORY_LABELS, LEAD_STATUSES, SOURCE_LABELS, STATUS_LABELS } from "@/lib/labels"
import { notifyError } from "@/lib/notify"

export const Route = createFileRoute("/_app/leads/$leadId")({
  loader: async ({ context, params }) => {
    try {
      await Promise.all([
        context.queryClient.ensureQueryData(leadQueryOptions(params.leadId)),
        context.queryClient.ensureQueryData(leadInteractionsQueryOptions(params.leadId)),
      ])
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 422)) throw notFound()
      throw error
    }
  },
  pendingComponent: LeadDetailSkeleton,
  notFoundComponent: () => (
    <NotFound
      title="No encontramos este lead"
      description="Puede que lo hayan eliminado o que el enlace esté incompleto."
      to="/leads"
      linkLabel="Ir a la lista de leads"
    />
  ),
  component: LeadDetailPage,
})

function useLeadMutation<TVariables>(lead: Lead, mutationFn: (variables: TVariables) => Promise<Lead>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: async (saved) => {
      queryClient.setQueryData(["lead", saved.id], saved)
      await queryClient.invalidateQueries({ queryKey: ["leads"] })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 404) {
        void queryClient.invalidateQueries({ queryKey: ["lead", lead.id] })
      }
      notifyError(error)
    },
  })
}

function LeadDetailPage() {
  const { leadId } = Route.useParams()
  const { data: lead } = useSuspenseQuery(leadQueryOptions(leadId))
  const { data: interactions } = useSuspenseQuery(leadInteractionsQueryOptions(leadId))
  const me = useMe()
  const isAdmin = me.role === "admin"
  const canEdit = canEditLead(lead, me)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const update = useLeadMutation(lead, (data: LeadUpdate) => updateLead(lead.id, data))
  const archive = useLeadMutation(lead, () => archiveLead(lead.id))
  const unarchive = useLeadMutation(lead, () => unarchiveLead(lead.id))
  const remove = useMutation({
    mutationFn: () => deleteLead(lead.id),
    onSuccess: async () => {
      setConfirmDelete(false)
      toast.success("Lead eliminado")
      await navigate({ to: "/leads" })
      queryClient.removeQueries({ queryKey: ["lead", lead.id] })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
        queryClient.invalidateQueries({ queryKey: ["interactions"] }),
      ])
    },
    onError: notifyError,
  })

  const changeStatus = (status: LeadStatus) => {
    update.mutate({ status }, { onSuccess: () => toast.success("Estado actualizado") })
  }
  const removeFollowUp = () => {
    update.mutate({ next_follow_up_at: null }, { onSuccess: () => toast.success("Seguimiento quitado") })
  }
  const doArchive = () => archive.mutate(undefined, { onSuccess: () => toast.success("Lead archivado") })
  const doUnarchive = () => unarchive.mutate(undefined, { onSuccess: () => toast.success("Lead desarchivado") })

  const website = websiteUrl(lead.website)
  const instagram = socialUrl(lead.instagram, "instagram")
  const facebook = socialUrl(lead.facebook, "facebook")

  return (
    <div className="flex flex-col gap-6">
      <Link to="/leads" className="-ml-1 flex w-fit items-center gap-1 rounded-md px-1 text-pizarra hover:text-tinta">
        <ChevronLeftIcon aria-hidden className="size-4" />
        Leads
      </Link>

      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-xl font-bold break-words text-tinta">{lead.business_name}</h1>
            <StatusPill status={lead.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-pizarra">
            <span>{CATEGORY_LABELS[lead.business_type]}</span>
            {isAdmin ? (
              <AssigneeCombobox lead={lead} />
            ) : (
              <span>{lead.assigned_to ? `Asignado a ${lead.assigned_to.name}` : "Sin asignar"}</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <ContactButtons lead={lead} />
            {lead.email && (
              <LinkButton href={`mailto:${lead.email}`} icon={<MailIcon className="text-pizarra" />}>
                Correo
              </LinkButton>
            )}
            {website && (
              <LinkButton href={website} icon={<GlobeIcon className="text-pizarra" />}>
                Sitio web
              </LinkButton>
            )}
            {instagram && (
              <LinkButton href={instagram} icon={<ExternalLinkIcon className="text-pizarra" />}>
                Instagram
              </LinkButton>
            )}
            {facebook && (
              <LinkButton href={facebook} icon={<ExternalLinkIcon className="text-pizarra" />}>
                Facebook
              </LinkButton>
            )}
          </div>

          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <Select value={lead.status} onValueChange={(value) => changeStatus(value as LeadStatus)} disabled={update.isPending}>
                <SelectTrigger aria-label="Estado" className="min-w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {LEAD_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="bg-card" onClick={() => setEditing(true)}>
                <PencilIcon className="text-pizarra" />
                Editar
              </Button>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="bg-card" aria-label="Más acciones">
                        <EllipsisIcon className="text-pizarra" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Más acciones</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-48">
                  {lead.archived_at ? (
                    <DropdownMenuItem onSelect={doUnarchive}>
                      <ArchiveRestoreIcon />
                      Desarchivar
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={doArchive}>
                      <ArchiveIcon />
                      Archivar
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                        <Trash2Icon />
                        Eliminar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      {lead.archived_at && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-linea bg-card px-4 py-3">
          <p className="text-tinta">Este lead está archivado.</p>
          {canEdit && (
            <Button variant="outline" onClick={doUnarchive} disabled={unarchive.isPending}>
              Desarchivar
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <section className="order-2 rounded-xl border border-linea bg-card lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <h2 className="border-b border-linea px-5 py-4 text-lg font-semibold text-tinta">Datos</h2>
          <dl className="divide-y divide-linea px-5">
            <DataRow label="Contacto" value={lead.contact_name} />
            <DataRow label="Teléfono" value={lead.phone_number && <span className="tabular-nums">{formatPhone(lead.phone_number)}</span>} />
            <DataRow label="WhatsApp" value={lead.whatsapp_number && <span className="tabular-nums">{formatPhone(lead.whatsapp_number)}</span>} />
            <DataRow label="Correo" value={lead.email && <span className="break-all">{lead.email}</span>} />
            <DataRow label="Ciudad" value={lead.city} />
            <DataRow label="Fuente" value={SOURCE_LABELS[lead.source]} />
            <DataRow label="Cotización" value={lead.quoted_price && <span className="tabular-nums">{formatCurrency(lead.quoted_price)}</span>} />
            <DataRow
              label="Próximo seguimiento"
              value={
                lead.next_follow_up_at && (
                  <span className="flex flex-wrap items-center gap-x-3">
                    <FollowUpDate value={lead.next_follow_up_at} />
                    {canEdit && (
                      <Button variant="link" size="sm" className="h-auto px-0" disabled={update.isPending} onClick={removeFollowUp}>
                        Quitar
                      </Button>
                    )}
                  </span>
                )
              }
            />
            <DataRow label="Último contacto" value={lead.last_contacted_at && <RelativeDate value={lead.last_contacted_at} />} />
            <DataRow label="Notas" value={lead.notes && <span className="whitespace-pre-line break-words">{lead.notes}</span>} />
            <DataRow label="Alta" value={formatDate(lead.created_at)} />
          </dl>
        </section>

        <section className="order-1 rounded-xl border border-linea bg-card p-5 lg:order-none lg:col-start-2 lg:row-start-1">
          <h2 className="mb-4 text-lg font-semibold text-tinta">Registrar contacto</h2>
          <InteractionForm leadId={lead.id} />
        </section>

        <section className="order-3 rounded-xl border border-linea bg-card p-5 lg:order-none lg:col-start-2 lg:row-start-2">
          <h2 className="mb-4 text-lg font-semibold text-tinta">Historial</h2>
          <InteractionTimeline interactions={interactions} />
        </section>
      </div>

      {canEdit && <LeadDialog lead={lead} open={editing} onOpenChange={setEditing} />}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {lead.business_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán el lead y todo su historial de contactos. No se puede deshacer. Si solo quieres quitarlo de la lista, archívalo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={(event) => {
                event.preventDefault()
                remove.mutate()
              }}
            >
              {remove.isPending ? "Eliminando…" : "Eliminar lead"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function LinkButton({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  const external = href.startsWith("http")
  return (
    <Button asChild variant="outline" className="bg-card">
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
        {icon}
        {children}
      </a>
    </Button>
  )
}

function DataRow({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "" || value === false) return null
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-baseline gap-x-4 py-3">
      <dt className="text-xs text-pizarra">{label}</dt>
      <dd className="min-w-0 text-tinta">{value}</dd>
    </div>
  )
}

function LeadDetailSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <Skeleton className="h-5 w-16" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-7 w-72 max-w-full" />
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-4 rounded-xl border border-linea bg-card p-5">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
        <div className="flex flex-col gap-4 rounded-xl border border-linea bg-card p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  )
}
