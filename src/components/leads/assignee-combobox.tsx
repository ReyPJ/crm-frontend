import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronsUpDownIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { updateLead } from "@/lib/api/leads"
import type { Lead } from "@/lib/api/types"
import { usersQueryOptions } from "@/lib/api/users"
import { fullName } from "@/lib/format"
import { notifyError } from "@/lib/notify"

export function AssigneeCombobox({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const users = useQuery(usersQueryOptions)
  const options = (users.data ?? []).filter((user) => user.is_active || user.id === lead.assigned_to_id)

  const mutation = useMutation({
    mutationFn: (assignedToId: string | null) => updateLead(lead.id, { assigned_to_id: assignedToId }),
    onSuccess: async (saved) => {
      queryClient.setQueryData(["lead", saved.id], saved)
      toast.success(saved.assigned_to ? `Lead asignado a ${saved.assigned_to.name}` : "Lead sin asignar")
      await queryClient.invalidateQueries({ queryKey: ["leads"] })
    },
    onError: notifyError,
  })

  const select = (assignedToId: string | null) => {
    setOpen(false)
    if (assignedToId !== lead.assigned_to_id) mutation.mutate(assignedToId)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" role="combobox" aria-expanded={open} disabled={mutation.isPending} className="-ml-2 font-normal text-pizarra">
          {lead.assigned_to ? `Asignado a ${lead.assigned_to.name}` : "Sin asignar"}
          <ChevronsUpDownIcon className="text-pizarra" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar usuario" />
          <CommandList>
            <CommandEmpty>No hay usuarios con ese nombre.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="Sin asignar" data-checked={!lead.assigned_to_id} onSelect={() => select(null)}>
                Sin asignar
              </CommandItem>
              {options.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${fullName(user)} ${user.username}`}
                  data-checked={lead.assigned_to_id === user.id}
                  onSelect={() => select(user.id)}
                >
                  {fullName(user)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
