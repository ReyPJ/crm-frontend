import { RelativeDate } from "@/components/shared/relative-date"
import { followUpState, formatRelativeDate } from "@/lib/format"
import { cn } from "@/lib/utils"

function followUpClassName(value: string): string {
  const state = followUpState(value)
  if (state === "overdue") return "font-semibold text-vencido"
  if (state === "today") return "font-semibold text-hoy"
  return ""
}

export function FollowUpDate({ value, plain, className }: { value: string | null; plain?: boolean; className?: string }) {
  if (!value) return <span className={cn("text-pizarra", className)}>Sin seguimiento</span>
  if (plain) {
    return <span className={cn("tabular-nums", followUpClassName(value), className)}>{formatRelativeDate(value)}</span>
  }
  return <RelativeDate value={value} className={cn(followUpClassName(value), className)} />
}
