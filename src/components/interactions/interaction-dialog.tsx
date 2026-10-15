import { useState, type ReactNode } from "react"
import { InteractionForm } from "@/components/interactions/interaction-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface InteractionDialogProps {
  leadId: string
  businessName: string
  children: ReactNode
}

export function InteractionDialog({ leadId, businessName, children }: InteractionDialogProps) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar contacto</DialogTitle>
          <DialogDescription>{businessName}</DialogDescription>
        </DialogHeader>
        <InteractionForm leadId={leadId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
