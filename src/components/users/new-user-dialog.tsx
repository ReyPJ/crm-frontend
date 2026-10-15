import { useRef, useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { z } from "zod"
import { FormField } from "@/components/shared/form-field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApiError, bodyFieldErrors } from "@/lib/api/client"
import type { Role } from "@/lib/api/types"
import { createUser, type UserCreate } from "@/lib/api/users"
import { ROLE_LABELS, ROLES } from "@/lib/labels"
import { fieldErrors, focusFirstInvalid } from "@/lib/form"
import { notifyError } from "@/lib/notify"

const userSchema = z
  .object({
    username: z.string().trim().min(1, "Escribe el usuario.").max(255, "Escribe máximo 255 caracteres."),
    name: z.string().trim().min(1, "Escribe el nombre.").max(255, "Escribe máximo 255 caracteres."),
    second_name: z.string().refine((value) => value.trim().length <= 255, "Escribe máximo 255 caracteres."),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    password_confirmation: z.string(),
    role: z.enum(ROLES),
  })
  .refine((value) => value.password === value.password_confirmation, {
    message: "Las contraseñas no coinciden.",
    path: ["password_confirmation"],
  })

type UserValues = z.input<typeof userSchema>

const defaultValues: UserValues = {
  username: "",
  name: "",
  second_name: "",
  password: "",
  password_confirmation: "",
  role: "user",
}

export function NewUserDialog() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nuevo usuario</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>Comparte el usuario y la contraseña con la persona por un medio seguro.</DialogDescription>
        </DialogHeader>
        <NewUserForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

function NewUserForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement>(null)
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: (data: UserCreate) => createUser(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  })

  const form = useForm({
    defaultValues,
    validators: { onChange: userSchema, onSubmit: userSchema },
    onSubmitInvalid: () => focusFirstInvalid(formRef.current),
    onSubmit: async ({ value }) => {
      setServerErrors({})
      try {
        await mutation.mutateAsync({
          username: value.username.trim(),
          name: value.name.trim(),
          second_name: value.second_name.trim() || null,
          password: value.password,
          role: value.role,
        })
        toast.success("Usuario creado")
        onDone()
      } catch (error) {
        if (error instanceof ApiError && error.status === 409 && error.detail === "Username already exists") {
          setServerErrors({ username: "Ese usuario ya existe. Elige otro." })
          focusFirstInvalid(formRef.current)
          return
        }
        const fields = bodyFieldErrors(error)
        if (Object.keys(fields).length > 0) {
          setServerErrors(fields)
          focusFirstInvalid(formRef.current)
          return
        }
        notifyError(error)
      }
    },
  })

  const textField = (
    name: "username" | "name" | "second_name" | "password" | "password_confirmation",
    label: string,
    props: Partial<React.ComponentProps<typeof Input>> = {},
  ) => (
    <form.Field name={name}>
      {(field) => (
        <FormField field={field} label={label} serverError={serverErrors[name]}>
          <Input
            id={field.name}
            name={field.name}
            value={field.state.value}
            aria-invalid={fieldErrors(field, serverErrors[name]).length > 0 || undefined}
            onBlur={field.handleBlur}
            onChange={(event) => {
              field.handleChange(event.target.value)
              if (serverErrors[name]) setServerErrors({})
            }}
            {...props}
          />
        </FormField>
      )}
    </form.Field>
  )

  return (
    <form
      ref={formRef}
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      {textField("username", "Usuario", { autoComplete: "off", autoCapitalize: "none", spellCheck: false })}
      <div className="grid gap-4 sm:grid-cols-2">
        {textField("name", "Nombre", { autoComplete: "off" })}
        {textField("second_name", "Segundo nombre", { autoComplete: "off" })}
      </div>
      {textField("password", "Contraseña", { type: "password", autoComplete: "new-password" })}
      {textField("password_confirmation", "Confirmar contraseña", { type: "password", autoComplete: "new-password" })}
      <form.Field name="role">
        {(field) => (
          <FormField field={field} label="Rol">
            <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as Role)}>
              <SelectTrigger id={field.name} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      </form.Field>
      <DialogFooter className="mt-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando…" : "Crear usuario"}
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </form>
  )
}
