"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarClock,
  FilePlus2,
  FileText,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users2,
  WalletCards,
} from "lucide-react"

import { ClientFormSheet } from "@/components/clients/form-sheet"
import { Metric } from "@/components/clients/metric-card"
import { ProfileSheet } from "@/components/clients/profile-sheet"
import { planClass, planOptions, statusOptions, type SortMode } from "@/components/clients/constants"
import { formatDate, getWarrantyLabel, isWarrantyActive, money, normalizeSearch } from "@/components/clients/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  CLIENT_STATUS_LABEL,
  EMPTY_POST_SALE_CLIENT_FORM,
  PLAN_LABEL,
  addClientToCollection,
  createPostSaleClientForm,
  createPostSaleClientFromForm,
  emitClientsChange,
  getClientsServerSnapshot,
  getClientsSnapshot,
  getLastInteraction,
  saveClients,
  subscribeClientsStore,
  updateClientRecord,
  updatePostSaleClientInCollection,
  type ClientEntry,
  type ClientStatus,
  type MaintenancePlan,
  type PostSaleClientForm,
} from "@/lib/clients/store"
import {
  getProposalsServerSnapshot,
  getProposalsSnapshot,
  subscribeProposalsStore,
} from "@/lib/proposals/store"
import { cn } from "@/lib/utils"

export default function ClientsPage() {
  const router = useRouter()
  const clients = useSyncExternalStore(subscribeClientsStore, getClientsSnapshot, getClientsServerSnapshot)
  const proposals = useSyncExternalStore(subscribeProposalsStore, getProposalsSnapshot, getProposalsServerSnapshot)
  const [isAdding, setIsAdding] = useState(false)
  const [editing, setEditing] = useState<ClientEntry | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [planFilter, setPlanFilter] = useState<MaintenancePlan | "all">("all")
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all")
  const [sort, setSort] = useState<SortMode>("recent")

  const viewing = clients.find((client) => client.id === viewingId) ?? null

  // Resolve the proposal linked to each client — explicit proposalId first,
  // then fall back to matching by clientId or shared leadId (covers proposals
  // created before the bidirectional link existed).
  const proposalByClient = useMemo(() => {
    const map = new Map<string, string>()
    for (const client of clients) {
      const match =
        (client.proposalId && proposals.find((p) => p.id === client.proposalId)) ||
        proposals.find((p) => p.clientId === client.id) ||
        (client.leadId && proposals.find((p) => p.leadId === client.leadId))
      if (match) map.set(client.id, match.id)
    }
    return map
  }, [clients, proposals])

  const metrics = useMemo(() => {
    const withPlan = clients.filter((client) => client.plan !== "none")
    const opportunities = clients.flatMap((client) => client.opportunities)
    return {
      active: clients.filter((client) => client.status === "active" || client.status === "onboarding").length,
      withPlan: withPlan.length,
      mrr: withPlan.reduce((sum, client) => sum + client.monthlyValue, 0),
      warranties: clients.filter(isWarrantyActive).length,
      openRequests: clients.flatMap((client) => client.requests).filter((request) => request.status === "open" || request.status === "in_progress").length,
      opportunities: opportunities.filter((item) => item.status !== "won" && item.status !== "lost").length,
    }
  }, [clients])

  const filtered = useMemo(() => {
    const search = normalizeSearch(query)
    return clients
      .filter((client) => {
        if (planFilter !== "all" && client.plan !== planFilter) return false
        if (statusFilter !== "all" && client.status !== statusFilter) return false
        if (!search) return true
        return normalizeSearch([client.name, client.company, client.projectName, client.email].join(" ")).includes(search)
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name, "pt-BR")
        if (sort === "delivery") return (a.projectDeliveryDate || "9999").localeCompare(b.projectDeliveryDate || "9999")
        if (sort === "plan") return PLAN_LABEL[a.plan].localeCompare(PLAN_LABEL[b.plan], "pt-BR")
        return getLastInteraction(b).localeCompare(getLastInteraction(a))
      })
  }, [clients, planFilter, query, sort, statusFilter])

  function persist(next: ClientEntry[]) {
    saveClients(next)
    emitClientsChange()
  }

  function handleCreate(form: PostSaleClientForm) {
    persist(addClientToCollection(clients, createPostSaleClientFromForm(form)))
    setIsAdding(false)
  }

  function handleEdit(form: PostSaleClientForm) {
    if (!editing) return
    persist(updatePostSaleClientInCollection(clients, editing.id, form))
    setEditing(null)
  }

  function handleUpdate(client: ClientEntry) {
    persist(updateClientRecord(clients, client))
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Clientes"
          description="CRM pos-venda para acompanhar entrega, suporte, garantia, recorrencia e novas oportunidades."
          actions={
            <Button size="sm" onClick={() => setIsAdding(true)}>
              <Plus data-icon="inline-start" />Novo cliente
            </Button>
          }
        />

        {/* Stats Bar */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
          <Metric label="Clientes ativos" value={metrics.active} icon={Users2} hint="Em relacionamento" />
          <Metric label="Com plano" value={metrics.withPlan} icon={ShieldCheck} hint="Recorrencia ativa" />
          <Metric label="MRR" value={money(metrics.mrr)} icon={WalletCards} hint="Receita mensal" />
          <Metric label="Garantias" value={metrics.warranties} icon={CalendarClock} hint="Ainda ativas" />
          <Metric label="Solicitacoes" value={metrics.openRequests} icon={Ticket} hint="Abertas ou andamento" />
          <Metric label="Oportunidades" value={metrics.opportunities} icon={Sparkles} hint="Pipeline futuro" />
        </div>

        {/* Filters */}
        <Card className="py-0">
          <CardContent className="px-4 py-3">
            <div className="grid gap-3 lg:grid-cols-[1fr_11rem_11rem_10rem]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente, empresa ou projeto..." className="pl-9" />
              </div>
              <select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={planFilter} onChange={(e) => setPlanFilter(e.target.value as MaintenancePlan | "all")}><option value="all">Todos planos</option>{planOptions.map((plan) => <option key={plan} value={plan}>{PLAN_LABEL[plan]}</option>)}</select>
              <select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ClientStatus | "all")}><option value="all">Todos status</option>{statusOptions.map((status) => <option key={status} value={status}>{CLIENT_STATUS_LABEL[status]}</option>)}</select>
              <select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}><option value="recent">Mais recentes</option><option value="name">Nome</option><option value="delivery">Entrega</option><option value="plan">Plano</option></select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/15 px-6 py-14 text-center">
            <Users2 className="mx-auto size-9 text-muted-foreground" />
            <h2 className="mt-4 font-semibold">Nenhum cliente encontrado</h2>
            <p className="mt-1 text-sm text-muted-foreground">Aprovacoes de propostas tambem criam clientes automaticamente.</p>
          </div>
        ) : (
          <Card className="overflow-hidden py-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                    <TableHead className="hidden lg:table-cell">Empresa</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead className="hidden lg:table-cell">Proposta</TableHead>
                    <TableHead className="hidden md:table-cell">Plano</TableHead>
                    <TableHead className="hidden lg:table-cell">Garantia</TableHead>
                    <TableHead className="hidden lg:table-cell">Última interação</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((client) => (
                    <TableRow key={client.id} onClick={() => setViewingId(client.id)} className="cursor-pointer">
                      <TableCell className="hidden sm:table-cell font-medium">{client.name}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">{client.company || "-"}</TableCell>
                      <TableCell className="text-sm">{client.projectName}</TableCell>
                      <TableCell className="hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                        {proposalByClient.get(client.id) ? (
                          <Link href={`/freelancer/proposals?view=${proposalByClient.get(client.id)}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/30">
                            <FileText className="size-3" /> Proposta
                          </Link>
                        ) : (
                          <button onClick={() => router.push(`/freelancer/proposals?clientId=${client.id}&new=1`)} className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                            <FilePlus2 className="size-3.5" /> Criar
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell"><Badge variant="outline" className={cn("font-normal text-xs", planClass[client.plan])}>{PLAN_LABEL[client.plan]}</Badge></TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">{getWarrantyLabel(client)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{formatDate(getLastInteraction(client))}</TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setViewingId(client.id) }}>Abrir</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      <ClientFormSheet key={`create-${isAdding}`} open={isAdding} mode="create" initialForm={EMPTY_POST_SALE_CLIENT_FORM} onClose={() => setIsAdding(false)} onSubmit={handleCreate} />
      <ClientFormSheet key={`edit-${editing?.id ?? "closed"}`} open={!!editing} mode="edit" initialForm={editing ? createPostSaleClientForm(editing) : EMPTY_POST_SALE_CLIENT_FORM} onClose={() => setEditing(null)} onSubmit={handleEdit} />
      <ProfileSheet client={viewing} onClose={() => setViewingId(null)} onEdit={(client) => setEditing(client)} onUpdate={handleUpdate} />
    </>
  )
}
