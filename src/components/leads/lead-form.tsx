import { useRef, useState, type ComponentProps, type ReactNode } from "react"
import { useForm, type AnyFieldApi } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { DateTimePicker } from "@/components/shared/date-time-picker"
import { FormField } from "@/components/shared/form-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useMe } from "@/lib/api/auth"
import { ApiError, bodyFieldErrors, type DuplicateLeadDetail } from "@/lib/api/client"
import { createLead, updateLead, type LeadCreate } from "@/lib/api/leads"
import type { Lead } from "@/lib/api/types"
import { usersQueryOptions } from "@/lib/api/users"
import { digitsOnly, formatPhone, fullName, isoToMxParts, mxDateTimeToIso } from "@/lib/format"
import {
  CATEGORY_LABELS,
  LEAD_CATEGORIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  SOURCE_LABELS,
  STATUS_LABELS,
} from "@/lib/labels"
import { fieldErrors, focusFirstInvalid } from "@/lib/form"
import { notifyError } from "@/lib/notify"

const UNASSIGNED = "unassigned"
const PRICE_PATTERN = /^\d{1,8}(\.\d{1,2})?$/

function maxText(max: number) {
  return z.string().refine((value) => value.trim().length <= max, `Escribe máximo ${max} caracteres.`)
}

const phoneSchema = z.string().refine((value) => digitsOnly(value).length <= 20, "Escribe máximo 20 dígitos.")

function cleanPrice(value: string): string {
  return value.replace(/[\s,$]/g, "")
}

const leadSchema = z.object({
  business_name: z.string().trim().min(1, "Escribe el nombre del negocio.").max(255, "Escribe máximo 255 caracteres."),
  business_type: z.enum(LEAD_CATEGORIES),
  city: maxText(100),
  source: z.enum(LEAD_SOURCES),
  contact_name: maxText(255),
  phone_number: phoneSchema,
  whatsapp_number: phoneSchema,
  same_whatsapp: z.boolean(),
  email: maxText(255),
  website: maxText(255),
  instagram: maxText(255),
  facebook: maxText(255),
  status: z.enum(LEAD_STATUSES),
  quoted_price: z
    .string()
    .refine(
      (value) => value.trim() === "" || PRICE_PATTERN.test(cleanPrice(value)),
      "Escribe un monto válido de hasta 99,999,999.99 con máximo 2 decimales.",
    ),
  next_follow_up: z.string(),
  notes: z.string(),
  assigned_to_id: z.string(),
})

type LeadValues = z.input<typeof leadSchema>
type LeadPayload = Required<Omit<LeadCreate, "status">> & Pick<LeadCreate, "status">

function textOrNull(value: string): string | null {
  const text = value.trim()
  return text ? text : null
}

function phoneOrNull(value: string): string | null {
  const digits = digitsOnly(value)
  return digits ? digits : null
}

function priceOrNull(value: string): string | null {
  const text = cleanPrice(value.trim())
  return text ? Number(text).toFixed(2) : null
}

function toPayload(values: LeadValues): LeadPayload {
  const [date, time] = values.next_follow_up.split("T")
  return {
    business_name: values.business_name.trim(),
    business_type: values.business_type,
    source: values.source,
    status: values.status,
    city: textOrNull(values.city),
    contact_name: textOrNull(values.contact_name),
    phone_number: phoneOrNull(values.phone_number),
    whatsapp_number: phoneOrNull(values.same_whatsapp ? values.phone_number : values.whatsapp_number),
    email: textOrNull(values.email),
    website: textOrNull(values.website),
    instagram: textOrNull(values.instagram),
    facebook: textOrNull(values.facebook),
    quoted_price: priceOrNull(values.quoted_price),
    next_follow_up_at: date && time ? mxDateTimeToIso(date, time) : null,
    notes: textOrNull(values.notes),
    assigned_to_id: values.assigned_to_id === UNASSIGNED ? null : values.assigned_to_id,
  }
}

function changedFields(initial: LeadPayload, next: LeadPayload): Partial<LeadPayload> {
  const changes: Record<string, unknown> = {}
  for (const key of Object.keys(next) as (keyof LeadPayload)[]) {
    if (initial[key] !== next[key]) changes[key] = next[key]
  }
  return changes as Partial<LeadPayload>
}

function initialValues(lead: Lead | undefined, defaultAssignee: string): LeadValues {
  if (!lead) {
    return {
      business_name: "",
      business_type: "dentista",
      city: "",
      source: "maps",
      contact_name: "",
      phone_number: "",
      whatsapp_number: "",
      same_whatsapp: false,
      email: "",
      website: "",
      instagram: "",
      facebook: "",
      status: "pendiente",
      quoted_price: "",
      next_follow_up: "",
      notes: "",
      assigned_to_id: defaultAssignee,
    }
  }
  const followUp = lead.next_follow_up_at ? isoToMxParts(lead.next_follow_up_at) : null
  return {
    business_name: lead.business_name,
    business_type: lead.business_type,
    city: lead.city ?? "",
    source: lead.source,
    contact_name: lead.contact_name ?? "",
    phone_number: formatPhone(lead.phone_number),
    whatsapp_number: formatPhone(lead.whatsapp_number),
    same_whatsapp: Boolean(lead.phone_number) && lead.phone_number === lead.whatsapp_number,
    email: lead.email ?? "",
    website: lead.website ?? "",
    instagram: lead.instagram ?? "",
    facebook: lead.facebook ?? "",
    status: lead.status,
    quoted_price: lead.quoted_price ?? "",
    next_follow_up: followUp ? `${followUp.date}T${followUp.time}` : "",
    notes: lead.notes ?? "",
    assigned_to_id: lead.assigned_to_id ?? UNASSIGNED,
  }
}

const FIELD_NAMES: Record<string, keyof LeadValues> = {
  next_follow_up_at: "next_follow_up",
}

interface LeadFormProps {
  lead?: Lead
  onSaved: (lead: Lead) => void
  onCancel: () => void
}

type TextFieldName =
  | "business_name"
  | "city"
  | "contact_name"
  | "phone_number"
  | "email"
  | "website"
  | "instagram"
  | "facebook"
  | "quoted_price"

interface Option {
  value: string
  label: string
}

const CATEGORY_OPTIONS: Option[] = LEAD_CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] }))
const SOURCE_OPTIONS: Option[] = LEAD_SOURCES.map((value) => ({ value, label: SOURCE_LABELS[value] }))
const STATUS_OPTIONS: Option[] = LEAD_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <FieldSet className="min-w-0 gap-4 lg:px-6">
      <FieldLegend className="mb-3 font-bold data-[variant=legend]:text-lg">{title}</FieldLegend>
      {children}
    </FieldSet>
  )
}

export function LeadForm({ lead, onSaved, onCancel }: LeadFormProps) {
  const me = useMe()
  const isAdmin = me.role === "admin"
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)
  const [duplicate, setDuplicate] = useState<DuplicateLeadDetail | null>(null)
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const users = useQuery({ ...usersQueryOptions, enabled: isAdmin })
  const [startValues] = useState(() => initialValues(lead, me.id))

  const mutation = useMutation({
    mutationFn: (payload: Partial<LeadPayload>) =>
      lead ? updateLead(lead.id, payload) : createLead(payload as LeadCreate),
    onSuccess: async (saved) => {
      queryClient.setQueryData(["lead", saved.id], saved)
      await queryClient.invalidateQueries({ queryKey: ["leads"] })
    },
  })

  const form = useForm({
    defaultValues: startValues,
    validators: { onChange: leadSchema, onSubmit: leadSchema },
    onSubmitInvalid: () => focusFirstInvalid(formRef.current),
    onSubmit: async ({ value }) => {
      setDuplicate(null)
      setServerErrors({})
      const next = toPayload(value)
      const payload: Partial<LeadPayload> = lead ? changedFields(toPayload(startValues), next) : next
      if (!isAdmin && !lead) delete payload.assigned_to_id
      if (lead && Object.keys(payload).length === 0) {
        onCancel()
        return
      }
      try {
        const saved = await mutation.mutateAsync(payload)
        if (lead) {
          toast.success("Cambios guardados")
        } else {
          toast.success("Lead creado", {
            action: { label: "Ver lead", onClick: () => navigate({ to: "/leads/$leadId", params: { leadId: saved.id } }) },
          })
        }
        onSaved(saved)
      } catch (error) {
        if (error instanceof ApiError && error.duplicateLead) {
          setDuplicate(error.duplicateLead)
          return
        }
        const fields = bodyFieldErrors(error)
        if (Object.keys(fields).length > 0) {
          setServerErrors(
            Object.fromEntries(Object.entries(fields).map(([key, message]) => [FIELD_NAMES[key] ?? key, message])),
          )
          focusFirstInvalid(formRef.current)
          return
        }
        notifyError(error)
      }
    },
  })

  const clearServerError = (name: string) => {
    if (serverErrors[name]) {
      setServerErrors((current) => {
        const next = { ...current }
        delete next[name]
        return next
      })
    }
    if (duplicate && ["business_name", "phone_number", "whatsapp_number", "same_whatsapp"].includes(name)) {
      setDuplicate(null)
    }
  }

  const activeUsers = (users.data ?? []).filter((user) => user.is_active || user.id === lead?.assigned_to_id)

  const textField = (name: TextFieldName, label: string, props: Partial<ComponentProps<typeof Input>> = {}) => (
    <form.Field name={name}>
      {(field) => (
        <FormField field={field} label={label} serverError={serverErrors[name]}>
          <TextInput field={field} onEdit={clearServerError} serverError={serverErrors[name]} {...props} />
        </FormField>
      )}
    </form.Field>
  )

  const selectField = (name: "business_type" | "source" | "status", label: string, options: Option[]) => (
    <form.Field name={name}>
      {(field) => (
        <FormField field={field} label={label} serverError={serverErrors[name]}>
          <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as never)}>
            <SelectTrigger id={field.name} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}
    </form.Field>
  )

  return (
    <form
      ref={formRef}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
        <div className="grid gap-8 md:grid-cols-2 lg:-mx-6 lg:grid-cols-[1fr_1fr_0.85fr_1.15fr] lg:gap-0 lg:divide-x lg:divide-linea">
          <Column title="Negocio">
            {textField("business_name", "Nombre del negocio")}
            {selectField("business_type", "Giro", CATEGORY_OPTIONS)}
            {selectField("source", "Fuente", SOURCE_OPTIONS)}
            {textField("city", "Ciudad")}
          </Column>

          <Column title="Contacto">
            {textField("contact_name", "Nombre del contacto")}
            {textField("phone_number", "Teléfono", { type: "tel", inputMode: "tel", className: "tabular-nums" })}
            <form.Subscribe selector={(state) => [state.values.same_whatsapp, state.values.phone_number] as const}>
              {([sameWhatsapp, phone]) => (
                <form.Field name="whatsapp_number">
                  {(field) => (
                    <FormField field={field} label="WhatsApp" serverError={serverErrors[field.name]}>
                      <TextInput
                        field={field}
                        onEdit={clearServerError}
                        serverError={serverErrors[field.name]}
                        type="tel"
                        inputMode="tel"
                        className="tabular-nums"
                        disabled={sameWhatsapp}
                        displayValue={sameWhatsapp ? phone : undefined}
                      />
                    </FormField>
                  )}
                </form.Field>
              )}
            </form.Subscribe>
            <form.Field name="same_whatsapp">
              {(field) => (
                <Field orientation="horizontal" className="-mt-1">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => {
                      field.handleChange(checked === true)
                      clearServerError(field.name)
                    }}
                  />
                  <FieldLabel htmlFor={field.name} className="font-normal">
                    Es el mismo teléfono
                  </FieldLabel>
                </Field>
              )}
            </form.Field>
            {textField("email", "Correo", { type: "email", inputMode: "email" })}
          </Column>

          <Column title="En línea">
            {textField("website", "Sitio web", { inputMode: "url" })}
            {textField("instagram", "Instagram")}
            {textField("facebook", "Facebook")}
          </Column>

          <Column title="Seguimiento">
            {selectField("status", "Estado", STATUS_OPTIONS)}
            {textField("quoted_price", "Cotización (MXN)", { inputMode: "decimal", className: "tabular-nums" })}
            <form.Field name="next_follow_up">
              {(field) => (
                <FormField field={field} label="Próximo seguimiento" serverError={serverErrors[field.name]}>
                  <DateTimePicker
                    id={field.name}
                    value={field.state.value}
                    invalid={Boolean(serverErrors[field.name])}
                    onChange={(value) => {
                      field.handleChange(value)
                      clearServerError(field.name)
                    }}
                  />
                  {field.state.value && (
                    <div>
                      <button
                        type="button"
                        className="text-xs font-semibold text-menta hover:underline"
                        onClick={() => field.handleChange("")}
                      >
                        Quitar fecha
                      </button>
                    </div>
                  )}
                </FormField>
              )}
            </form.Field>
            {isAdmin && (
              <form.Field name="assigned_to_id">
                {(field) => (
                  <FormField field={field} label="Asignado a" serverError={serverErrors[field.name]}>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        field.handleChange(value)
                        clearServerError(field.name)
                      }}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue placeholder={users.isPending ? "Cargando usuarios…" : "Elegir"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED}>Sin asignar</SelectItem>
                        {activeUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {fullName(user)}
                            {user.id === me.id ? " (tú)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              </form.Field>
            )}
          </Column>
        </div>

        <div className="mt-8 border-t border-linea pt-6">
          <form.Field name="notes">
            {(field) => (
              <FormField field={field} label="Notas" serverError={serverErrors[field.name]}>
                <Textarea
                  id={field.name}
                  name={field.name}
                  rows={2}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(event.target.value)
                    clearServerError(field.name)
                  }}
                />
              </FormField>
            )}
          </form.Field>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-linea px-5 py-4 sm:px-6 lg:flex-row lg:items-center">
        <div className="min-w-0 lg:flex-1">
          {duplicate && (
            <div
              role="alert"
              className="flex flex-col items-start gap-2 rounded-lg border border-vencido/30 bg-vencido/5 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
            >
              <TriangleAlertIcon aria-hidden className="hidden size-4 shrink-0 text-vencido sm:block" />
              <p className="min-w-0 flex-1 text-tinta">
                Ya existe un lead con ese nombre o teléfono: <strong>{duplicate.business_name}</strong>. Si es otra
                sucursal, agrega algo que la distinga, como la colonia.
              </p>
              <Button asChild variant="outline" size="sm" className="shrink-0 bg-card">
                <Link to="/leads/$leadId" params={{ leadId: duplicate.lead_id }} onClick={onCancel}>
                  Ver lead existente
                </Link>
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando…" : lead ? "Guardar cambios" : "Crear lead"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </div>
    </form>
  )
}

interface TextInputProps extends Omit<ComponentProps<typeof Input>, "value" | "onChange" | "onBlur" | "id" | "name"> {
  field: AnyFieldApi
  onEdit: (name: string) => void
  serverError?: string
  displayValue?: string
}

function TextInput({ field, onEdit, serverError, displayValue, ...props }: TextInputProps) {
  return (
    <Input
      id={field.name}
      name={field.name}
      autoComplete="off"
      value={displayValue ?? (field.state.value as string)}
      aria-invalid={fieldErrors(field, serverError).length > 0 || undefined}
      onBlur={field.handleBlur}
      onChange={(event) => {
        field.handleChange(event.target.value)
        onEdit(field.name)
      }}
      {...props}
    />
  )
}
