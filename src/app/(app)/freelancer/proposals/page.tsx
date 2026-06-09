"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
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
import { PageHeader } from "@/components/ui/page-header"
import {
  emitClientsChange,
  getClientsServerSnapshot,
  getClientsSnapshot,
  linkProposalToClient,
  saveClients,
  subscribeClientsStore,
  upsertClientFromApprovedProposal,
} from "@/lib/clients/store"
import {
  emitLeadsChange,
  getLeadsSnapshot,
  linkProposalToLead,
  saveLeads,
} from "@/lib/crm/store"
import { getProjectsSnapshot } from "@/lib/projects/store"
import {
  createProposalForm,
  createProposalFromForm,
  duplicateProposal,
  emitProposalsChange,
  EMPTY_PROPOSAL_FORM,
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

function readProposalDeepLink(): DeepLinkState {
  const empty: DeepLinkState = {
    viewing: null,
    isCreating: false,
    prefillForm: null,
    consumed: false,
  }
  if (typeof window === "undefined") return empty

  const params = new URLSearchParams(window.location.search)
  const leadId = params.get("leadId")
  const clientId = params.get("clientId")
  const isNew = params.get("new")
  const viewId = params.get("view")
  let consumed = false
  let viewing: ProposalEntry | null = null
  let isCreating = false
  let prefillForm: ProposalForm | null = null

  if (viewId) {
    const found = getProposalsSnapshot().find((proposal) => proposal.id === viewId)
    if (found) {
      viewing = found
      consumed = true
    }
  }
  if (isNew && leadId) {
    const lead = getLeadsSnapshot().find((item) => item.id === leadId)
    if (lead) {
      prefillForm = buildProposalFormFromLead(lead)
      isCreating = true
      consumed = true
    }
  }
  if (isNew && clientId) {
    const client = getClientsSnapshot().find((item) => item.id === clientId)
    if (client) {
      prefillForm = buildProposalFormFromClient(client)
      isCreating = true
      consumed = true
    }
  }

  return { viewing, isCreating, prefillForm, consumed }
}

export default function ProposalsPage() {
  const proposals = useSyncExternalStore(
    subscribeProposalsStore,
    getProposalsSnapshot,
    getProposalsServerSnapshot
  )
  const clients = useSyncExternalStore(subscribeClientsStore, getClientsSnapshot, getClientsServerSnapshot)
  const [deepLink] = useState(readProposalDeepLink)
  const [isCreating, setIsCreating] = useState(deepLink.isCreating)
  const [prefillForm, setPrefillForm] = useState<ProposalForm | null>(deepLink.prefillForm)
  const [editing, setEditing] = useState<ProposalEntry | null>(null)
  const [viewing, setViewing] = useState<ProposalEntry | null>(deepLink.viewing)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "all">("all")
  const [clientFilter, setClientFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all")

  useEffect(() => {
    if (deepLink.consumed) window.history.replaceState(null, "", window.location.pathname)
  }, [deepLink.consumed])

  const filtered = useMemo(() => {
    const search = normalizeSearch(query)
    return proposals
      .filter((proposal) => {
        if (statusFilter !== "all" && proposal.status !== statusFilter) return false
        if (clientFilter !== "all" && proposal.clientId !== clientFilter) return false
        if (!isInPeriod(proposal.proposalDate, periodFilter)) return false
        if (!search) return true
        return normalizeSearch(
          [proposal.clientName, proposal.objective, proposal.estimatedDeadline].join(" ")
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
    if (!window.confirm(`Excluir a proposta de "${proposal.clientName}"?`)) return
    persist(proposals.filter((item) => item.id !== proposal.id))
    if (viewing?.id === proposal.id) setViewing(null)
  }

  async function handleShare(proposal: ProposalEntry) {
    const url = `${window.location.origin}/p/${proposal.id}`
    await navigator.clipboard?.writeText(url)
  }

  return (
    <>
      <div className="flex flex-col gap-6">
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

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
    </>
  )
}
