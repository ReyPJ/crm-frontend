import { useState } from "react"
import { es } from "react-day-picker/locale"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { dateStringToLocalDate, formatShortDate, localDateToDateString, mxDateTimeToIso, todayMx } from "@/lib/format"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disablePast?: boolean
  invalid?: boolean
  className?: string
}

export function DatePicker({ id, value, onChange, placeholder = "Elegir fecha", disablePast, invalid, className }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = value ? dateStringToLocalDate(value) : undefined
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-invalid={invalid || undefined}
          className={cn("min-w-0 justify-start bg-card font-normal tabular-nums", !value && "text-muted-foreground", className)}
        >
          <CalendarIcon className="text-pizarra" />
          {value ? formatShortDate(mxDateTimeToIso(value, "12:00")) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={es}
          weekStartsOn={1}
          selected={selected}
          defaultMonth={selected}
          disabled={disablePast ? { before: dateStringToLocalDate(todayMx()) } : undefined}
          onSelect={(date) => {
            if (!date) return
            onChange(localDateToDateString(date))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
