import type { ProposalStatus } from "@/lib/proposals/store"

export type PeriodFilter = "all" | "month" | "quarter" | "year"

export const STATUS_CLASS: Record<ProposalStatus, string> = {
  draft: "border-muted-foreground/20 bg-muted text-muted-foreground",
  sent: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  viewed: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  approved: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  rejected: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  expired: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
}

export const PERIOD_LABEL: Record<PeriodFilter, string> = {
  all: "Todo período",
  month: "Este mês",
  quarter: "Últimos 90 dias",
  year: "Este ano",
}
