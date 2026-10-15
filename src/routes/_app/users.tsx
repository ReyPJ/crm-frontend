import { useState } from "react"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { NewUserDialog } from "@/components/users/new-user-dialog"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMe } from "@/lib/api/auth"
import type { Role, User } from "@/lib/api/types"
import { updateUser, usersQueryOptions, type UserUpdate } from "@/lib/api/users"
import { fullName } from "@/lib/format"
import { ROLE_LABELS, ROLES } from "@/lib/labels"
import { notifyError } from "@/lib/notify"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_app/users")({
  beforeLoad: ({ context }) => {
    if (context.me.role !== "admin") throw redirect({ to: "/" })
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(usersQueryOptions),
  component: UsersPage,
})

const features = tableFeatures({})
const helper = createColumnHelper<typeof features, User>()

function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdate }) => updateUser(id, data),
    onSuccess: (saved) => {
      queryClient.setQueryData<User[]>(["users"], (users) => users?.map((user) => (user.id === saved.id ? saved : user)))
      void queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: notifyError,
  })
}

function RoleSelect({ user, isSelf }: { user: User; isSelf: boolean }) {
  const mutation = useUpdateUser()
  return (
    <Select
      value={user.role}
      disabled={isSelf || mutation.isPending}
      onValueChange={(role) =>
        mutation.mutate({ id: user.id, data: { role: role as Role } }, { onSuccess: () => toast.success("Rol actualizado") })
      }
    >
      <SelectTrigger aria-label={`Rol de ${fullName(user)}`} className="w-40">
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
  )
}

function ActiveSwitch({ user, isSelf }: { user: User; isSelf: boolean }) {
  const mutation = useUpdateUser()
  const [confirming, setConfirming] = useState(false)
  const name = fullName(user)
  const activate = !user.is_active

  return (
    <div className="flex items-center gap-2.5">
      <Switch
        id={`active-${user.id}`}
        checked={user.is_active}
        disabled={isSelf || mutation.isPending}
        aria-label={`${name} activo`}
        onCheckedChange={() => setConfirming(true)}
      />
      <label htmlFor={`active-${user.id}`} className={cn(user.is_active ? "text-tinta" : "text-pizarra")}>
        {user.is_active ? "Activo" : "Inactivo"}
      </label>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{activate ? `¿Activar a ${name}?` : `¿Desactivar a ${name}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {activate
                ? "Podrá volver a entrar al CRM con su usuario y contraseña."
                : "Ya no podrá entrar al CRM. Sus leads e historial se conservan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={cn(!activate && "bg-vencido text-white hover:bg-vencido/90")}
              onClick={() =>
                mutation.mutate(
                  { id: user.id, data: { is_active: activate } },
                  { onSuccess: () => toast.success(activate ? "Usuario activado" : "Usuario desactivado") },
                )
              }
            >
              {activate ? "Activar" : "Desactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function UsersPage() {
  const me = useMe()
  const { data: users } = useSuspenseQuery(usersQueryOptions)

  const columns = helper.columns([
    helper.accessor((user) => fullName(user), {
      id: "name",
      header: "Nombre",
      cell: ({ row, getValue }) => (
        <span className="font-semibold text-tinta">
          {getValue()}
          {row.original.id === me.id && <span className="ml-2 text-xs font-normal text-pizarra">Tú</span>}
        </span>
      ),
    }),
    helper.accessor("username", { header: "Usuario", cell: ({ getValue }) => <span className="text-tinta">{getValue()}</span> }),
    helper.accessor("role", {
      header: "Rol",
      cell: ({ row }) => <RoleSelect user={row.original} isSelf={row.original.id === me.id} />,
    }),
    helper.accessor("is_active", {
      header: "Estado",
      cell: ({ row }) => <ActiveSwitch user={row.original} isSelf={row.original.id === me.id} />,
    }),
  ])

  const table = useTable({ features, columns, data: users, getRowId: (user) => user.id })

  return (
    <div>
      <PageHeader title="Usuarios">
        <NewUserDialog />
      </PageHeader>

      <div className="hidden overflow-hidden rounded-xl border border-linea bg-card md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => (
                  <TableHead key={header.id} className="h-11 px-4 text-xs font-semibold text-pizarra">
                    <table.FlexRender header={header} />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-transparent">
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3">
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-linea rounded-xl border border-linea bg-card md:hidden">
        {users.map((user) => (
          <li key={user.id} className="flex flex-col gap-3 px-4 py-4">
            <div className="flex flex-col">
              <span className="font-semibold text-tinta">
                {fullName(user)}
                {user.id === me.id && <span className="ml-2 text-xs font-normal text-pizarra">Tú</span>}
              </span>
              <span className="text-xs text-pizarra">{user.username}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <RoleSelect user={user} isSelf={user.id === me.id} />
              <ActiveSwitch user={user} isSelf={user.id === me.id} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
