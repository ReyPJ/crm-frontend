import { useRef, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { z } from "zod"
import { FormField } from "@/components/shared/form-field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { login, meQueryOptions } from "@/lib/api/auth"
import { ApiError, errorMessage } from "@/lib/api/client"
import { clearToken, hasValidToken, setToken } from "@/lib/auth"
import { fieldErrors, focusFirstInvalid } from "@/lib/form"

function safeRedirect(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) return "/"
  return value
}

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    redirect: z.string().optional().catch(undefined),
  }),
  beforeLoad: ({ search }) => {
    if (hasValidToken()) {
      throw redirect({ href: safeRedirect(search.redirect) })
    }
  },
  component: LoginPage,
})

const loginSchema = z.object({
  username: z.string().trim().min(1, "Escribe tu usuario."),
  password: z.string().min(1, "Escribe tu contraseña."),
})

function LoginPage() {
  const search = Route.useSearch()
  const router = useRouter()
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { username: "", password: "" },
    validators: { onSubmit: loginSchema },
    onSubmitInvalid: () => focusFirstInvalid(formRef.current),
    onSubmit: async ({ value }) => {
      setFormError(null)
      try {
        const token = await login(value.username, value.password)
        setToken(token.access_token)
        queryClient.clear()
        await queryClient.fetchQuery(meQueryOptions)
        await router.navigate({ href: safeRedirect(search.redirect), replace: true })
      } catch (error) {
        clearToken()
        setFormError(
          error instanceof ApiError && error.status === 401 ? "Usuario o contraseña incorrectos" : errorMessage(error),
        )
      }
    },
  })

  return (
    <main className="flex min-h-dvh items-center justify-center bg-porcelana px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-linea bg-card p-6 sm:p-8">
        <h1 className="text-xl font-bold text-tinta">RPJ CRM</h1>
        <p className="mt-1 text-pizarra">Entra con tu usuario para ver tus seguimientos.</p>
        <form
          ref={formRef}
          noValidate
          className="mt-6 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          {formError && (
            <Alert variant="destructive" role="alert">
              <AlertDescription className="text-vencido">{formError}</AlertDescription>
            </Alert>
          )}
          <form.Field name="username">
            {(field) => (
              <FormField field={field} label="Usuario">
                <Input
                  id={field.name}
                  name={field.name}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  value={field.state.value}
                  aria-invalid={fieldErrors(field).length > 0 || undefined}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </FormField>
            )}
          </form.Field>
          <form.Field name="password">
            {(field) => (
              <FormField field={field} label="Contraseña">
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  autoComplete="current-password"
                  value={field.state.value}
                  aria-invalid={fieldErrors(field).length > 0 || undefined}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </FormField>
            )}
          </form.Field>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" size="lg" className="mt-2 w-full" disabled={isSubmitting}>
                {isSubmitting ? "Entrando…" : "Entrar"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </main>
  )
}
