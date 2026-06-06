"use client"

// ─── Types ─────────────────────────────────────────────────────────────────

export type LeadStatus =
  | "new"
  | "contacted"
  | "briefing"
  | "proposal_sent"
  | "negotiation"
  | "closed"
  | "lost"

export type ProjectType =
  | "landing_page"
  | "institutional_site"
  | "ecommerce"
  | "web_system"
  | "app"
  | "other"

export type LeadOrigin =
  | "instagram"
  | "google"
  | "referral"
  | "linkedin"
  | "whatsapp"
  | "other"

export type ActivityType =
  | "call"
  | "whatsapp"
  | "proposal"
  | "meeting"
  | "followup"

export type ActivityStatus = "pending" | "done"

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface LeadActivity {
  id: string
  type: ActivityType
  description: string
  date: string
  status: ActivityStatus
  created_at: string
}

export interface LeadComment {
  id: string
  content: string
  author: string
  created_at: string
}

export interface LeadTimelineEvent {
  id: string
  type: "created" | "status_changed" | "comment_added" | "activity_added" | "proposal_linked" | "edited"
  description: string
  created_at: string
}

export interface BriefingData {
  what_do_you_do: string
  services_offered: string
  differentials: string
  site_goals: string
  main_objectives: string
  target_audience: string
  main_persona: string
  sites_liked: string
  competitor_sites: string
  has_texts: boolean
  has_images: boolean
  has_branding: boolean
  features: string[]
}

export interface LeadEntry {
  id: string
  // Contact
  name: string
  email: string
  phone: string
  whatsapp: string
  // Company
  company: string
  segment: string
  city: string
  state: string
  current_site: string
  instagram: string
  // Opportunity
  project_type: ProjectType | ""
  project_objective: string
  desired_deadline: string
  investment_range: string
  // Meta
  origin: LeadOrigin | ""
  status: LeadStatus
  estimated_value: number | null
  responsible: string
  proposal_id: string | null
  // Sub-entities
  activities: LeadActivity[]
  comments: LeadComment[]
  timeline: LeadTimelineEvent[]
  briefing: BriefingData
  // Timestamps
  created_at: string
  updated_at: string
}

export interface LeadForm {
  name: string
  email: string
  phone: string
  whatsapp: string
  company: string
  segment: string
  city: string
  state: string
  current_site: string
  instagram: string
  project_type: ProjectType | ""
  project_objective: string
  desired_deadline: string
  investment_range: string
  origin: LeadOrigin | ""
  status: LeadStatus
  estimated_value: string
  responsible: string
}

// ─── Labels & Constants ────────────────────────────────────────────────────

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Novo Lead",
  contacted: "Contato Realizado",
  briefing: "Briefing Recebido",
  proposal_sent: "Proposta Enviada",
  negotiation: "Negociação",
  closed: "Fechado",
  lost: "Perdido",
}

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  landing_page: "Landing Page",
  institutional_site: "Site Institucional",
  ecommerce: "E-commerce",
  web_system: "Sistema Web",
  app: "Aplicativo",
  other: "Outro",
}

export const LEAD_ORIGIN_LABEL: Record<LeadOrigin, string> = {
  instagram: "Instagram",
  google: "Google",
  referral: "Indicação",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  other: "Outro",
}

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  call: "Ligar",
  whatsapp: "WhatsApp",
  proposal: "Enviar proposta",
  meeting: "Reunião",
  followup: "Follow-up",
}

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "new",
  "contacted",
  "briefing",
  "proposal_sent",
  "negotiation",
  "closed",
  "lost",
]

export const PROJECT_TYPE_OPTIONS: ProjectType[] = [
  "landing_page",
  "institutional_site",
  "ecommerce",
  "web_system",
  "app",
  "other",
]

export const LEAD_ORIGIN_OPTIONS: LeadOrigin[] = [
  "instagram",
  "google",
  "referral",
  "linkedin",
  "whatsapp",
  "other",
]

export const ACTIVITY_TYPE_OPTIONS: ActivityType[] = [
  "call",
  "whatsapp",
  "proposal",
  "meeting",
  "followup",
]

export const BRIEFING_FEATURES = [
  "Formulário de contato",
  "WhatsApp",
  "Blog",
  "Área de membros",
  "Agendamento",
  "Integrações",
  "Pagamentos",
  "Outros",
]

export const EMPTY_BRIEFING: BriefingData = {
  what_do_you_do: "",
  services_offered: "",
  differentials: "",
  site_goals: "",
  main_objectives: "",
  target_audience: "",
  main_persona: "",
  sites_liked: "",
  competitor_sites: "",
  has_texts: false,
  has_images: false,
  has_branding: false,
  features: [],
}

export const EMPTY_LEAD_FORM: LeadForm = {
  name: "",
  email: "",
  phone: "",
  whatsapp: "",
  company: "",
  segment: "",
  city: "",
  state: "",
  current_site: "",
  instagram: "",
  project_type: "",
  project_objective: "",
  desired_deadline: "",
  investment_range: "",
  origin: "",
  status: "new",
  estimated_value: "",
  responsible: "",
}

// ─── Storage ──────────────────────────────────────────────────────────────

export const CRM_STORAGE_KEY = "atlas_crm_leads"
export const CRM_STORAGE_EVENT = "atlas-crm-change"

const DEFAULT_LEADS: LeadEntry[] = []

let cachedLeadsRaw: string | null | undefined
let cachedLeadsSnapshot: LeadEntry[] = DEFAULT_LEADS

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function buildTimelineEvent(
  type: LeadTimelineEvent["type"],
  description: string,
  createdAt = new Date().toISOString()
): LeadTimelineEvent {
  return { id: createId(), type, description, created_at: createdAt }
}

function normalizeLead(entry: Partial<LeadEntry>): LeadEntry {
  const now = entry.created_at ?? new Date().toISOString()
  return {
    id: entry.id ?? createId(),
    name: entry.name?.trim() ?? "",
    email: entry.email?.trim() ?? "",
    phone: entry.phone?.trim() ?? "",
    whatsapp: entry.whatsapp?.trim() ?? "",
    company: entry.company?.trim() ?? "",
    segment: entry.segment?.trim() ?? "",
    city: entry.city?.trim() ?? "",
    state: entry.state?.trim() ?? "",
    current_site: entry.current_site?.trim() ?? "",
    instagram: entry.instagram?.trim() ?? "",
    project_type: entry.project_type ?? "",
    project_objective: entry.project_objective?.trim() ?? "",
    desired_deadline: entry.desired_deadline?.trim() ?? "",
    investment_range: entry.investment_range?.trim() ?? "",
    origin: entry.origin ?? "",
    status: LEAD_STATUS_ORDER.includes(entry.status as LeadStatus)
      ? (entry.status as LeadStatus)
      : "new",
    estimated_value:
      typeof entry.estimated_value === "number" && Number.isFinite(entry.estimated_value)
        ? entry.estimated_value
        : null,
    responsible: entry.responsible?.trim() ?? "",
    proposal_id: entry.proposal_id ?? null,
    activities: Array.isArray(entry.activities) ? entry.activities : [],
    comments: Array.isArray(entry.comments) ? entry.comments : [],
    timeline: Array.isArray(entry.timeline) ? entry.timeline : [],
    briefing: entry.briefing ?? { ...EMPTY_BRIEFING },
    created_at: now,
    updated_at: entry.updated_at ?? now,
  }
}

export function getLeadsSnapshot(): LeadEntry[] {
  if (typeof window === "undefined") return DEFAULT_LEADS
  try {
    const raw = localStorage.getItem(CRM_STORAGE_KEY)
    if (raw === cachedLeadsRaw) return cachedLeadsSnapshot
    const snapshot = raw
      ? (JSON.parse(raw) as Partial<LeadEntry>[]).map(normalizeLead)
      : DEFAULT_LEADS
    cachedLeadsRaw = raw
    cachedLeadsSnapshot = snapshot
    return snapshot
  } catch {
    cachedLeadsRaw = null
    cachedLeadsSnapshot = DEFAULT_LEADS
    return DEFAULT_LEADS
  }
}

export function getLeadsServerSnapshot(): LeadEntry[] {
  return DEFAULT_LEADS
}

export function saveLeads(data: LeadEntry[]) {
  if (typeof window === "undefined") return
  const raw = JSON.stringify(data)
  localStorage.setItem(CRM_STORAGE_KEY, raw)
  cachedLeadsRaw = raw
  cachedLeadsSnapshot = data
}

export function emitLeadsChange() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(CRM_STORAGE_EVENT))
}

export function subscribeLeadsStore(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== CRM_STORAGE_KEY) return
    onStoreChange()
  }
  const handleCrmChange = () => onStoreChange()

  window.addEventListener("storage", handleStorage)
  window.addEventListener(CRM_STORAGE_EVENT, handleCrmChange)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(CRM_STORAGE_EVENT, handleCrmChange)
  }
}

// ─── CRUD helpers ─────────────────────────────────────────────────────────

export function createLeadFromForm(form: LeadForm): LeadEntry {
  const now = new Date().toISOString()
  const entry = normalizeLead({
    name: form.name,
    email: form.email,
    phone: form.phone,
    whatsapp: form.whatsapp,
    company: form.company,
    segment: form.segment,
    city: form.city,
    state: form.state,
    current_site: form.current_site,
    instagram: form.instagram,
    project_type: form.project_type,
    project_objective: form.project_objective,
    desired_deadline: form.desired_deadline,
    investment_range: form.investment_range,
    origin: form.origin,
    status: form.status,
    estimated_value: form.estimated_value
      ? parseFloat(form.estimated_value.replace(",", "."))
      : null,
    responsible: form.responsible,
    created_at: now,
    updated_at: now,
  })
  entry.timeline = [
    buildTimelineEvent(
      "created",
      `Lead criado${form.name ? ` para ${form.name}` : ""}.`,
      now
    ),
  ]
  return entry
}

export function updateLeadFromForm(lead: LeadEntry, form: LeadForm): LeadEntry {
  const now = new Date().toISOString()
  const prevStatus = lead.status
  const updated = normalizeLead({
    ...lead,
    name: form.name,
    email: form.email,
    phone: form.phone,
    whatsapp: form.whatsapp,
    company: form.company,
    segment: form.segment,
    city: form.city,
    state: form.state,
    current_site: form.current_site,
    instagram: form.instagram,
    project_type: form.project_type,
    project_objective: form.project_objective,
    desired_deadline: form.desired_deadline,
    investment_range: form.investment_range,
    origin: form.origin,
    status: form.status,
    estimated_value: form.estimated_value
      ? parseFloat(form.estimated_value.replace(",", "."))
      : null,
    responsible: form.responsible,
    updated_at: now,
  })

  const newTimeline = [...lead.timeline]
  if (prevStatus !== form.status) {
    newTimeline.push(
      buildTimelineEvent(
        "status_changed",
        `Status alterado de "${LEAD_STATUS_LABEL[prevStatus]}" para "${LEAD_STATUS_LABEL[form.status as LeadStatus]}".`,
        now
      )
    )
  } else {
    newTimeline.push(buildTimelineEvent("edited", "Dados do lead atualizados.", now))
  }
  updated.timeline = newTimeline
  return updated
}

export function createLeadFormFromEntry(lead: LeadEntry): LeadForm {
  return {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    whatsapp: lead.whatsapp,
    company: lead.company,
    segment: lead.segment,
    city: lead.city,
    state: lead.state,
    current_site: lead.current_site,
    instagram: lead.instagram,
    project_type: lead.project_type,
    project_objective: lead.project_objective,
    desired_deadline: lead.desired_deadline,
    investment_range: lead.investment_range,
    origin: lead.origin,
    status: lead.status,
    estimated_value: lead.estimated_value !== null ? String(lead.estimated_value) : "",
    responsible: lead.responsible,
  }
}

export function moveLeadToStatus(lead: LeadEntry, newStatus: LeadStatus): LeadEntry {
  const now = new Date().toISOString()
  const prevStatus = lead.status
  const updated = normalizeLead({
    ...lead,
    status: newStatus,
    updated_at: now,
  })
  updated.timeline = [
    ...lead.timeline,
    buildTimelineEvent(
      "status_changed",
      `Status alterado de "${LEAD_STATUS_LABEL[prevStatus]}" para "${LEAD_STATUS_LABEL[newStatus]}".`,
      now
    ),
  ]
  return updated
}

export function addCommentToLead(
  lead: LeadEntry,
  content: string,
  author = "Você"
): LeadEntry {
  const now = new Date().toISOString()
  const comment: LeadComment = {
    id: createId(),
    content: content.trim(),
    author,
    created_at: now,
  }
  const updated = normalizeLead({
    ...lead,
    updated_at: now,
  })
  updated.comments = [...lead.comments, comment]
  updated.timeline = [
    ...lead.timeline,
    buildTimelineEvent("comment_added", "Comentário interno adicionado.", now),
  ]
  return updated
}

export function addActivityToLead(
  lead: LeadEntry,
  activity: Omit<LeadActivity, "id" | "created_at">
): LeadEntry {
  const now = new Date().toISOString()
  const newActivity: LeadActivity = {
    ...activity,
    id: createId(),
    created_at: now,
  }
  const updated = normalizeLead({ ...lead, updated_at: now })
  updated.activities = [...lead.activities, newActivity]
  updated.timeline = [
    ...lead.timeline,
    buildTimelineEvent(
      "activity_added",
      `Atividade adicionada: ${ACTIVITY_TYPE_LABEL[activity.type]}.`,
      now
    ),
  ]
  return updated
}

export function toggleActivityStatus(lead: LeadEntry, activityId: string): LeadEntry {
  const updated = normalizeLead({ ...lead, updated_at: new Date().toISOString() })
  updated.activities = lead.activities.map((a) =>
    a.id === activityId
      ? { ...a, status: a.status === "pending" ? "done" : "pending" }
      : a
  )
  updated.timeline = lead.timeline
  updated.comments = lead.comments
  return updated
}

export function updateLeadBriefing(lead: LeadEntry, briefing: BriefingData): LeadEntry {
  const now = new Date().toISOString()
  const updated = normalizeLead({ ...lead, briefing, updated_at: now })
  updated.timeline = [
    ...lead.timeline,
    buildTimelineEvent("edited", "Briefing atualizado.", now),
  ]
  updated.comments = lead.comments
  updated.activities = lead.activities
  return updated
}

export function linkProposalToLead(lead: LeadEntry, proposalId: string): LeadEntry {
  const now = new Date().toISOString()
  const updated = normalizeLead({ ...lead, proposal_id: proposalId, updated_at: now })
  updated.timeline = [
    ...lead.timeline,
    buildTimelineEvent("proposal_linked", "Proposta comercial vinculada ao lead.", now),
  ]
  updated.comments = lead.comments
  updated.activities = lead.activities
  return updated
}

// ─── Stats helpers ─────────────────────────────────────────────────────────

export function computeLeadStats(leads: LeadEntry[]) {
  const now = new Date()
  const thisMonth = leads.filter((l) => {
    const d = new Date(l.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const proposalSent = leads.filter((l) =>
    ["proposal_sent", "negotiation", "closed"].includes(l.status)
  )
  const closed = leads.filter((l) => l.status === "closed")
  const lost = leads.filter((l) => l.status === "lost")
  const decided = closed.length + lost.length
  const conversionRate = decided > 0 ? Math.round((closed.length / decided) * 100) : 0

  const pipelineValue = leads
    .filter((l) => !["closed", "lost"].includes(l.status) && l.estimated_value !== null)
    .reduce((sum, l) => sum + (l.estimated_value ?? 0), 0)

  const closedValue = closed
    .filter((l) => l.estimated_value !== null)
    .reduce((sum, l) => sum + (l.estimated_value ?? 0), 0)

  return {
    total: leads.length,
    thisMonth: thisMonth.length,
    proposalSent: proposalSent.length,
    closed: closed.length,
    lost: lost.length,
    conversionRate,
    pipelineValue,
    closedValue,
  }
}
