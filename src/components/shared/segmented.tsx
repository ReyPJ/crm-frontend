import type { ReactNode } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface SegmentedProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: readonly SegmentedOption<T>[]
  label: string
  joined?: boolean
  id?: string
  className?: string
}

export function Segmented<T extends string>({ value, onChange, options, label, joined, id, className }: SegmentedProps<T>) {
  return (
    <ToggleGroup
      id={id}
      type="single"
      variant="outline"
      spacing={joined ? 0 : 2}
      value={value}
      aria-label={label}
      onValueChange={(next) => {
        if (next) onChange(next as T)
      }}
      className={cn(!joined && "flex-wrap", className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="border-input bg-card text-tinta data-[state=on]:border-menta/40 data-[state=on]:bg-menta-tenue data-[state=on]:text-menta [&_svg]:text-pizarra data-[state=on]:[&_svg]:text-menta"
        >
          {option.icon}
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
