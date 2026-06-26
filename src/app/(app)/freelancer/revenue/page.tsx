"use client"

import { useMemo, useSyncExternalStore } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/ui/page-header"
import { DollarSign, FileText, TrendingDown, TrendingUp, WalletCards } from "lucide-react"
import {
  getProjectsServerSnapshot,
  getProjectsSnapshot,
  subscribeProjectsStore,
  type PaymentEntry,
  type ProjectEntry,
  type WorkspaceTab,
} from "@/lib/projects/store"
import {
  getProposalAddonOptions,
  getProposalDisplayTotal,
  getProposalsServerSnapshot,
  getProposalsSnapshot,
  subscribeProposalsStore,
  type ProposalEntry,
} from "@/lib/proposals/store"

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

interface FlatPayment extends PaymentEntry {
  projectName: string
  clientName?: string
  workspace: WorkspaceTab
}

interface ApprovedProposalFinanceEntry {
  id: string
  clientName: string
  projectName?: string
  date: string
  amount: number
  isPartnership: boolean
  notes: string | null
}

function flattenPayments(allProjects: Record<WorkspaceTab, ProjectEntry[]>): FlatPayment[] {
  const flat: FlatPayment[] = []
  const workspaces: WorkspaceTab[] = ["professional", "personal", "freelancer"]

  for (const workspace of workspaces) {
    for (const project of allProjects[workspace] ?? []) {
      for (const payment of project.payments ?? []) {
        flat.push({
          ...payment,
          projectName: project.name,
          clientName: project.clientName,
          workspace,
        })
      }
    }
  }

  return flat.sort((a, b) => b.date.localeCompare(a.date))
}

function flattenApprovedProposals(
  proposals: ProposalEntry[],
  allProjects: Record<WorkspaceTab, ProjectEntry[]>
): ApprovedProposalFinanceEntry[] {
  const projectById = new Map<string, ProjectEntry>()
  const workspaces: WorkspaceTab[] = ["professional", "personal", "freelancer"]

  for (const workspace of workspaces) {
    for (const project of allProjects[workspace] ?? []) {
      projectById.set(project.id, project)
    }
  }

  return proposals
    .filter((proposal) => proposal.status === "approved")
    .map((proposal) => ({
      id: proposal.id,
      clientName: proposal.clientName,
      projectName: proposal.projectId ? projectById.get(proposal.projectId)?.name : undefined,
      date: proposal.proposalDate || proposal.updated_at,
      amount: getProposalDisplayTotal(
        proposal.isPartnership,
        proposal.totalValue,
        proposal.included,
        getProposalAddonOptions(proposal)
      ),
      isPartnership: proposal.isPartnership,
      notes: proposal.notes,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

function renderApprovedAmount(entry: ApprovedProposalFinanceEntry) {
  if (!entry.isPartnership) return formatBRL(entry.amount)
  if (entry.amount > 0) return `Parceria + ${formatBRL(entry.amount)}`
  return "Gratuito · Parceria"
}

export default function RevenuePage() {
  const allProjects = useSyncExternalStore(
    subscribeProjectsStore,
    getProjectsSnapshot,
    getProjectsServerSnapshot
  )
  const proposals = useSyncExternalStore(
    subscribeProposalsStore,
    getProposalsSnapshot,
    getProposalsServerSnapshot
  )

  const payments = useMemo(() => flattenPayments(allProjects), [allProjects])
  const approvedProposals = useMemo(
    () => flattenApprovedProposals(proposals, allProjects),
    [allProjects, proposals]
  )

  const totalIncome = payments
    .filter((payment) => payment.type === "income")
    .reduce((sum, payment) => sum + payment.amount, 0)
  const totalExpense = payments
    .filter((payment) => payment.type === "expense")
    .reduce((sum, payment) => sum + payment.amount, 0)
  const balance = totalIncome - totalExpense
  const approvedValue = approvedProposals.reduce((sum, proposal) => sum + proposal.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Financeiro"
        description="Receitas, despesas e propostas aprovadas"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receitas
            </CardTitle>
            <TrendingUp className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {totalIncome > 0 ? formatBRL(totalIncome) : "—"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {payments.filter((payment) => payment.type === "income").length} registros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas
            </CardTitle>
            <TrendingDown className="size-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">
              {totalExpense > 0 ? formatBRL(totalExpense) : "—"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {payments.filter((payment) => payment.type === "expense").length} registros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo
            </CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                balance >= 0 ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {payments.length > 0 ? formatBRL(balance) : "—"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">receitas − despesas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Propostas aprovadas
            </CardTitle>
            <WalletCards className="size-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-700">
              {approvedProposals.length > 0 ? formatBRL(approvedValue) : "—"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {approvedProposals.length} propostas com status aprovado
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Propostas aprovadas
        </p>
        <Card>
          <CardContent className="p-0">
            {approvedProposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <FileText className="size-5 text-muted-foreground" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Nenhuma proposta aprovada ainda.
                </p>
              </div>
            ) : (
              <ul>
                {approvedProposals.map((proposal, index) => (
                  <li key={proposal.id}>
                    {index > 0 && <Separator />}
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {proposal.clientName}
                        </span>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(proposal.date)}
                          </span>
                          {proposal.projectName ? (
                            <>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="truncate text-xs text-muted-foreground">
                                {proposal.projectName}
                              </span>
                            </>
                          ) : null}
                          {proposal.notes ? (
                            <>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="truncate text-xs text-muted-foreground">
                                {proposal.notes}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-sky-200 text-xs font-normal text-sky-700"
                        >
                          Aprovada
                        </Badge>
                        <span className="text-sm font-medium tabular-nums text-sky-700">
                          {renderApprovedAmount(proposal)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Histórico de pagamentos
        </p>
        <Card>
          <CardContent className="p-0">
            {payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <DollarSign className="size-5 text-muted-foreground" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Nenhum pagamento registrado ainda.
                  <br />
                  Adicione nos detalhes de cada projeto.
                </p>
              </div>
            ) : (
              <ul>
                {payments.map((payment, index) => (
                  <li key={payment.id}>
                    {index > 0 && <Separator />}
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {payment.projectName}
                        </span>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(payment.date)}
                          </span>
                          {payment.notes ? (
                            <>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="truncate text-xs text-muted-foreground">
                                {payment.notes}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs font-normal ${
                            payment.type === "income"
                              ? "border-emerald-200 text-emerald-600"
                              : "border-rose-200 text-rose-500"
                          }`}
                        >
                          {payment.type === "income" ? "Receita" : "Despesa"}
                        </Badge>
                        <span
                          className={`text-sm font-medium tabular-nums ${
                            payment.type === "income"
                              ? "text-emerald-600"
                              : "text-rose-500"
                          }`}
                        >
                          {payment.type === "expense" ? "−" : "+"}
                          {formatBRL(payment.amount)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
