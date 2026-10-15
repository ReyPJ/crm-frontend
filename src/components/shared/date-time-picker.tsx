import { DatePicker } from "@/components/shared/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const TIMES = Array.from({ length: (22 - 7) * 4 }, (_, index) => {
  const minutes = 7 * 60 + index * 15
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
})

interface DateTimePickerProps {
  id?: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
}

export function DateTimePicker({ id, value, onChange, invalid }: DateTimePickerProps) {
  const [date = "", time = ""] = value ? value.split("T") : []
  const times = time && !TIMES.includes(time) ? [...TIMES, time].sort() : TIMES
  return (
    <div className="flex gap-2">
      <DatePicker
        id={id}
        value={date}
        disablePast
        invalid={invalid}
        className="min-w-0 flex-1"
        onChange={(nextDate) => onChange(`${nextDate}T${time || "10:00"}`)}
      />
      <Select value={time} disabled={!date} onValueChange={(nextTime) => onChange(`${date}T${nextTime}`)}>
        <SelectTrigger aria-label="Hora" aria-invalid={invalid || undefined} className="w-24 shrink-0 tabular-nums">
          <SelectValue placeholder="Hora" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {times.map((option) => (
            <SelectItem key={option} value={option} className="tabular-nums">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
