import type {
  ClientStatus,
  MaintenancePlan,
  OpportunityStatus,
  RequestCategory,
  RequestStatus,
} from "@/lib/clients/store"

export type SortMode = "recent" | "name" | "delivery" | "plan"

export const planOptions: MaintenancePlan[] = ["none", "essential", "professional", "growth"]
export const statusOptions: ClientStatus[] = ["active", "onboarding", "paused", "inactive"]
export const requestCategories: RequestCategory[] = ["fix", "content", "visual", "feature", "question"]
export const requestStatuses: RequestStatus[] = ["open", "in_progress", "done", "canceled"]
export const opportunityStatuses: OpportunityStatus[] = ["identified", "presented", "negotiation", "won", "lost"]

export const planClass: Record<MaintenancePlan, string> = {
  none: "border-muted-foreground/20 bg-muted text-muted-foreground",
  essential: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  professional: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  growth: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
}
