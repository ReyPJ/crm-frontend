import "@fontsource/atkinson-hyperlegible-next/400.css"
import "@fontsource/atkinson-hyperlegible-next/600.css"
import "@fontsource/atkinson-hyperlegible-next/700.css"
import "./index.css"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { NotFound } from "@/components/shared/not-found"
import { RouteError } from "@/components/shared/route-error"
import { ApiError } from "@/lib/api/client"
import { setSessionEndHandler } from "@/lib/auth"
import { routeTree } from "./routeTree.gen"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
        return failureCount < 2
      },
    },
  },
})

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: () => <NotFound />,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

setSessionEndHandler(({ keepLocation }) => {
  const location = router.state.location
  if (location.pathname === "/login") {
    queryClient.clear()
    return
  }
  void router
    .navigate({ to: "/login", search: keepLocation ? { redirect: location.href } : {}, replace: true })
    .then(() => queryClient.clear())
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
