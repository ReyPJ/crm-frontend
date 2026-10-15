import { LeadForm } from "@/components/leads/lead-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Lead } from "@/lib/api/types"

interface LeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: Lead
}

export function LeadDialog({ open, onOpenChange, lead }: LeadDialogProps) {
  const close = () => onOpenChange(false)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-[min(72rem,calc(100%-2rem))]">
        <DialogHeader className="border-b border-linea px-5 py-4 pr-12 sm:px-6">
          <DialogTitle>{lead ? "Editar lead" : "Nuevo lead"}</DialogTitle>
          <DialogDescription>
            {lead ? lead.business_name : "Solo el nombre, el giro y la fuente son obligatorios."}
          </DialogDescription>
        </DialogHeader>
        <LeadForm lead={lead} onSaved={close} onCancel={close} />
      </DialogContent>
    </Dialog>
  )
}
