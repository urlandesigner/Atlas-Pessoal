"use client"

import { syncProposalsToSupabase } from "@/lib/supabase/data"

export type ProposalStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "approved"
  | "rejected"
  | "expired"

export type EntryMode = "percent" | "value"

export const DOMAIN_ADDON_PRICE = 40
export const HOSTING_ADDON_PRICE = 250

export type ProposalAddonOptions = {
  domainFirstYearFree?: boolean
  hostingFirstYearFree?: boolean
}

export function hasProposalDomain(included: string[]) {
  return included.some((item) => /(domínio|dominio)/i.test(item))
}

export function hasProposalHosting(included: string[]) {
  return included.some((item) => /hospedagem/i.test(item))
}

export function getProposalAddonOptions(
  source: Partial<Pick<ProposalEntry, "included" | "domainFirstYearFree" | "hostingFirstYearFree">>
): Required<ProposalAddonOptions> {
  const included = source.included ?? []
  return {
    domainFirstYearFree: hasProposalDomain(included) && Boolean(source.domainFirstYearFree),
    hostingFirstYearFree: hasProposalHosting(included) && Boolean(source.hostingFirstYearFree),
  }
}

export function buildDomainIncludedLabel(firstYearFree: boolean) {
  return firstYearFree ? "Domínio (1º ano gratuito)" : `Domínio (R$ ${DOMAIN_ADDON_PRICE}/ano)`
}

export function buildHostingIncludedLabel(firstYearFree: boolean) {
  return firstYearFree ? "Hospedagem (1º ano gratuito)" : `Hospedagem (R$ ${HOSTING_ADDON_PRICE}/ano)`
}

export function getProposalAddonTotal(included: string[], options: ProposalAddonOptions = {}) {
  return (
    (hasProposalDomain(included) && !options.domainFirstYearFree ? DOMAIN_ADDON_PRICE : 0) +
    (hasProposalHosting(included) && !options.hostingFirstYearFree ? HOSTING_ADDON_PRICE : 0)
  )
}

/** Parceria explícita ou investimento só com extras (desenvolvimento zerado). */
export function resolveProposalPartnership(
  isPartnership: boolean,
  totalValue: number,
  included: string[],
  options: ProposalAddonOptions = {}
) {
  if (isPartnership) return true
  const addonTotal = getProposalAddonTotal(included, options)
  if (addonTotal === 0) return false
  return Math.max(totalValue, addonTotal) - addonTotal === 0
}

export function getProposalDisplayTotal(
  isPartnership: boolean,
  totalValue: number,
  included: string[],
  options: ProposalAddonOptions = {}
) {
  const addonTotal = getProposalAddonTotal(included, options)
  if (resolveProposalPartnership(isPartnership, totalValue, included, options)) return addonTotal
  return Math.max(totalValue, addonTotal)
}

export function getProposalDevelopmentTotal(
  isPartnership: boolean,
  totalValue: number,
  included: string[],
  options: ProposalAddonOptions = {}
) {
  if (resolveProposalPartnership(isPartnership, totalValue, included, options)) return 0
  return Math.max(
    getProposalDisplayTotal(false, totalValue, included, options) - getProposalAddonTotal(included, options),
    0
  )
}

export interface ProposalScopeCategory {
  id: string
  name: string
  items: string[]
}

export interface ProposalEntry {
  id: string
  title: string
  clientId: string | null
  clientName: string
  projectId: string | null
  leadId: string | null
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
  created_at: string
  updated_at: string
}

export interface ProposalForm {
  title: string
  clientId: string
  clientName: string
  projectId: string
  leadId: string
  proposalDate: string
  validUntil: string
  objective: string
  scope: ProposalScopeCategory[]
  estimatedDeadline: string
  totalValue: string
  entryMode: EntryMode
  entryValue: string
  paymentMethod: string
  isPartnership: boolean
  domainFirstYearFree: boolean
  hostingFirstYearFree: boolean
  included: string[]
  notIncluded: string[]
  notes: string
  status: ProposalStatus
}

export interface ProposalTemplate {
  id: string
  name: string
  title: string
  objective: string
  scope: Omit<ProposalScopeCategory, "id">[]
  estimatedDeadline: string
  totalValue: string
  entryMode: EntryMode
  entryValue: string
  paymentMethod: string
  included: string[]
  notIncluded: string[]
  notes: string
}

export const PROPOSALS_STORAGE_KEY = "atlas_proposals"
export const PROPOSALS_STORAGE_EVENT = "atlas-proposals-change"

const DEFAULT_PAYMENT_METHOD = "50% na aprovação/publicação e 50% pra 30 dias"
export const PARTNERSHIP_PAYMENT_METHOD = "A combinar"

export function getProposalPaymentMethod(
  isPartnership: boolean,
  paymentMethod: string,
  totalValue = 0,
  included: string[] = [],
  options: ProposalAddonOptions = {}
) {
  if (resolveProposalPartnership(isPartnership, totalValue, included, options)) {
    return PARTNERSHIP_PAYMENT_METHOD
  }
  return paymentMethod.trim() || "A definir"
}

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  viewed: "Visualizada",
  approved: "Aprovada",
  rejected: "Recusada",
  expired: "Expirada",
}

export const PROPOSAL_STATUS_OPTIONS: ProposalStatus[] = [
  "draft",
  "sent",
  "viewed",
  "approved",
  "rejected",
  "expired",
]

function padDatePart(value: number) {
  return String(value).padStart(2, "0")
}

function formatDateInputValue(date: Date) {
  return `${date.getUTCFullYear()}-${padDatePart(date.getUTCMonth() + 1)}-${padDatePart(date.getUTCDate())}`
}

export function getDefaultProposalDate() {
  return formatDateInputValue(new Date())
}

export function getProposalValidUntil(proposalDate = getDefaultProposalDate(), days = 30) {
  const base = new Date(`${proposalDate.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(base.getTime())) return ""
  base.setUTCDate(base.getUTCDate() + days)
  return formatDateInputValue(base)
}

export const EMPTY_PROPOSAL_FORM: ProposalForm = {
  title: "",
  clientId: "",
  clientName: "",
  projectId: "",
  leadId: "",
  proposalDate: getDefaultProposalDate(),
  validUntil: getProposalValidUntil(),
  objective: "",
  scope: [],
  estimatedDeadline: "",
  totalValue: "",
  entryMode: "percent",
  entryValue: "50",
  paymentMethod: DEFAULT_PAYMENT_METHOD,
  isPartnership: false,
  domainFirstYearFree: false,
  hostingFirstYearFree: false,
  included: [],
  notIncluded: [],
  notes: "",
  status: "draft",
}

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  {
    id: "site-essencial",
    name: "Site Essencial",
    title: "Site Essencial",
    objective:
      "Desenvolver um site direto ao ponto, com presença profissional e estrutura essencial para apresentação da empresa.",
    scope: [
      { name: "Páginas", items: ["Home", "Sobre", "Serviços", "Contato"] },
      { name: "Recursos", items: ["WhatsApp", "Formulário de contato", "Responsivo"] },
      { name: "Entrega", items: ["Publicação", "Configuração inicial"] },
    ],
    estimatedDeadline: "7 a 10 dias úteis",
    totalValue: "999",
    entryMode: "percent",
    entryValue: "50",
    paymentMethod: DEFAULT_PAYMENT_METHOD,
    included: [
      "Design objetivo",
      "Desenvolvimento responsivo",
      "Publicação",
      "Suporte inicial",
    ],
    notIncluded: ["Hospedagem", "Domínio", "Produção de conteúdo", "Tráfego pago"],
    notes: "",
  },
  {
    id: "site-profissional",
    name: "Site Profissional",
    title: "Site Profissional",
    objective:
      "Criar um site mais robusto, com estrutura profissional, melhor acabamento visual e foco em credibilidade e conversão.",
    scope: [
      { name: "Páginas", items: ["Home", "Sobre", "Serviços", "Cases", "Contato"] },
      { name: "Recursos", items: ["WhatsApp", "Formulário", "SEO básico", "Sessões estratégicas"] },
      { name: "Entrega", items: ["Design responsivo", "Publicação", "Configuração inicial"] },
    ],
    estimatedDeadline: "10 a 15 dias úteis",
    totalValue: "1899",
    entryMode: "percent",
    entryValue: "50",
    paymentMethod: DEFAULT_PAYMENT_METHOD,
    included: [
      "Design mais refinado",
      "Desenvolvimento responsivo",
      "SEO básico",
      "Publicação",
    ],
    notIncluded: ["Hospedagem", "Domínio", "Copywriting completo", "Tráfego pago"],
    notes: "",
  },
  {
    id: "site-sob-medida",
    name: "Site Sob Medida",
    title: "Site Sob Medida",
    objective:
      "Desenvolver uma solução personalizada a partir das necessidades, funcionalidades e complexidade específicas do projeto.",
    scope: [
      { name: "Descoberta", items: ["Levantamento de necessidades", "Definição de escopo", "Mapeamento de prioridades"] },
      { name: "Projeto", items: ["Arquitetura sob medida", "Design responsivo", "Desenvolvimento personalizado"] },
      { name: "Entrega", items: ["Planejamento de execução", "Publicação", "Acompanhamento inicial"] },
    ],
    estimatedDeadline: "Conforme escopo",
    totalValue: "",
    entryMode: "value",
    entryValue: "",
    paymentMethod: DEFAULT_PAYMENT_METHOD,
    included: ["Discovery inicial", "Estrutura personalizada", "Desenvolvimento sob medida"],
    notIncluded: ["Hospedagem", "Domínio", "Integrações fora do escopo validado"],
    notes: "Valor final definido conforme escopo do projeto.",
  },
]

export const DEFAULT_PROPOSALS: ProposalEntry[] = []

let cachedProposalsSnapshot: ProposalEntry[] = DEFAULT_PROPOSALS

const KNOWN_PROPOSAL_PLANS = PROPOSAL_TEMPLATES.map((template) => ({
  name: template.name.trim(),
  objective: template.objective.trim(),
  estimatedDeadline: template.estimatedDeadline.trim(),
  totalValue: normalizeNumber(template.totalValue),
}))

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeStatus(status: ProposalStatus | string | null | undefined): ProposalStatus {
  return PROPOSAL_STATUS_OPTIONS.includes(status as ProposalStatus)
    ? (status as ProposalStatus)
    : "draft"
}

function normalizeNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (!value) return 0
  const parsed = Number(String(value).replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item).trim()).filter(Boolean)
}

function normalizeScope(value: unknown): ProposalScopeCategory[] {
  if (!Array.isArray(value)) return []
  return value
    .map((category) => {
      const item = category as Partial<ProposalScopeCategory>
      return {
        id: item.id ?? createId("scope"),
        name: item.name?.trim() ?? "",
        items: normalizeStringList(item.items),
      }
    })
    .filter((category) => category.name || category.items.length)
}

function normalizePlanComparison(value: string | null | undefined) {
  return value?.trim().toLowerCase() || ""
}

export function getProposalPlanName(
  entry: Pick<
    Partial<ProposalEntry>,
    "title" | "clientName" | "objective" | "estimatedDeadline" | "totalValue"
  >
) {
  const title = entry.title?.trim() || ""
  const clientName = entry.clientName?.trim() || ""
  const objective = normalizePlanComparison(entry.objective)
  const estimatedDeadline = normalizePlanComparison(entry.estimatedDeadline)
  const totalValue = normalizeNumber(entry.totalValue)

  const matchedPlan =
    KNOWN_PROPOSAL_PLANS.find(
      (plan) => normalizePlanComparison(plan.name) === normalizePlanComparison(title)
    ) ??
    KNOWN_PROPOSAL_PLANS.find(
      (plan) => plan.objective && normalizePlanComparison(plan.objective) === objective
    ) ??
    KNOWN_PROPOSAL_PLANS.find((plan) => {
      if (plan.estimatedDeadline && normalizePlanComparison(plan.estimatedDeadline) === estimatedDeadline) {
        if (plan.totalValue === 0) return true
        return plan.totalValue === totalValue
      }
      return false
    }) ??
    KNOWN_PROPOSAL_PLANS.find((plan) => plan.totalValue > 0 && plan.totalValue === totalValue)

  if (matchedPlan) return matchedPlan.name
  if (/sob medida|conforme escopo|escopo personalizado|solucao personalizada/.test(`${objective} ${estimatedDeadline}`)) {
    return "Site Sob Medida"
  }
  if (totalValue >= 1899 || /15 dias|robusto|credibilidade|convers/.test(`${objective} ${estimatedDeadline}`)) {
    return "Site Profissional"
  }
  if (
    totalValue > 0 ||
    /website institucional|site institucional|presenca digital|site direto|estrutura essencial/.test(objective)
  ) {
    return "Site Essencial"
  }
  if (title && title !== clientName && title !== "Cliente não informado") return title
  return ""
}

export function normalizeProposalEntry(entry: Partial<ProposalEntry>): ProposalEntry {
  const createdAt = entry.created_at ?? new Date().toISOString()
  const proposalDate = entry.proposalDate || getDefaultProposalDate()
  const included = normalizeStringList(entry.included)
  const addonOptions = getProposalAddonOptions(entry)
  const addonTotal = getProposalAddonTotal(included, addonOptions)
  const rawTotal = normalizeNumber(entry.totalValue)
  const isPartnership = resolveProposalPartnership(Boolean(entry.isPartnership), rawTotal, included, addonOptions)
  const totalValue = isPartnership ? addonTotal : Math.max(rawTotal, addonTotal)

  return {
    id: entry.id ?? createId("proposal"),
    title: getProposalPlanName(entry),
    clientId: entry.clientId || null,
    clientName: entry.clientName?.trim() || "Cliente não informado",
    projectId: entry.projectId || null,
    leadId: entry.leadId || null,
    proposalDate,
    validUntil: entry.validUntil || getProposalValidUntil(proposalDate),
    objective: entry.objective?.trim() || "",
    scope: normalizeScope(entry.scope),
    estimatedDeadline: entry.estimatedDeadline?.trim() || "",
    totalValue,
    entryMode: entry.entryMode === "value" ? "value" : "percent",
    entryValue: isPartnership && addonTotal === 0 ? 0 : normalizeNumber(entry.entryValue),
    paymentMethod: isPartnership ? PARTNERSHIP_PAYMENT_METHOD : entry.paymentMethod?.trim() || "",
    isPartnership,
    domainFirstYearFree: addonOptions.domainFirstYearFree,
    hostingFirstYearFree: addonOptions.hostingFirstYearFree,
    included,
    notIncluded: normalizeStringList(entry.notIncluded),
    notes: entry.notes?.trim() || null,
    status: normalizeStatus(entry.status),
    created_at: createdAt,
    updated_at: entry.updated_at ?? createdAt,
  }
}

export function hydrateProposals(data: Partial<ProposalEntry>[]) {
  cachedProposalsSnapshot = data.map(normalizeProposalEntry)
}

export function getProposalsSnapshot() {
  return cachedProposalsSnapshot
}

export function getProposalsServerSnapshot() {
  return DEFAULT_PROPOSALS
}

export function saveProposals(data: ProposalEntry[]) {
  const snapshot = data.map(normalizeProposalEntry)
  cachedProposalsSnapshot = snapshot
  void syncProposalsToSupabase(snapshot).catch((err) => console.error("[proposals] sync:", err))
}

export function emitProposalsChange() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(PROPOSALS_STORAGE_EVENT))
}

export function subscribeProposalsStore(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}
  const handler = () => onStoreChange()
  window.addEventListener(PROPOSALS_STORAGE_EVENT, handler)
  return () => window.removeEventListener(PROPOSALS_STORAGE_EVENT, handler)
}

export function createScopeCategory(name = "Nova categoria"): ProposalScopeCategory {
  return { id: createId("scope"), name, items: [] }
}

export function createProposalForm(entry: ProposalEntry): ProposalForm {
  const normalized = normalizeProposalEntry(entry)
  return {
    title: normalized.title,
    clientId: normalized.clientId ?? "",
    clientName: normalized.clientName === "Cliente não informado" ? "" : normalized.clientName,
    projectId: normalized.projectId ?? "",
    leadId: normalized.leadId ?? "",
    proposalDate: normalized.proposalDate,
    validUntil: normalized.validUntil,
    objective: normalized.objective,
    scope: normalized.scope.map((category) => ({ ...category, items: [...category.items] })),
    estimatedDeadline: normalized.estimatedDeadline,
    totalValue: String(normalized.totalValue ?? ""),
    entryMode: normalized.entryMode,
    entryValue: normalized.entryValue ? String(normalized.entryValue) : "",
    paymentMethod: normalized.paymentMethod,
    isPartnership: normalized.isPartnership,
    domainFirstYearFree: normalized.domainFirstYearFree,
    hostingFirstYearFree: normalized.hostingFirstYearFree,
    included: [...normalized.included],
    notIncluded: [...normalized.notIncluded],
    notes: normalized.notes ?? "",
    status: normalized.status,
  }
}

export function createProposalFromForm(form: ProposalForm): ProposalEntry {
  const now = new Date().toISOString()
  return normalizeProposalEntry({
    title: form.title.trim(),
    clientId: form.clientId || null,
    clientName: form.clientName,
    projectId: form.projectId || null,
    leadId: form.leadId || null,
    proposalDate: form.proposalDate,
    validUntil: form.validUntil || getProposalValidUntil(form.proposalDate),
    objective: form.objective,
    scope: form.scope,
    estimatedDeadline: form.estimatedDeadline,
    totalValue: normalizeNumber(form.totalValue),
    entryMode: form.entryMode,
    entryValue: normalizeNumber(form.entryValue),
    paymentMethod: form.paymentMethod,
    isPartnership: form.isPartnership,
    domainFirstYearFree: form.domainFirstYearFree,
    hostingFirstYearFree: form.hostingFirstYearFree,
    included: form.included,
    notIncluded: form.notIncluded,
    notes: form.notes,
    status: form.status,
    created_at: now,
    updated_at: now,
  })
}

export function updateProposalInCollection(
  proposals: ProposalEntry[],
  proposalId: string,
  form: ProposalForm
) {
  return proposals.map((proposal) =>
    proposal.id === proposalId
      ? normalizeProposalEntry({
          ...proposal,
          title: form.title.trim(),
          clientId: form.clientId || null,
          clientName: form.clientName,
          projectId: form.projectId || null,
          leadId: form.leadId || null,
          proposalDate: form.proposalDate,
          validUntil: form.validUntil,
          objective: form.objective,
          scope: form.scope,
          estimatedDeadline: form.estimatedDeadline,
          totalValue: normalizeNumber(form.totalValue),
          entryMode: form.entryMode,
          entryValue: normalizeNumber(form.entryValue),
          paymentMethod: form.paymentMethod,
          isPartnership: form.isPartnership,
          domainFirstYearFree: form.domainFirstYearFree,
          hostingFirstYearFree: form.hostingFirstYearFree,
          included: form.included,
          notIncluded: form.notIncluded,
          notes: form.notes,
          status: form.status,
          updated_at: new Date().toISOString(),
        })
      : proposal
  )
}

export function duplicateProposal(proposal: ProposalEntry): ProposalEntry {
  return normalizeProposalEntry({
    ...proposal,
    id: createId("proposal"),
    title: proposal.title,
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
}

export function applyTemplateToForm(form: ProposalForm, template: ProposalTemplate): ProposalForm {
  return {
    ...form,
    title: template.name,
    objective: template.objective,
    scope: template.scope.map((category) => ({
      id: createId("scope"),
      name: category.name,
      items: [...category.items],
    })),
    estimatedDeadline: template.estimatedDeadline,
    totalValue: template.totalValue,
    entryMode: template.entryMode,
    entryValue: template.entryValue,
    paymentMethod: template.paymentMethod,
    included: [...template.included],
    notIncluded: [...template.notIncluded],
    notes: template.notes,
  }
}
