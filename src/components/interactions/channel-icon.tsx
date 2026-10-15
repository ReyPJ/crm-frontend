import { MailIcon, MessageCircleIcon, PhoneIcon, UsersIcon, EllipsisIcon } from "lucide-react"
import type { ContactChannel } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const ICONS = {
  whatsapp: MessageCircleIcon,
  llamada: PhoneIcon,
  email: MailIcon,
  "en persona": UsersIcon,
  otro: EllipsisIcon,
} satisfies Record<ContactChannel, unknown>

export function ChannelIcon({ channel, className }: { channel: ContactChannel; className?: string }) {
  const Icon = ICONS[channel]
  return <Icon aria-hidden className={cn("size-4 text-pizarra", className)} />
}
