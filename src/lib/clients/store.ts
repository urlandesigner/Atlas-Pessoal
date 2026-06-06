"use client"

import type { ProposalEntry } from "@/lib/proposals/store"
import type { ProjectEntry } from "@/lib/projects/store"

export type MaintenancePlan = "none" | "essential" | "professional" | "growth"
export type ClientStatus = "active" | "onboarding" | "paused" | "inactive"
export type DeliveryStatus = "configured" | "not_configured"
export type RequestCategory = "fix" | "content" | "visual" | "feature" | "question"
export type RequestStatus = "open" | "in_progress" | "done" | "canceled"
export type OpportunityStatus = "identified" | "presented" | "negotiation" | "won" | "lost"
export type TimelineType =
  | "proposal_approved"
  | "project_started"
  | "delivery"
  | "request"
  | "comment"
  | "plan_change"
  | "renewal"

export interface ClientTimelineEntry {
  id: string
  type: TimelineType
  title: string
  description: string
  created_at: string
  author: string
}

export interface ClientDeliveryInfo {
  siteUrl: string
  stagingUrl: string
  domainName: string
  domainExpiresAt: string
  hostingProvider: string
  hostingExpiresAt: string
  integrations: {
    googleAnalytics: DeliveryStatus
    searchConsole: DeliveryStatus
    metaPixel: DeliveryStatus
    googleTagManager: DeliveryStatus
  }
}

export interface DeliveryChecklistItem {
  id: string
  label: string
  completed: boolean
}

export interface ClientRequest {
  id: string
  title: string
  category: RequestCategory
  description: string
  date: string
  status: RequestStatus
}

export interface ClientOpportunity {
  id: string
  title: string
  description: string
  revenuePotential: number
  status: OpportunityStatus
}

export interface ClientComment {
  id: string
  author: string
  body: string
  created_at: string
}

export interface ClientEntry {
  id: string
  name: string
  company: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  created_at: string
  entryDate: string
  status: ClientStatus
  projectId: string | null
  projectName: string
  projectType: string
  projectStartDate: string
  projectDeliveryDate: string
  contractedValue: number
  publishedSiteUrl: string
  plan: MaintenancePlan
  planStartedAt: string
  monthlyValue: number
  warrantyDeliveryDate: string
  warrantyDays: number
  delivery: ClientDeliveryInfo
  checklist: DeliveryChecklistItem[]
  requests: ClientRequest[]
  opportunities: ClientOpportunity[]
  comments: ClientComment[]
  timeline: ClientTimelineEntry[]
}

export interface ClientForm {
  name: string
  phone: string
  email: string
}

export interface PostSaleClientForm extends ClientForm {
  company: string
  whatsapp: string
  status: ClientStatus
  projectName: string
  projectType: string
  projectStartDate: string
  projectDeliveryDate: string
  contractedValue: string
  publishedSiteUrl: string
  plan: MaintenancePlan
  planStartedAt: string
  monthlyValue: string
  warrantyDeliveryDate: string
  warrantyDays: string
}

export const CLIENTS_STORAGE_KEY = "atlas_clients"
export const CLIENTS_STORAGE_EVENT = "atlas-clients-change"
const PROJECTS_STORAGE_KEY = "atlas_projects"
const TODAY = "2026-06-05"

export const PLAN_LABEL: Record<MaintenancePlan, string> = {
  none: "Sem plano",
  essential: "Essencial",
  professional: "Profissional",
  growth: "Growth",
}

export const PLAN_DESCRIPTION: Record<MaintenancePlan, string[]> = {
  none: ["Projeto entregue sem recorrencia."],
  essential: ["Monitoramento", "Backup", "SSL"],
  professional: ["Tudo do Essencial", "Ajustes simples mensais", "Atualizacao de conteudo"],
  growth: ["Tudo do Profissional", "SEO continuo", "Landing pages", "Consultoria"],
}

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  active: "Ativo",
  onboarding: "Entrada",
  paused: "Pausado",
  inactive: "Inativo",
}

export const REQUEST_CATEGORY_LABEL: Record<RequestCategory, string> = {
  fix: "Correcao",
  content: "Alteracao de conteudo",
  visual: "Alteracao visual",
  feature: "Nova funcionalidade",
  question: "Duvida",
}

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  done: "Concluido",
  canceled: "Cancelado",
}

export const OPPORTUNITY_STATUS_LABEL: Record<OpportunityStatus, string> = {
  identified: "Identificada",
  presented: "Apresentada",
  negotiation: "Negociacao",
  won: "Vendida",
  lost: "Perdida",
}

export const EMPTY_CLIENT_FORM: ClientForm = {
  name: "",
  phone: "",
  email: "",
}

export const EMPTY_POST_SALE_CLIENT_FORM: PostSaleClientForm = {
  ...EMPTY_CLIENT_FORM,
  company: "",
  whatsapp: "",
  status: "active",
  projectName: "",
  projectType: "",
  projectStartDate: TODAY,
  projectDeliveryDate: "",
  contractedValue: "",
  publishedSiteUrl: "",
  plan: "none",
  planStartedAt: "",
  monthlyValue: "",
  warrantyDeliveryDate: "",
  warrantyDays: "30",
}

export const DEFAULT_CHECKLIST: DeliveryChecklistItem[] = [
  "Site publicado",
  "SSL ativo",
  "Analytics instalado",
  "Search Console configurado",
  "Backup configurado",
  "Formularios testados",
  "Responsividade validada",
  "SEO basico configurado",
].map((label, index) => ({ id: `delivery-${index + 1}`, label, completed: false }))

export const DEFAULT_DELIVERY: ClientDeliveryInfo = {
  siteUrl: "",
  stagingUrl: "",
  domainName: "",
  domainExpiresAt: "",
  hostingProvider: "",
  hostingExpiresAt: "",
  integrations: {
    googleAnalytics: "not_configured",
    searchConsole: "not_configured",
    metaPixel: "not_configured",
    googleTagManager: "not_configured",
  },
}

export const DEFAULT_CLIENTS: ClientEntry[] = []

let cachedClientsRaw: string | null | undefined
let cachedClientsSnapshot: ClientEntry[] = DEFAULT_CLIENTS

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (!value) return 0
  const parsed = Number(String(value).replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeDate(value: string | null | undefined) {
  return value?.slice(0, 10) ?? ""
}

function normalizeDelivery(value: Partial<ClientDeliveryInfo> | undefined): ClientDeliveryInfo {
  return {
    ...DEFAULT_DELIVERY,
    ...value,
    integrations: {
      ...DEFAULT_DELIVERY.integrations,
      ...value?.integrations,
    },
  }
}

function normalizeChecklist(value: unknown): DeliveryChecklistItem[] {
  if (!Array.isArray(value)) return DEFAULT_CHECKLIST.map((item) => ({ ...item }))
  const stored = value as Partial<DeliveryChecklistItem>[]
  const merged = DEFAULT_CHECKLIST.map((item) => {
    const existing = stored.find((candidate) => candidate.id === item.id || candidate.label === item.label)
    return { ...item, completed: Boolean(existing?.completed) }
  })
  const custom = stored
    .filter((item) => item.label && !merged.some((base) => base.id === item.id || base.label === item.label))
    .map((item) => ({ id: item.id ?? createId("checklist"), label: item.label ?? "", completed: Boolean(item.completed) }))
  return [...merged, ...custom]
}

function normalizeTimeline(value: unknown, fallback: ClientTimelineEntry[]): ClientTimelineEntry[] {
  const entries = Array.isArray(value) ? (value as Partial<ClientTimelineEntry>[]) : fallback
  return entries
    .map((entry) => ({
      id: entry.id ?? createId("timeline"),
      type: entry.type ?? "comment",
      title: entry.title?.trim() || "Atualizacao registrada",
      description: entry.description?.trim() || "",
      created_at: entry.created_at ?? new Date().toISOString(),
      author: entry.author?.trim() || "Atlas",
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

function normalizeClient(client: Partial<ClientEntry>): ClientEntry {
  const createdAt = client.created_at ?? new Date().toISOString()
  const name = client.name?.trim() || "Cliente sem nome"
  const deliveryDate = normalizeDate(client.warrantyDeliveryDate || client.projectDeliveryDate)
  const timelineFallback = [
    {
      id: `${client.id ?? "client"}-created`,
      type: "project_started" as TimelineType,
      title: "Cliente movido para pos-venda",
      description: "Cadastro criado para acompanhamento do relacionamento, suporte e manutencao.",
      created_at: createdAt,
      author: "Atlas",
    },
  ]

  return {
    id: client.id ?? createId("client"),
    name,
    company: client.company?.trim() || null,
    phone: client.phone?.trim() || null,
    whatsapp: client.whatsapp?.trim() || client.phone?.trim() || null,
    email: client.email?.trim() || null,
    created_at: createdAt,
    entryDate: normalizeDate(client.entryDate) || createdAt.slice(0, 10),
    status: client.status ?? "active",
    projectId: client.projectId || null,
    projectName: client.projectName?.trim() || "Projeto sem nome",
    projectType: client.projectType?.trim() || "Projeto digital",
    projectStartDate: normalizeDate(client.projectStartDate) || createdAt.slice(0, 10),
    projectDeliveryDate: normalizeDate(client.projectDeliveryDate),
    contractedValue: normalizeNumber(client.contractedValue),
    publishedSiteUrl: client.publishedSiteUrl?.trim() || "",
    plan: client.plan ?? "none",
    planStartedAt: normalizeDate(client.planStartedAt),
    monthlyValue: normalizeNumber(client.monthlyValue),
    warrantyDeliveryDate: deliveryDate,
    warrantyDays: client.warrantyDays ?? 30,
    delivery: normalizeDelivery(client.delivery),
    checklist: normalizeChecklist(client.checklist),
    requests: (client.requests ?? []).map((request) => ({
      id: request.id ?? createId("request"),
      title: request.title?.trim() || "Solicitacao sem titulo",
      category: request.category ?? "fix",
      description: request.description?.trim() || "",
      date: normalizeDate(request.date) || new Date().toISOString().slice(0, 10),
      status: request.status ?? "open",
    })),
    opportunities: (client.opportunities ?? []).map((opportunity) => ({
      id: opportunity.id ?? createId("opportunity"),
      title: opportunity.title?.trim() || "Oportunidade",
      description: opportunity.description?.trim() || "",
      revenuePotential: normalizeNumber(opportunity.revenuePotential),
      status: opportunity.status ?? "identified",
    })),
    comments: (client.comments ?? []).map((comment) => ({
      id: comment.id ?? createId("comment"),
      author: comment.author?.trim() || "Voce",
      body: comment.body?.trim() || "",
      created_at: comment.created_at ?? new Date().toISOString(),
    })),
    timeline: normalizeTimeline(client.timeline, timelineFallback),
  }
}

function buildSeedFromFreelancerProjects(): ClientEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const freelancerProjects = Array.isArray(parsed?.freelancer) ? (parsed.freelancer as ProjectEntry[]) : []
    const byName = new Map<string, ProjectEntry>()
    for (const project of freelancerProjects) {
      const name = project.clientName?.trim()
      if (name && !byName.has(name)) byName.set(name, project)
    }
    return Array.from(byName.entries()).map(([name, project], index) =>
      normalizeClient({
        id: project.clientId ?? `legacy-client-${index + 1}`,
        name,
        projectId: project.id,
        projectName: project.name,
        projectStartDate: project.started_at ?? "",
        projectDeliveryDate: project.ended_at ?? "",
        contractedValue: project.value ?? 0,
        created_at: new Date(2026, 0, index + 1).toISOString(),
      })
    )
  } catch {
    return []
  }
}

export function getClientsSnapshot() {
  if (typeof window === "undefined") return DEFAULT_CLIENTS
  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY)
    if (raw === cachedClientsRaw) return cachedClientsSnapshot
    const snapshot = raw
      ? (JSON.parse(raw) as Partial<ClientEntry>[]).map(normalizeClient)
      : buildSeedFromFreelancerProjects()
    cachedClientsRaw = raw
    cachedClientsSnapshot = snapshot
    return snapshot
  } catch {
    cachedClientsRaw = null
    cachedClientsSnapshot = buildSeedFromFreelancerProjects()
    return cachedClientsSnapshot
  }
}

export function getClientsServerSnapshot() {
  return DEFAULT_CLIENTS
}

export function saveClients(data: ClientEntry[]) {
  if (typeof window === "undefined") return
  const normalized = data.map(normalizeClient)
  const raw = JSON.stringify(normalized)
  localStorage.setItem(CLIENTS_STORAGE_KEY, raw)
  cachedClientsRaw = raw
  cachedClientsSnapshot = normalized
}

export function emitClientsChange() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(CLIENTS_STORAGE_EVENT))
}

export function subscribeClientsStore(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}
  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== CLIENTS_STORAGE_KEY) return
    onStoreChange()
  }
  const handleClientsChange = () => onStoreChange()
  window.addEventListener("storage", handleStorage)
  window.addEventListener(CLIENTS_STORAGE_EVENT, handleClientsChange)
  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(CLIENTS_STORAGE_EVENT, handleClientsChange)
  }
}

export function createClientFromForm(form: ClientForm): ClientEntry {
  return normalizeClient({
    name: form.name,
    phone: form.phone,
    whatsapp: form.phone,
    email: form.email,
  })
}

export function createPostSaleClientFromForm(form: PostSaleClientForm): ClientEntry {
  return normalizeClient({
    name: form.name,
    company: form.company,
    phone: form.phone,
    whatsapp: form.whatsapp || form.phone,
    email: form.email,
    status: form.status,
    projectName: form.projectName,
    projectType: form.projectType,
    projectStartDate: form.projectStartDate,
    projectDeliveryDate: form.projectDeliveryDate,
    contractedValue: normalizeNumber(form.contractedValue),
    publishedSiteUrl: form.publishedSiteUrl,
    plan: form.plan,
    planStartedAt: form.planStartedAt,
    monthlyValue: normalizeNumber(form.monthlyValue),
    warrantyDeliveryDate: form.warrantyDeliveryDate || form.projectDeliveryDate,
    warrantyDays: normalizeNumber(form.warrantyDays) || 30,
  })
}

export function createClientForm(client: ClientEntry): ClientForm {
  return {
    name: client.name,
    phone: client.phone ?? "",
    email: client.email ?? "",
  }
}

export function createPostSaleClientForm(client: ClientEntry): PostSaleClientForm {
  return {
    name: client.name,
    company: client.company ?? "",
    phone: client.phone ?? "",
    whatsapp: client.whatsapp ?? "",
    email: client.email ?? "",
    status: client.status,
    projectName: client.projectName,
    projectType: client.projectType,
    projectStartDate: client.projectStartDate,
    projectDeliveryDate: client.projectDeliveryDate,
    contractedValue: client.contractedValue ? String(client.contractedValue) : "",
    publishedSiteUrl: client.publishedSiteUrl,
    plan: client.plan,
    planStartedAt: client.planStartedAt,
    monthlyValue: client.monthlyValue ? String(client.monthlyValue) : "",
    warrantyDeliveryDate: client.warrantyDeliveryDate,
    warrantyDays: String(client.warrantyDays || 30),
  }
}

export function addClientToCollection(clients: ClientEntry[], entry: ClientEntry) {
  return [normalizeClient(entry), ...clients]
}

export function updateClientInCollection(clients: ClientEntry[], clientId: string, form: ClientForm) {
  return clients.map((client) =>
    client.id === clientId
      ? normalizeClient({ ...client, name: form.name, phone: form.phone, whatsapp: client.whatsapp || form.phone, email: form.email })
      : client
  )
}

export function updatePostSaleClientInCollection(
  clients: ClientEntry[],
  clientId: string,
  form: PostSaleClientForm
) {
  return clients.map((client) =>
    client.id === clientId
      ? normalizeClient({
          ...client,
          ...createPostSaleClientFromForm(form),
          id: client.id,
          created_at: client.created_at,
          entryDate: client.entryDate,
          delivery: client.delivery,
          checklist: client.checklist,
          requests: client.requests,
          opportunities: client.opportunities,
          comments: client.comments,
          timeline:
            client.plan !== form.plan
              ? [
                  createTimelineEntry("plan_change", "Plano alterado", `Plano atual definido como ${PLAN_LABEL[form.plan]}.`, "Voce"),
                  ...client.timeline,
                ]
              : client.timeline,
        })
      : client
  )
}

export function createTimelineEntry(type: TimelineType, title: string, description: string, author = "Atlas") {
  return {
    id: createId("timeline"),
    type,
    title,
    description,
    created_at: new Date().toISOString(),
    author,
  }
}

export function upsertClientFromApprovedProposal(
  clients: ClientEntry[],
  proposal: ProposalEntry,
  project?: ProjectEntry | null
) {
  const now = new Date().toISOString()
  const existingIndex = clients.findIndex((client) =>
    proposal.clientId ? client.id === proposal.clientId : client.name.toLowerCase() === proposal.clientName.toLowerCase()
  )
  const approvedEvent = createTimelineEntry(
    "proposal_approved",
    "Proposta aprovada",
    `Proposta aprovada no valor de ${proposal.totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`
  )
  const projectEvent = createTimelineEntry("project_started", "Inicio do projeto", "Projeto vinculado ao pos-venda automaticamente.")
  const base: Partial<ClientEntry> = {
    id: proposal.clientId || clients[existingIndex]?.id,
    name: proposal.clientName,
    projectId: proposal.projectId || project?.id || null,
    projectName: project?.name || proposal.title || proposal.clientName,
    projectType: proposal.scope[0]?.name || "Projeto digital",
    projectStartDate: proposal.proposalDate || now.slice(0, 10),
    contractedValue: proposal.totalValue,
    entryDate: now.slice(0, 10),
    status: "active",
  }

  if (existingIndex >= 0) {
    return clients.map((client, index) =>
      index === existingIndex
        ? normalizeClient({
            ...client,
            ...base,
            timeline: [approvedEvent, projectEvent, ...client.timeline].filter(
              (event, eventIndex, list) => list.findIndex((item) => item.title === event.title && item.description === event.description) === eventIndex
            ),
          })
        : client
    )
  }

  return [
    normalizeClient({
      ...base,
      created_at: now,
      timeline: [approvedEvent, projectEvent],
      opportunities: [
        { id: createId("opportunity"), title: "Plano de manutencao", description: "Apresentar recorrencia apos entrega.", revenuePotential: 0, status: "identified" },
      ],
    }),
    ...clients,
  ]
}

export function getChecklistProgress(client: ClientEntry) {
  if (!client.checklist.length) return 0
  return Math.round((client.checklist.filter((item) => item.completed).length / client.checklist.length) * 100)
}

export function getWarrantyDaysLeft(client: ClientEntry, reference = new Date()) {
  if (!client.warrantyDeliveryDate) return null
  const start = new Date(`${client.warrantyDeliveryDate}T00:00:00`)
  const end = new Date(start)
  end.setDate(start.getDate() + (client.warrantyDays || 30))
  const today = new Date(reference)
  today.setHours(0, 0, 0, 0)
  return Math.ceil((end.getTime() - today.getTime()) / 86400000)
}

export function getLastInteraction(client: ClientEntry) {
  const candidates = [
    ...client.timeline.map((item) => item.created_at),
    ...client.comments.map((item) => item.created_at),
    ...client.requests.map((item) => item.date),
  ].filter(Boolean)
  return candidates.sort((a, b) => b.localeCompare(a))[0] ?? client.created_at
}

export function updateClientRecord(clients: ClientEntry[], updated: ClientEntry) {
  return clients.map((client) => (client.id === updated.id ? normalizeClient(updated) : client))
}
