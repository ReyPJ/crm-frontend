import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import { AppShell } from "@/components/layout/app-shell"
import { meQueryOptions } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { clearToken, hasValidToken } from "@/lib/auth"

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context, location }) => {
    if (!hasValidToken()) {
      clearToken()
      throw redirect({ to: "/login", search: { redirect: location.href } })
    }
    try {
      const me = await context.queryClient.ensureQueryData(meQueryOptions)
      return { me }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw redirect({ to: "/login", search: { redirect: location.href } })
      }
      throw error
    }
  },
  component: AppLayout,
})

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
