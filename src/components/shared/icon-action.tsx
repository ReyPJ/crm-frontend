import type { ComponentProps, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface IconActionProps extends Omit<ComponentProps<typeof Button>, "children" | "asChild"> {
  label: string
  icon: ReactNode
  href?: string
}

export function IconAction({ label, icon, href, variant = "ghost", size = "icon", ...props }: IconActionProps) {
  const external = href?.startsWith("http")
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href ? (
          <Button asChild variant={variant} size={size} {...props}>
            <a
              href={href}
              aria-label={label}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
            >
              {icon}
            </a>
          </Button>
        ) : (
          <Button variant={variant} size={size} aria-label={label} {...props}>
            {icon}
          </Button>
        )}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
