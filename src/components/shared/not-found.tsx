import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"

interface NotFoundProps {
  title?: string
  description?: string
  to?: "/" | "/leads"
  linkLabel?: string
}

export function NotFound({
  title = "No encontramos esta página",
  description = "La dirección no existe o cambió.",
  to = "/",
  linkLabel = "Volver a Hoy",
}: NotFoundProps) {
  return (
    <div className="flex max-w-md flex-col items-start gap-3 py-16">
      <h1 className="text-xl font-bold text-tinta">{title}</h1>
      <p className="text-pizarra">{description}</p>
      <Button asChild>
        <Link to={to}>{linkLabel}</Link>
      </Button>
    </div>
  )
}
