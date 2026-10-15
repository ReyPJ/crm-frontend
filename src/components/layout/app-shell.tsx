import { useEffect, type ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import { CalendarClockIcon, HistoryIcon, LogOutIcon, StoreIcon, UsersIcon, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMe } from "@/lib/api/auth"
import { endSession, getToken, getTokenExpiration } from "@/lib/auth"
import { fullName } from "@/lib/format"
import { ROLE_LABELS } from "@/lib/labels"

interface NavItem {
  to: "/" | "/leads" | "/activity" | "/users"
  label: string
  icon: LucideIcon
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Hoy", icon: CalendarClockIcon, exact: true },
  { to: "/leads", label: "Leads", icon: StoreIcon },
  { to: "/activity", label: "Actividad", icon: HistoryIcon },
  { to: "/users", label: "Usuarios", icon: UsersIcon },
]

function useSessionExpiry() {
  useEffect(() => {
    const token = getToken()
    const expiration = token ? getTokenExpiration(token) : null
    if (expiration === null) return
    const timeout = window.setTimeout(
      () => endSession({ keepLocation: true }),
      Math.max(0, Math.min(expiration - Date.now(), 2_147_000_000)),
    )
    return () => window.clearTimeout(timeout)
  }, [])
}

export function AppShell({ children }: { children: ReactNode }) {
  const me = useMe()
  const items = NAV_ITEMS.filter((item) => item.to !== "/users" || me.role === "admin")
  useSessionExpiry()

  return (
    <div className="min-h-dvh bg-porcelana">
      <aside className="fixed inset-y-0 left-0 hidden w-[232px] flex-col border-r border-linea bg-card md:flex">
        <div className="px-6 pt-6 pb-8">
          <Link to="/" className="text-lg font-bold text-tinta">
            RPJ CRM
          </Link>
        </div>
        <nav aria-label="Principal" className="flex flex-1 flex-col gap-1 px-3">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="flex h-10 items-center gap-3 rounded-lg px-3 font-semibold text-tinta hover:bg-porcelana data-[status=active]:bg-menta-tenue data-[status=active]:text-menta [&[data-status=active]_svg]:text-menta"
            >
              <item.icon aria-hidden className="size-[18px] text-pizarra" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-3 border-t border-linea px-6 py-5">
          <div className="flex flex-col">
            <span className="font-semibold text-tinta">{fullName(me)}</span>
            <span className="text-xs text-pizarra">{ROLE_LABELS[me.role]}</span>
          </div>
          <Button variant="ghost" className="-ml-3 justify-start text-pizarra" onClick={() => endSession()}>
            <LogOutIcon aria-hidden />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-linea bg-card px-4 md:hidden">
        <Link to="/" className="text-lg font-bold text-tinta">
          RPJ CRM
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="-mr-2 font-semibold text-tinta">
              {me.name}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-sm text-tinta">{fullName(me)}</span>
              <span className="text-xs font-normal text-pizarra">{ROLE_LABELS[me.role]}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => endSession()}>
              <LogOutIcon aria-hidden />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="pb-24 md:pb-0 md:pl-[232px]">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 md:px-8 md:py-8">{children}</div>
      </main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-linea bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className="flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold text-pizarra data-[status=active]:text-menta [&[data-status=active]_svg]:text-menta"
              >
                <item.icon aria-hidden className="size-[18px]" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
