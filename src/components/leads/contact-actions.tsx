import { MessageCircleIcon, PhoneIcon } from "lucide-react"
import { IconAction } from "@/components/shared/icon-action"
import { Button } from "@/components/ui/button"
import type { Lead } from "@/lib/api/types"
import { telUrl, whatsappUrl } from "@/lib/format"
import { cn } from "@/lib/utils"

type LeadPhones = Pick<Lead, "phone_number" | "whatsapp_number">

function leadWhatsappUrl(lead: LeadPhones): string | null {
  return whatsappUrl(lead.whatsapp_number || lead.phone_number)
}

function leadTelUrl(lead: LeadPhones): string | null {
  return telUrl(lead.phone_number || lead.whatsapp_number)
}

export function ContactIconActions({ lead }: { lead: LeadPhones }) {
  const whatsapp = leadWhatsappUrl(lead)
  const tel = leadTelUrl(lead)
  return (
    <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
      {whatsapp && <IconAction label="Abrir WhatsApp" href={whatsapp} icon={<MessageCircleIcon className="text-pizarra" />} />}
      {tel && <IconAction label="Llamar" href={tel} icon={<PhoneIcon className="text-pizarra" />} />}
    </div>
  )
}

export function ContactButtons({ lead, className }: { lead: LeadPhones; className?: string }) {
  const whatsapp = leadWhatsappUrl(lead)
  const tel = leadTelUrl(lead)
  return (
    <>
      {whatsapp && (
        <Button asChild variant="outline" className={cn("bg-card", className)}>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
            <MessageCircleIcon className="text-pizarra" />
            WhatsApp
          </a>
        </Button>
      )}
      {tel && (
        <Button asChild variant="outline" className={cn("bg-card", className)}>
          <a href={tel}>
            <PhoneIcon className="text-pizarra" />
            Llamar
          </a>
        </Button>
      )}
    </>
  )
}
