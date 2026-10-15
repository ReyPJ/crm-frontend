import { useRef } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { ChannelIcon } from "@/components/interactions/channel-icon"
import { DateTimePicker } from "@/components/shared/date-time-picker"
import { FormField } from "@/components/shared/form-field"
import { Segmented } from "@/components/shared/segmented"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldTitle } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api/client"
import { createInteraction, type InteractionCreate } from "@/lib/api/interactions"
import { CHANNEL_LABELS, CONTACT_CHANNELS } from "@/lib/labels"
import { daysFromTodayAt, formatDateTime, mxDateTimeToIso } from "@/lib/format"
import { fieldErrors, focusFirstInvalid } from "@/lib/form"
import { notifyError } from "@/lib/notify"

const FOLLOW_UP_PRESETS = [
  { value: "none", label: "Sin cambio" },
  { value: "tomorrow", label: "Mañana 10:00" },
  { value: "3days", label: "En 3 días" },
  { value: "1week", label: "En 1 semana" },
  { value: "custom", label: "Elegir fecha" },
] as const

type FollowUpPreset = (typeof FOLLOW_UP_PRESETS)[number]["value"]

const PRESET_DAYS: Record<Exclude<FollowUpPreset, "none" | "custom">, number> = {
  tomorrow: 1,
  "3days": 3,
  "1week": 7,
}

const channelOptions = CONTACT_CHANNELS.map((channel) => ({
  value: channel,
  label: CHANNEL_LABELS[channel],
  icon: <ChannelIcon channel={channel} />,
}))

const interactionSchema = z
  .object({
    contact_channel: z.enum(CONTACT_CHANNELS),
    what_happened: z.string(),
    follow_up_preset: z.enum(["none", "tomorrow", "3days", "1week", "custom"]),
    follow_up_custom: z.string(),
  })
  .refine((value) => value.follow_up_preset !== "custom" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value.follow_up_custom), {
    message: "Elige la fecha del próximo seguimiento.",
    path: ["follow_up_custom"],
  })

type InteractionValues = z.input<typeof interactionSchema>

const defaultValues: InteractionValues = {
  contact_channel: "whatsapp",
  what_happened: "",
  follow_up_preset: "none",
  follow_up_custom: "",
}

function nextFollowUp(value: InteractionValues): string | undefined {
  if (value.follow_up_preset === "none") return undefined
  if (value.follow_up_preset === "custom") {
    const [date, time] = value.follow_up_custom.split("T")
    return date && time ? mxDateTimeToIso(date, time) : undefined
  }
  return daysFromTodayAt(PRESET_DAYS[value.follow_up_preset], "10:00")
}

interface InteractionFormProps {
  leadId: string
  onSuccess?: () => void
  autoFocus?: boolean
}

export function InteractionForm({ leadId, onSuccess, autoFocus }: InteractionFormProps) {
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement>(null)

  const mutation = useMutation({
    mutationFn: (data: InteractionCreate) => createInteraction(leadId, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["lead", leadId] }),
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
        queryClient.invalidateQueries({ queryKey: ["interactions"] }),
      ])
    },
  })

  const form = useForm({
    defaultValues,
    validators: { onChange: interactionSchema, onSubmit: interactionSchema },
    onSubmitInvalid: () => focusFirstInvalid(formRef.current),
    onSubmit: async ({ value, formApi }) => {
      const whatHappened = value.what_happened.trim()
      const followUp = nextFollowUp(value)
      const payload: InteractionCreate = {
        contact_channel: value.contact_channel,
        what_happened: whatHappened || null,
        ...(followUp ? { next_follow_up_at: followUp } : {}),
      }
      try {
        await mutation.mutateAsync(payload)
        toast.success("Contacto registrado")
        formApi.reset()
        onSuccess?.()
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          toast.error("Este lead ya no existe.")
          return
        }
        notifyError(error)
      }
    },
  })

  return (
    <form
      ref={formRef}
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field name="contact_channel">
        {(field) => (
          <Field>
            <FieldTitle>Canal</FieldTitle>
            <Segmented
              label="Canal"
              value={field.state.value}
              onChange={field.handleChange}
              options={channelOptions}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="what_happened">
        {(field) => (
          <FormField field={field} label="¿Qué pasó?">
            <Textarea
              id={field.name}
              name={field.name}
              rows={3}
              autoFocus={autoFocus}
              placeholder="Por ejemplo: pidió la cotización por correo"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          </FormField>
        )}
      </form.Field>

      <form.Field name="follow_up_preset">
        {(presetField) => (
          <Field>
            <FieldTitle>Próximo seguimiento</FieldTitle>
            <Segmented
              label="Próximo seguimiento"
              value={presetField.state.value}
              onChange={presetField.handleChange}
              options={FOLLOW_UP_PRESETS}
            />
            {presetField.state.value === "custom" ? (
              <form.Field name="follow_up_custom">
                {(field) => {
                  const errors = fieldErrors(field)
                  return (
                    <>
                      <DateTimePicker
                        id={field.name}
                        value={field.state.value}
                        invalid={errors.length > 0}
                        onChange={field.handleChange}
                      />
                      <FieldError errors={errors} />
                    </>
                  )
                }}
              </form.Field>
            ) : (
              <form.Subscribe selector={(state) => state.values}>
                {(values) => {
                  const followUp = nextFollowUp(values)
                  return (
                    <p className="text-xs text-pizarra">
                      {followUp ? `Quedará para el ${formatDateTime(followUp)}.` : "Se conserva el seguimiento actual."}
                    </p>
                  )
                }}
              </form.Subscribe>
            )}
          </Field>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" className="w-full sm:w-auto sm:self-start" disabled={isSubmitting}>
            {isSubmitting ? "Registrando…" : "Registrar contacto"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
