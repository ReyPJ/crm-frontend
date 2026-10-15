import { useEffect, useRef, useState, type ComponentProps } from "react"
import { Input } from "@/components/ui/input"

interface DebouncedInputProps extends Omit<ComponentProps<typeof Input>, "value" | "onChange"> {
  value: string
  onCommit: (value: string) => void
  delay?: number
}

export function DebouncedInput({ value, onCommit, delay = 300, ...props }: DebouncedInputProps) {
  const [draft, setDraft] = useState(value)
  const committed = useRef(value)
  const commit = useRef(onCommit)

  useEffect(() => {
    commit.current = onCommit
  }, [onCommit])

  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value
      setDraft(value)
    }
  }, [value])

  useEffect(() => {
    if (draft === committed.current) return
    const timeout = window.setTimeout(() => {
      committed.current = draft
      commit.current(draft)
    }, delay)
    return () => window.clearTimeout(timeout)
  }, [draft, delay])

  return <Input value={draft} onChange={(event) => setDraft(event.target.value)} {...props} />
}
