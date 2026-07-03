import type {
  EntryMode,
  ProposalEntry,
  ProposalForm,
  ProposalScopeCategory,
  ProposalStatus,
} from "@/lib/proposals/store"

const DEFAULT_PUBLIC_PROPOSAL_BASE_URL = "https://propostas.udlabs.com.br"

export type PublicProposalData = {
  title: string
  clientName: string
  proposalDate: string
  validUntil: string
  objective: string
  scope: ProposalScopeCategory[]
  estimatedDeadline: string
  totalValue: number
  entryMode: EntryMode
  entryValue: number
  paymentMethod: string
  isPartnership: boolean
  domainFirstYearFree: boolean
  hostingFirstYearFree: boolean
  included: string[]
  notIncluded: string[]
  notes: string | null
  status: ProposalStatus
  baselineTotalValue: number
  discountPercent: number
  offerRevision: number
  offerUpdatedAt: string | null
  created_at: string
  updated_at: string
  publicToken: string
}

export function createPublicProposalToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").toLowerCase()
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`.toLowerCase()
}

export function normalizePublicProposalToken(value: string | null | undefined) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")

  return normalized || createPublicProposalToken()
}

export function buildPublicProposalPath(publicToken: string) {
  return `/proposta/${normalizePublicProposalToken(publicToken)}`
}

export function getPublicProposalBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_PUBLIC_PROPOSAL_BASE_URL?.trim()
  const baseUrl = configured || DEFAULT_PUBLIC_PROPOSAL_BASE_URL
  return baseUrl.replace(/\/+$/, "")
}

export function buildPublicProposalUrl(publicToken: string, baseUrl = getPublicProposalBaseUrl()) {
  return `${baseUrl}${buildPublicProposalPath(publicToken)}`
}

function normalizeScope(scope: ProposalEntry["scope"] | undefined) {
  if (!Array.isArray(scope)) return []

  return scope.map((category) => ({
    id: category?.id ?? createPublicProposalToken(),
    name: category?.name ?? "",
    items: Array.isArray(category?.items)
      ? category.items.map((item) => String(item ?? "").trim()).filter(Boolean)
      : [],
  }))
}

function normalizeList(items: string[] | undefined) {
  return Array.isArray(items)
    ? items.map((item) => String(item ?? "").trim()).filter(Boolean)
    : []
}

export function toPublicProposalData(proposal: Partial<ProposalEntry>): PublicProposalData {
  const createdAt = proposal.created_at ?? new Date().toISOString()

  return {
    title: proposal.title?.trim() ?? "",
    clientName: proposal.clientName?.trim() || "Cliente não informado",
    proposalDate: proposal.proposalDate ?? "",
    validUntil: proposal.validUntil ?? "",
    objective: proposal.objective?.trim() ?? "",
    scope: normalizeScope(proposal.scope),
    estimatedDeadline: proposal.estimatedDeadline?.trim() ?? "",
    totalValue: typeof proposal.totalValue === "number" ? proposal.totalValue : 0,
    entryMode: proposal.entryMode === "value" ? "value" : "percent",
    entryValue: typeof proposal.entryValue === "number" ? proposal.entryValue : 0,
    paymentMethod: proposal.paymentMethod?.trim() ?? "",
    isPartnership: Boolean(proposal.isPartnership),
    domainFirstYearFree: Boolean(proposal.domainFirstYearFree),
    hostingFirstYearFree: Boolean(proposal.hostingFirstYearFree),
    included: normalizeList(proposal.included),
    notIncluded: normalizeList(proposal.notIncluded),
    notes: proposal.notes?.trim() || null,
    status: proposal.status ?? "draft",
    baselineTotalValue: typeof proposal.baselineTotalValue === "number" ? proposal.baselineTotalValue : 0,
    discountPercent: typeof proposal.discountPercent === "number" ? proposal.discountPercent : 0,
    offerRevision: typeof proposal.offerRevision === "number" ? proposal.offerRevision : 0,
    offerUpdatedAt: proposal.offerUpdatedAt ?? null,
    created_at: createdAt,
    updated_at: proposal.updated_at ?? createdAt,
    publicToken: normalizePublicProposalToken(proposal.publicToken),
  }
}

export function toPublicProposalPreviewForm(proposal: PublicProposalData): ProposalForm {
  return {
    title: proposal.title,
    clientId: "",
    clientName: proposal.clientName,
    projectId: "",
    leadId: "",
    proposalDate: proposal.proposalDate,
    validUntil: proposal.validUntil,
    objective: proposal.objective,
    scope: proposal.scope.map((category) => ({
      id: category.id,
      name: category.name,
      items: [...category.items],
    })),
    estimatedDeadline: proposal.estimatedDeadline,
    totalValue: String(proposal.totalValue),
    entryMode: proposal.entryMode,
    entryValue: String(proposal.entryValue),
    paymentMethod: proposal.paymentMethod,
    isPartnership: proposal.isPartnership,
    domainFirstYearFree: proposal.domainFirstYearFree,
    hostingFirstYearFree: proposal.hostingFirstYearFree,
    included: [...proposal.included],
    notIncluded: [...proposal.notIncluded],
    notes: proposal.notes ?? "",
    status: proposal.status,
    baselineTotalValue: String(proposal.baselineTotalValue || ""),
    discountPercent: String(proposal.discountPercent || ""),
    offerRevision: String(proposal.offerRevision || ""),
  }
}
