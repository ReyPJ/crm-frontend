import { toast } from "sonner"
import { ApiError, errorMessage } from "@/lib/api/client"

export function notifyError(error: unknown): void {
  if (error instanceof ApiError && error.status === 401) return
  toast.error(errorMessage(error))
}
