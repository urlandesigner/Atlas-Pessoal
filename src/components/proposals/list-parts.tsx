import { Copy, Eye, FileText, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"

import { PERIOD_LABEL, STATUS_CLASS, type PeriodFilter } from "@/components/proposals/constants"
import { formatDate, money } from "@/components/proposals/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getProposalPlanName,
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
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_12rem_12rem_12rem]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Buscar por cliente ou plano..."
              className="pl-9"
            />
          </div>
          <select
            value={clientFilter}
            onChange={(event) => onClientFilterChange(event.target.value)}
            className={cn(selectClassName, "w-full min-w-0")}
          >
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
            className={cn(selectClassName, "w-full min-w-0")}
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
            className={cn(selectClassName, "w-full min-w-0")}
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

  function proposalTotalLabel(proposal: ProposalEntry) {
    if (!proposal.isPartnership) return money(proposal.totalValue)
    if (proposal.totalValue > 0) return `Parceria + ${money(proposal.totalValue)}`
    return "Gratuito · Parceria"
  }

  return (
    <Card className="min-w-0 overflow-hidden py-0">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Cliente</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden lg:table-cell">Valor</TableHead>
            <TableHead className="hidden lg:table-cell">Prazo</TableHead>
            <TableHead className="hidden text-right md:table-cell">Validade</TableHead>
            <TableHead className="w-px" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {proposals.map((proposal) => (
            <TableRow
              key={proposal.id}
              className="group cursor-pointer"
              onClick={() => onView(proposal)}
            >
              <TableCell className="whitespace-normal">
                <div className="min-w-0">
                  <span className="block truncate font-medium underline-offset-2 group-hover:underline">
                    {proposal.clientName}
                  </span>
                  <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {getProposalPlanName(proposal) || "Plano não definido"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge
                  variant="outline"
                  className={cn("h-6 px-2.5 text-xs font-normal", STATUS_CLASS[proposal.status])}
                >
                  {PROPOSAL_STATUS_LABEL[proposal.status]}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <span className="text-xs text-muted-foreground">
                  {proposalTotalLabel(proposal)}
                </span>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <span className="text-xs text-muted-foreground">
                  {proposal.estimatedDeadline || "A definir"}
                </span>
              </TableCell>
              <TableCell className="hidden text-right text-xs text-muted-foreground md:table-cell">
                {formatDate(proposal.validUntil)}
              </TableCell>
              <TableCell
                className="w-px text-right"
                onClick={(event) => event.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 opacity-0 group-hover:opacity-100 data-[popup-open]:opacity-100"
                      />
                    }
                  >
                    <MoreHorizontal className="size-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => onView(proposal)}>
                      <Eye className="size-3.5" />
                      Ver proposta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(proposal)}>
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(proposal)}>
                      <Copy className="size-3.5" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(proposal)}
                    >
                      <Trash2 className="size-3.5" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
