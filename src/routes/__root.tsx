import type { QueryClient } from "@tanstack/react-query"
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router"
import { NotFound } from "@/components/shared/not-found"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => (
    <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8">
      <NotFound />
    </div>
  ),
})

function RootLayout() {
  return (
    <TooltipProvider delayDuration={300}>
      <Outlet />
      <Toaster position="bottom-right" mobileOffset={{ bottom: 88 }} />
    </TooltipProvider>
  )
}
