import type { ReactNode } from "react"
import type { AnyFieldApi } from "@tanstack/react-form"
import { fieldErrors } from "@/lib/form"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"

interface FormFieldProps {
  field: AnyFieldApi
  label: ReactNode
  serverError?: string
  hint?: ReactNode
  className?: string
  children: ReactNode
}

export function FormField({ field, label, serverError, hint, className, children }: FormFieldProps) {
  const errors = fieldErrors(field, serverError)
  return (
    <Field data-invalid={errors.length > 0 || undefined} className={className}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      {children}
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError errors={errors} />
    </Field>
  )
}
