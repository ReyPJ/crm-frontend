import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDateTime, formatRelativeDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export function RelativeDate({ value, className }: { value: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time dateTime={value} tabIndex={0} className={cn("tabular-nums outline-none", className)}>
          {formatRelativeDate(value)}
        </time>
      </TooltipTrigger>
      <TooltipContent>{formatDateTime(value)}</TooltipContent>
    </Tooltip>
  )
}
