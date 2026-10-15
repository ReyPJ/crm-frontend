import type { AnyFieldApi } from "@tanstack/react-form"

export function fieldErrors(field: AnyFieldApi, serverError?: string): { message?: string }[] {
  const visible = field.state.meta.isTouched || field.form.state.submissionAttempts > 0
  const errors = visible ? (field.state.meta.errors as ({ message?: string } | string | undefined)[]) : []
  const normalized = errors
    .filter((error) => error !== undefined)
    .map((error) => (typeof error === "string" ? { message: error } : error))
  return serverError ? [...normalized, { message: serverError }] : normalized
}

export function focusFirstInvalid(form: HTMLFormElement | null) {
  requestAnimationFrame(() => {
    const target = form?.querySelector<HTMLElement>('[aria-invalid="true"]')
    target?.focus()
    target?.scrollIntoView({ block: "center" })
  })
}
