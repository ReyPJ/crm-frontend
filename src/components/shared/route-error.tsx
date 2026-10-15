import { useQueryErrorResetBoundary } from "@tanstack/react-query"
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { errorMessage } from "@/lib/api/client"

export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  useEffect(() => {
    queryErrorResetBoundary.reset()
  }, [queryErrorResetBoundary])

  return (
    <div role="alert" className="flex max-w-md flex-col items-start gap-3 py-16">
      <h1 className="text-xl font-bold text-tinta">No pudimos cargar esta pantalla</h1>
      <p className="text-pizarra">{errorMessage(error)}</p>
      <Button onClick={() => router.invalidate()}>Reintentar</Button>
    </div>
  )
}

export function InlineError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-linea bg-card px-4 py-3">
      <p className="text-pizarra">{errorMessage(error)}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}
