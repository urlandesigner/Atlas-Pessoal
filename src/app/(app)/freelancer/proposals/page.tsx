"use client"

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { useSearchParams } from "next/navigation"
import { Eye, FileText, MoreHorizontal, Plus, WalletCards } from "lucide-react"

import { type PeriodFilter } from "@/components/proposals/constants"
import { Metric, ProposalFilters, ProposalList } from "@/components/proposals/list-parts"
import { ProposalEditor } from "@/components/proposals/proposal-editor"
import { ProposalView } from "@/components/proposals/proposal-view"
import {
  buildProposalFormFromClient,
  buildProposalFormFromLead,
  isInPeriod,
  money,
  normalizeSearch,
} from "@/components/proposals/utils"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { PageHeader } from "@/components/ui/page-header"
import {
  emitClientsChange,
  type ClientEntry,
  getClientsServerSnapshot,
  getClientsSnapshot,
  linkProposalToClient,
  saveClients,
  subscribeClientsStore,
  upsertClientFromApprovedProposal,
} from "@/lib/clients/store"
import {
  emitLeadsChange,
  getLeadsServerSnapshot,
  getLeadsSnapshot,
  linkProposalToLead,
  saveLeads,
  subscribeLeadsStore,
  type LeadEntry,
} from "@/lib/crm/store"
import { getProjectsSnapshot } from "@/lib/projects/store"
import {
  createProposalForm,
  createProposalFromForm,
  duplicateProposal,
  emitProposalsChange,
  EMPTY_PROPOSAL_FORM,
  getProposalPlanName,
  getProposalsServerSnapshot,
  getProposalsSnapshot,
  saveProposals,
  subscribeProposalsStore,
  updateProposalInCollection,
  type ProposalEntry,
  type ProposalForm,
  type ProposalStatus,
} from "@/lib/proposals/store"

type DeepLinkState = {
  viewing: ProposalEntry | null
  isCreating: boolean
  prefillForm: ProposalForm | null
  consumed: boolean
}

function resolveProposalDeepLink({
  search,
  proposals,
  leads,
  clients,
}: {
  search: string
  proposals: ProposalEntry[]
  leads: LeadEntry[]
  clients: ClientEntry[]
}): DeepLinkState {
  const empty: DeepLinkState = {
    viewing: null,
    isCreating: false,
    prefillForm: null,
    consumed: false,
  }

  if (!search) return empty

  const params = new URLSearchParams(search)
  const leadId = params.get("leadId")
  const clientId = params.get("clientId")
  const isNew = params.get("new")
  const viewId = params.get("view")
  let consumed = false
  let viewing: ProposalEntry | null = null
  let isCreating = false
  let prefillForm: ProposalForm | null = null

  if (viewId) {
    const found = proposals.find((proposal) => proposal.id === viewId)
    if (found) {
      viewing = found
      consumed = true
    }
  }
  if (isNew && leadId) {
    const lead = leads.find((item) => item.id === leadId)
    if (lead) {
      prefillForm = buildProposalFormFromLead(lead)
      isCreating = true
      consumed = true
    }
  }
  if (isNew && clientId) {
    const client = clients.find((item) => item.id === clientId)
    if (client) {
      prefillForm = buildProposalFormFromClient(client)
      isCreating = true
      consumed = true
    }
  }

  return { viewing, isCreating, prefillForm, consumed }
}

export default function ProposalsPage() {
  const searchParams = useSearchParams()
  const proposals = useSyncExternalStore(
    subscribeProposalsStore,
    getProposalsSnapshot,
    getProposalsServerSnapshot
  )
  const leads = useSyncExternalStore(
    subscribeLeadsStore,
    getLeadsSnapshot,
    getLeadsServerSnapshot
  )
  const clients = useSyncExternalStore(subscribeClientsStore, getClientsSnapshot, getClientsServerSnapshot)
  const handledSearchRef = useRef("")
  const [isCreating, setIsCreating] = useState(false)
  const [prefillForm, setPrefillForm] = useState<ProposalForm | null>(null)
  const [editing, setEditing] = useState<ProposalEntry | null>(null)
  const [viewing, setViewing] = useState<ProposalEntry | null>(null)
  const [proposalPendingDelete, setProposalPendingDelete] = useState<ProposalEntry | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "all">("all")
  const [clientFilter, setClientFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all")

  useEffect(() => {
    const search = searchParams.toString()
    if (!search || handledSearchRef.current === search) return

    const deepLink = resolveProposalDeepLink({
      search,
      proposals,
      leads,
      clients,
    })

    if (!deepLink.consumed) return

    handledSearchRef.current = search

    queueMicrotask(() => {
      if (deepLink.viewing) {
        setViewing(deepLink.viewing)
        setEditing(null)
        setPrefillForm(null)
        setIsCreating(false)
      } else if (deepLink.isCreating && deepLink.prefillForm) {
        setViewing(null)
        setEditing(null)
        setPrefillForm(deepLink.prefillForm)
        setIsCreating(true)
      }

      window.history.replaceState(null, "", window.location.pathname)
    })
  }, [clients, leads, proposals, searchParams])

  const filtered = useMemo(() => {
    const search = normalizeSearch(query)
    return proposals
      .filter((proposal) => {
        if (statusFilter !== "all" && proposal.status !== statusFilter) return false
        if (clientFilter !== "all" && proposal.clientId !== clientFilter) return false
        if (!isInPeriod(proposal.proposalDate, periodFilter)) return false
        if (!search) return true
        return normalizeSearch(
          [
            proposal.clientName,
            getProposalPlanName(proposal),
            proposal.objective,
            proposal.estimatedDeadline,
          ].join(" ")
        ).includes(search)
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [clientFilter, periodFilter, proposals, query, statusFilter])

  const totals = useMemo(() => {
    const approved = proposals.filter((proposal) => proposal.status === "approved")
    return {
      count: proposals.length,
      approved: approved.length,
      sent: proposals.filter((proposal) => proposal.status === "sent" || proposal.status === "viewed").length,
      value: approved.reduce((sum, proposal) => sum + proposal.totalValue, 0),
    }
  }, [proposals])

  function syncApprovedClients(next: ProposalEntry[], previous: ProposalEntry[]) {
    const newlyApproved = next.filter((proposal) => {
      const old = previous.find((item) => item.id === proposal.id)
      return proposal.status === "approved" && old?.status !== "approved"
    })
    if (!newlyApproved.length) return

    const projects = getProjectsSnapshot()
    const freelancerProjects = projects.freelancer
    const nextClients = newlyApproved.reduce((collection, proposal) => {
      const project = proposal.projectId
        ? freelancerProjects.find((item) => item.id === proposal.projectId)
        : null
      return upsertClientFromApprovedProposal(collection, proposal, project)
    }, clients)

    saveClients(nextClients)
    emitClientsChange()
  }

  function persist(next: ProposalEntry[]) {
    syncApprovedClients(next, proposals)
    saveProposals(next)
    emitProposalsChange()
  }

  function handleCreate(form: ProposalForm) {
    const proposal = createProposalFromForm(form)
    persist([proposal, ...proposals])
    if (form.leadId) {
      const leads = getLeadsSnapshot()
      const nextLeads = leads.map((lead) =>
        lead.id === form.leadId ? linkProposalToLead(lead, proposal.id) : lead
      )
      saveLeads(nextLeads)
      emitLeadsChange()
    }
    if (form.clientId) {
      const clients = getClientsSnapshot()
      const nextClients = clients.map((client) =>
        client.id === form.clientId ? linkProposalToClient(client, proposal.id) : client
      )
      saveClients(nextClients)
      emitClientsChange()
    }
    setIsCreating(false)
    setPrefillForm(null)
  }

  function handleEdit(form: ProposalForm) {
    if (!editing) return
    const next = updateProposalInCollection(proposals, editing.id, form)
    persist(next)
    setEditing(null)
    setViewing(next.find((proposal) => proposal.id === editing.id) ?? null)
  }

  function handleDuplicate(proposal: ProposalEntry) {
    persist([duplicateProposal(proposal), ...proposals])
  }

  function handleDelete(proposal: ProposalEntry) {
    setProposalPendingDelete(proposal)
  }

  function confirmDeleteProposal() {
    if (!proposalPendingDelete) return
    persist(proposals.filter((item) => item.id !== proposalPendingDelete.id))
    if (viewing?.id === proposalPendingDelete.id) setViewing(null)
    setProposalPendingDelete(null)
  }

  async function handleShare(proposal: ProposalEntry) {
    const url = `${window.location.origin}/p/${proposal.id}`
    await navigator.clipboard?.writeText(url)
  }

  return (
    <>
      <div className="min-w-0 flex flex-col gap-6">
        <PageHeader
          title="Propostas"
          description="Centralize propostas antes da aprovação e futura conversão em projeto."
          actions={
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus data-icon="inline-start" />
              Criar proposta
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Propostas" value={totals.count} icon={FileText} />
          <Metric label="Em negociação" value={totals.sent} icon={MoreHorizontal} />
          <Metric label="Aprovadas" value={totals.approved} icon={Eye} />
          <Metric label="Valor aprovado" value={money(totals.value)} icon={WalletCards} />
        </div>

        <ProposalFilters
          query={query}
          onQueryChange={setQuery}
          clientFilter={clientFilter}
          onClientFilterChange={setClientFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          periodFilter={periodFilter}
          onPeriodFilterChange={setPeriodFilter}
          clients={clients}
        />

        <ProposalList
          proposals={filtered}
          onView={setViewing}
          onEdit={setEditing}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onCreate={() => setIsCreating(true)}
        />
      </div>

      <ProposalEditor
        key={`create-${isCreating ? prefillForm?.leadId || prefillForm?.clientId || "open" : "closed"}`}
        open={isCreating}
        mode="create"
        initialForm={prefillForm ?? EMPTY_PROPOSAL_FORM}
        clients={clients}
        onClose={() => {
          setIsCreating(false)
          setPrefillForm(null)
        }}
        onSubmit={handleCreate}
      />
      <ProposalEditor
        key={`edit-${editing?.id ?? "closed"}`}
        open={!!editing}
        mode="edit"
        initialForm={editing ? createProposalForm(editing) : EMPTY_PROPOSAL_FORM}
        clients={clients}
        onClose={() => setEditing(null)}
        onSubmit={handleEdit}
      />
      <ProposalView
        proposal={viewing}
        onClose={() => setViewing(null)}
        onEdit={(proposal) => {
          setViewing(null)
          setEditing(proposal)
        }}
        onDuplicate={handleDuplicate}
        onShare={handleShare}
      />
      <ConfirmDialog
        open={!!proposalPendingDelete}
        onOpenChange={(open) => !open && setProposalPendingDelete(null)}
        title="Excluir proposta"
        description={
          proposalPendingDelete
            ? `A proposta de "${proposalPendingDelete.clientName}" será removida do sistema.`
            : undefined
        }
        confirmLabel="Excluir proposta"
        confirmVariant="destructive"
        onConfirm={confirmDeleteProposal}
      />
    </>
  )
}
