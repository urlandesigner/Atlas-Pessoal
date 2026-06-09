import { Copy, Eye, FileText, Plus, Search, Trash2 } from "lucide-react"

import { PERIOD_LABEL, STATUS_CLASS, type PeriodFilter } from "@/components/proposals/constants"
import { formatDate, money } from "@/components/proposals/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  PROPOSAL_STATUS_LABEL,
  PROPOSAL_STATUS_OPTIONS,
  type ProposalEntry,
  type ProposalStatus,
} from "@/lib/proposals/store"
import { cn } from "@/lib/utils"

const selectClassName =
  "h-10 rounded-md border border-input bg-transparent px-3 text-base outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"

export function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: React.ElementType
}) {
  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-3 px-4 py-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-[1.75rem] font-semibold leading-tight tracking-tight">{value}</p>
          <p className="text-[15px] leading-5 text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 line-clamp-1 text-[17px] font-medium leading-snug">{value}</p>
    </div>
  )
}

export function ProposalFilters({
  query,
  onQueryChange,
  clientFilter,
  onClientFilterChange,
  statusFilter,
  onStatusFilterChange,
  periodFilter,
  onPeriodFilterChange,
  clients,
}: {
  query: string
  onQueryChange: (value: string) => void
  clientFilter: string
  onClientFilterChange: (value: string) => void
  statusFilter: ProposalStatus | "all"
  onStatusFilterChange: (value: ProposalStatus | "all") => void
  periodFilter: PeriodFilter
  onPeriodFilterChange: (value: PeriodFilter) => void
  clients: { id: string; name: string }[]
}) {
  return (
    <Card className="py-0">
      <CardContent className="px-4 py-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_12rem_12rem_12rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Buscar por cliente, objetivo..."
              className="pl-9"
            />
          </div>
          <select value={clientFilter} onChange={(event) => onClientFilterChange(event.target.value)} className={selectClassName}>
            <option value="all">Todos clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as ProposalStatus | "all")}
            className={selectClassName}
          >
            <option value="all">Todos status</option>
            {PROPOSAL_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {PROPOSAL_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
          <select
            value={periodFilter}
            onChange={(event) => onPeriodFilterChange(event.target.value as PeriodFilter)}
            className={selectClassName}
          >
            {Object.entries(PERIOD_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProposalList({
  proposals,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onCreate,
}: {
  proposals: ProposalEntry[]
  onView: (proposal: ProposalEntry) => void
  onEdit: (proposal: ProposalEntry) => void
  onDuplicate: (proposal: ProposalEntry) => void
  onDelete: (proposal: ProposalEntry) => void
  onCreate: () => void
}) {
  if (!proposals.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <FileText className="size-5 text-muted-foreground" />
          </div>
          <p className="text-base text-muted-foreground">
            Nenhuma proposta encontrada. Crie uma proposta ou ajuste os filtros.
          </p>
          <Button size="sm" onClick={onCreate}>
            <Plus data-icon="inline-start" />
            Criar proposta
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {proposals.map((proposal) => (
        <Card key={proposal.id} className="py-0 transition-colors hover:bg-muted/25">
          <CardContent className="grid grid-cols-1 gap-3 px-4 py-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="line-clamp-1 text-lg font-semibold leading-snug">{proposal.clientName}</h2>
                <Badge variant="outline" className={cn("h-6 px-2.5 text-sm font-normal", STATUS_CLASS[proposal.status])}>
                  {PROPOSAL_STATUS_LABEL[proposal.status]}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Info
                  label="Valor total"
                  value={
                    proposal.isPartnership
                      ? proposal.totalValue > 0
                        ? `Gratuito · Parceria + ${money(proposal.totalValue)}`
                        : "Gratuito · Parceria"
                      : money(proposal.totalValue)
                  }
                />
                <Info label="Prazo" value={proposal.estimatedDeadline || "A definir"} />
                <Info label="Validade" value={formatDate(proposal.validUntil)} />
              </div>
            </div>
            <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
              <Button variant="outline" size="sm" onClick={() => onView(proposal)}>
                <Eye data-icon="inline-start" />
                Ver
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(proposal)}>
                Editar
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => onDuplicate(proposal)}>
                <Copy />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => onDelete(proposal)}>
                <Trash2 />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
