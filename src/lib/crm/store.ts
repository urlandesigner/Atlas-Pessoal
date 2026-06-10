"use client"

// ─── Types ─────────────────────────────────────────────────────────────────

// Pipeline Stages (Nova estrutura)
export type PipelineStage = "lead" | "qualified" | "meeting" | "proposal" | "project" | "client"

// Legacy compatibility
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
  type: "created" | "status_changed" | "comment_added" | "activity_added" | "proposal_linked" | "edited" | "stage_changed"
  description: string
  created_at: string
  stage?: PipelineStage // para stage_changed events
}

export interface StageEntry {
  stage: PipelineStage
  entered_at: string
  exited_at: string | null
  duration_days?: number
  metadata?: Record<string, unknown>
}

export interface StageCompletion {
  stage: PipelineStage
  fields_filled: string[]
  total_fields: number
  completion_percentage: number
}

export interface ProspectData {
  company: string
  segment?: string
  city?: string
  state?: string
  origin?: LeadOrigin | ""
  first_contact_date: string
}

export interface QualificationData {
  contact_name?: string
  email?: string
  phone?: string
  job_title?: string
  project_objective?: string
  project_type?: ProjectType | ""
  desired_deadline?: string
  investment_range?: string
  qualified_at?: string
}

export interface OpportunityData {
  estimated_value?: number | null
  quote_value?: number | null
  closed_value?: number | null
  closing_probability?: number
  notes?: string
  updated_at?: string
}

export interface CommunicationData {
  email?: string
  phone?: string
  whatsapp?: string
  instagram?: string
  current_site?: string
  preferred_channel?: "email" | "phone" | "whatsapp" | "instagram"
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
  // Identity & Pipeline
  id: string
  status_stage: PipelineStage
  status: LeadStatus // legacy, for backward compatibility
  completion_percentage: number
  // Lost (terminal) state — independent of the linear stages
  lost: boolean
  lost_reason: string
  lost_at: string | null
  created_at: string
  updated_at: string

  // Core data (organized by section)
  prospect: ProspectData
  qualification: QualificationData
  opportunity: OpportunityData
  communication: CommunicationData

  // Pipeline tracking
  stages: StageEntry[]
  stage_completion: Record<PipelineStage, StageCompletion>

  // Historical data
  activities: LeadActivity[]
  comments: LeadComment[]
  timeline: LeadTimelineEvent[]
  briefing: BriefingData

  // Relationships
  proposal_ids: string[]
  project_ids: string[]
  client_id: string | null

  // Legacy fields for backward compatibility
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
  estimated_value: number | null
  responsible: string
  proposal_id: string | null
}

// Quick form for lead creation (< 15 seconds)
export interface QuickLeadForm {
  company: string // required
  segment?: string
  city?: string
  origin?: LeadOrigin | ""
}

// Full form for legacy support
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

// Pipeline stages
export const PIPELINE_STAGE_LABEL: Record<PipelineStage, string> = {
  lead: "Lead",
  qualified: "Qualificado",
  meeting: "Reunião",
  proposal: "Proposta",
  project: "Projeto",
  client: "Cliente",
}

export const PIPELINE_STAGES: PipelineStage[] = [
  "lead",
  "qualified",
  "meeting",
  "proposal",
  "project",
  "client",
]

export const PIPELINE_STAGE_FIELDS: Record<PipelineStage, string[]> = {
  lead: ["company", "segment", "city", "origin"],
  qualified: [
    "contact_name",
    "email",
    "phone",
    "job_title",
    "project_objective",
    "project_type",
    "desired_deadline",
    "investment_range",
  ],
  meeting: ["meeting_date", "meeting_notes", "meeting_attendees"],
  proposal: ["estimated_value", "quote_value", "closing_probability"],
  project: ["project_start", "project_deadline", "project_manager"],
  client: ["closed_value"],
}

// Human-readable labels for every pipeline field
export const FIELD_LABELS: Record<string, string> = {
  company: "Empresa",
  segment: "Segmento",
  city: "Cidade",
  origin: "Origem",
  contact_name: "Nome do contato",
  email: "E-mail",
  phone: "Telefone",
  job_title: "Cargo",
  project_objective: "Objetivo do projeto",
  project_type: "Tipo de projeto",
  desired_deadline: "Prazo desejado",
  investment_range: "Faixa de investimento",
  meeting_date: "Data da reunião",
  meeting_notes: "Notas da reunião",
  meeting_attendees: "Participantes",
  estimated_value: "Valor estimado",
  quote_value: "Valor enviado",
  closing_probability: "Probabilidade de fechamento",
  project_start: "Início do projeto",
  project_deadline: "Prazo do projeto",
  project_manager: "Responsável",
  closed_value: "Valor fechado",
}

// Resolve a pipeline field key to its current value within the sectioned data
export function getFieldValue(lead: LeadEntry, key: string): unknown {
  switch (key) {
    case "company":
      return lead.prospect.company
    case "segment":
      return lead.prospect.segment
    case "city":
      return lead.prospect.city
    case "origin":
      return lead.prospect.origin
    case "contact_name":
      return lead.qualification.contact_name
    case "email":
      return lead.qualification.email || lead.communication.email
    case "phone":
      return lead.qualification.phone || lead.communication.phone
    case "job_title":
      return lead.qualification.job_title
    case "project_objective":
      return lead.qualification.project_objective
    case "project_type":
      return lead.qualification.project_type
    case "desired_deadline":
      return lead.qualification.desired_deadline
    case "investment_range":
      return lead.qualification.investment_range
    case "estimated_value":
      return lead.opportunity.estimated_value
    case "quote_value":
      return lead.opportunity.quote_value
    case "closing_probability":
      return lead.opportunity.closing_probability
    case "closed_value":
      return lead.opportunity.closed_value
    default:
      return undefined
  }
}

export interface StageFieldStatus {
  key: string
  label: string
  filled: boolean
}

// Returns the checklist status for every field of a given stage
export function getStageFieldStatus(lead: LeadEntry, stage: PipelineStage): StageFieldStatus[] {
  return PIPELINE_STAGE_FIELDS[stage].map((key) => {
    const value = getFieldValue(lead, key)
    const filled = value !== undefined && value !== null && value !== "" && value !== 0
    return { key, label: FIELD_LABELS[key] ?? key, filled }
  })
}

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

// Quick form for lead creation
export const EMPTY_QUICK_LEAD_FORM: QuickLeadForm = {
  company: "",
  segment: "",
  city: "",
  origin: "",
}

export const EMPTY_QUALIFICATION: QualificationData = {
  contact_name: "",
  email: "",
  phone: "",
  job_title: "",
  project_objective: "",
  project_type: "",
  desired_deadline: "",
  investment_range: "",
}

export const EMPTY_OPPORTUNITY: OpportunityData = {
  estimated_value: null,
  quote_value: null,
  closed_value: null,
  closing_probability: 0,
  notes: "",
}

export const EMPTY_COMMUNICATION: CommunicationData = {
  email: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  current_site: "",
  preferred_channel: "whatsapp",
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

const DEFAULT_LEADS: LeadEntry[] = [
  {
    id: "lead-renan-modani-001",
    status_stage: "lead",
    status: "new",
    completion_percentage: 0,
    lost: false,
    lost_reason: "",
    lost_at: null,
    created_at: "2026-06-10T00:00:00.000Z",
    updated_at: "2026-06-10T00:00:00.000Z",
    prospect: {
      company: "Renan Modani",
      first_contact_date: "2026-06-10T00:00:00.000Z",
    },
    qualification: {
      contact_name: "Renan Modani",
    },
    opportunity: {
      estimated_value: null,
      quote_value: null,
      closed_value: null,
      closing_probability: 0,
    },
    communication: {},
    stages: [
      {
        stage: "lead",
        entered_at: "2026-06-10T00:00:00.000Z",
        exited_at: null,
      },
    ],
    stage_completion: {} as Record<PipelineStage, StageCompletion>,
    activities: [],
    comments: [],
    timeline: [
      {
        id: "tl-renan-modani-001",
        type: "created",
        description: "Lead criado para Renan Modani.",
        created_at: "2026-06-10T00:00:00.000Z",
      },
    ],
    briefing: { ...EMPTY_BRIEFING },
    proposal_ids: [],
    project_ids: [],
    client_id: null,
    name: "Renan Modani",
    email: "",
    phone: "",
    whatsapp: "",
    company: "Renan Modani",
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
    estimated_value: null,
    responsible: "",
    proposal_id: null,
  },
  {
    id: "lead-anderson-andrade-001",
    status_stage: "lead",
    status: "new",
    completion_percentage: 0,
    lost: false,
    lost_reason: "",
    lost_at: null,
    created_at: "2026-06-10T00:00:00.000Z",
    updated_at: "2026-06-10T00:00:00.000Z",
    prospect: {
      company: "Sier",
      first_contact_date: "2026-06-10T00:00:00.000Z",
    },
    qualification: {
      contact_name: "Anderson Andrade",
    },
    opportunity: {
      estimated_value: null,
      quote_value: null,
      closed_value: null,
      closing_probability: 0,
    },
    communication: {},
    stages: [
      {
        stage: "lead",
        entered_at: "2026-06-10T00:00:00.000Z",
        exited_at: null,
      },
    ],
    stage_completion: {} as Record<PipelineStage, StageCompletion>,
    activities: [],
    comments: [],
    timeline: [
      {
        id: "tl-anderson-andrade-001",
        type: "created",
        description: "Lead criado para Anderson Andrade (Sier).",
        created_at: "2026-06-10T00:00:00.000Z",
      },
    ],
    briefing: { ...EMPTY_BRIEFING },
    proposal_ids: [],
    project_ids: [],
    client_id: null,
    name: "Anderson Andrade",
    email: "",
    phone: "",
    whatsapp: "",
    company: "Sier",
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
    estimated_value: null,
    responsible: "",
    proposal_id: null,
  },
]

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

// Builds completion stats for every stage from the sectioned data.
function buildStageCompletion(lead: LeadEntry): Record<PipelineStage, StageCompletion> {
  const result: Record<PipelineStage, StageCompletion> = {} as Record<PipelineStage, StageCompletion>

  for (const stage of PIPELINE_STAGES) {
    const items = getStageFieldStatus(lead, stage)
    const filled = items.filter((i) => i.filled).map((i) => i.key)

    result[stage] = {
      stage,
      fields_filled: filled,
      total_fields: items.length,
      completion_percentage: items.length > 0 ? Math.round((filled.length / items.length) * 100) : 0,
    }
  }

  return result
}

function normalizeLead(entry: Partial<LeadEntry>): LeadEntry {
  const now = entry.created_at ?? new Date().toISOString()
  const stage = entry.status_stage ?? "lead"

  const normalized: LeadEntry = {
    id: entry.id ?? createId(),
    status_stage: PIPELINE_STAGES.includes(stage as any) ? (stage as PipelineStage) : "lead",
    status: LEAD_STATUS_ORDER.includes(entry.status as LeadStatus) ? (entry.status as LeadStatus) : "new",
    completion_percentage: entry.completion_percentage ?? 0,
    lost: entry.lost ?? false,
    lost_reason: entry.lost_reason?.trim() ?? "",
    lost_at: entry.lost_at ?? null,
    created_at: now,
    updated_at: entry.updated_at ?? now,

    // Core data
    prospect: {
      company: entry.prospect?.company ?? entry.company?.trim() ?? "",
      segment: entry.prospect?.segment ?? entry.segment?.trim(),
      city: entry.prospect?.city ?? entry.city?.trim(),
      state: entry.prospect?.state ?? entry.state?.trim(),
      origin: (entry.prospect?.origin ?? entry.origin) as LeadOrigin | "" | undefined,
      first_contact_date: entry.prospect?.first_contact_date ?? now,
    },

    qualification: {
      contact_name: entry.qualification?.contact_name ?? entry.name?.trim(),
      email: entry.qualification?.email ?? entry.email?.trim(),
      phone: entry.qualification?.phone ?? entry.phone?.trim(),
      job_title: entry.qualification?.job_title,
      project_objective: entry.qualification?.project_objective ?? entry.project_objective?.trim(),
      project_type: (entry.qualification?.project_type ?? entry.project_type) as ProjectType | "" | undefined,
      desired_deadline: entry.qualification?.desired_deadline ?? entry.desired_deadline?.trim(),
      investment_range: entry.qualification?.investment_range ?? entry.investment_range?.trim(),
    },

    opportunity: {
      estimated_value: entry.opportunity?.estimated_value ?? entry.estimated_value ?? null,
      quote_value: entry.opportunity?.quote_value ?? null,
      closed_value: entry.opportunity?.closed_value ?? null,
      closing_probability: entry.opportunity?.closing_probability ?? 0,
      notes: entry.opportunity?.notes,
    },

    communication: {
      email: entry.communication?.email ?? entry.email?.trim(),
      phone: entry.communication?.phone ?? entry.phone?.trim(),
      whatsapp: entry.communication?.whatsapp ?? entry.whatsapp?.trim(),
      instagram: entry.communication?.instagram ?? entry.instagram?.trim(),
      current_site: entry.communication?.current_site ?? entry.current_site?.trim(),
      preferred_channel: entry.communication?.preferred_channel,
    },

    stages: Array.isArray(entry.stages) ? entry.stages : [],
    stage_completion: {} as Record<PipelineStage, StageCompletion>,

    // Historical data
    activities: Array.isArray(entry.activities) ? entry.activities : [],
    comments: Array.isArray(entry.comments) ? entry.comments : [],
    timeline: Array.isArray(entry.timeline) ? entry.timeline : [],
    briefing: entry.briefing ?? { ...EMPTY_BRIEFING },

    // Relationships
    proposal_ids: Array.isArray(entry.proposal_ids) ? entry.proposal_ids : [],
    project_ids: Array.isArray(entry.project_ids) ? entry.project_ids : [],
    client_id: entry.client_id ?? null,

    // Legacy fields for backward compatibility
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
    estimated_value: entry.opportunity?.estimated_value ?? entry.estimated_value ?? null,
    responsible: entry.responsible?.trim() ?? "",
    proposal_id: entry.proposal_id ?? null,
  }

  // Recompute completion from the sectioned data (source of truth)
  normalized.stage_completion = buildStageCompletion(normalized)
  normalized.completion_percentage =
    normalized.stage_completion[normalized.status_stage]?.completion_percentage ?? 0

  return normalized
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

// Create lead from quick form (< 15 seconds)
export function createLeadFromQuickForm(form: QuickLeadForm): LeadEntry {
  const now = new Date().toISOString()

  const entry = normalizeLead({
    status_stage: "lead",
    company: form.company,
    segment: form.segment,
    city: form.city,
    origin: form.origin,
    created_at: now,
    updated_at: now,
  })

  // Initialize stage entry
  entry.stages = [
    {
      stage: "lead",
      entered_at: now,
      exited_at: null,
      metadata: {
        company: form.company,
        segment: form.segment,
        city: form.city,
        origin: form.origin,
      },
    },
  ]

  entry.timeline = [buildTimelineEvent("created", `Lead criado para ${form.company}.`, now)]

  return entry
}

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
  const proposal_ids = lead.proposal_ids.includes(proposalId)
    ? lead.proposal_ids
    : [...lead.proposal_ids, proposalId]
  const updated = normalizeLead({
    ...lead,
    proposal_id: proposalId,
    proposal_ids,
    updated_at: now,
  })
  updated.timeline = [
    ...lead.timeline,
    buildTimelineEvent("proposal_linked", "Proposta comercial vinculada ao lead.", now),
  ]
  updated.comments = lead.comments
  updated.activities = lead.activities
  return updated
}

// Link a registered client to the lead (after converting it on the "client" stage).
export function linkClientToLead(lead: LeadEntry, clientId: string): LeadEntry {
  const now = new Date().toISOString()
  const updated = normalizeLead({ ...lead, client_id: clientId, updated_at: now })
  updated.timeline = [
    ...lead.timeline,
    buildTimelineEvent("stage_changed", "Lead convertido em cliente cadastrado.", now),
  ]
  updated.comments = lead.comments
  updated.activities = lead.activities
  return updated
}

// ─── Pipeline Stage Management ──────────────────────────────────────────────

// Move a lead to any stage (forward or backward), recording journey + timeline.
export function moveLeadToStage(lead: LeadEntry, toStage: PipelineStage): LeadEntry {
  const now = new Date().toISOString()
  const currentStage = lead.status_stage

  if (!PIPELINE_STAGES.includes(toStage) || toStage === currentStage) {
    return lead
  }

  const forward = PIPELINE_STAGES.indexOf(toStage) > PIPELINE_STAGES.indexOf(currentStage)

  const updated = normalizeLead({
    ...lead,
    status_stage: toStage,
    updated_at: now,
  })

  // Close the open stage entry
  updated.stages = lead.stages.map((s) =>
    s.stage === currentStage && s.exited_at === null
      ? {
          ...s,
          exited_at: now,
          duration_days: Math.floor(
            (new Date(now).getTime() - new Date(s.entered_at).getTime()) / 86400000
          ),
        }
      : s
  )

  // Open the new stage entry
  updated.stages.push({ stage: toStage, entered_at: now, exited_at: null })

  updated.timeline = [
    ...lead.timeline,
    buildTimelineEvent(
      "stage_changed",
      `Lead ${forward ? "avançou" : "retornou"} de "${PIPELINE_STAGE_LABEL[currentStage]}" para "${PIPELINE_STAGE_LABEL[toStage]}".`,
      now
    ),
  ]

  return updated
}

export function advanceLeadStage(lead: LeadEntry, toStage?: PipelineStage): LeadEntry {
  const next = toStage ?? getNextStage(lead)
  if (!next) return lead
  return moveLeadToStage(lead, next)
}

export function markLeadLost(lead: LeadEntry, reason = ""): LeadEntry {
  const now = new Date().toISOString()
  const updated = normalizeLead({
    ...lead,
    lost: true,
    lost_reason: reason,
    lost_at: now,
    updated_at: now,
  })
  updated.timeline = [
    ...lead.timeline,
    buildTimelineEvent(
      "stage_changed",
      reason ? `Lead marcado como perdido: ${reason}` : "Lead marcado como perdido.",
      now
    ),
  ]
  return updated
}

export function reopenLead(lead: LeadEntry): LeadEntry {
  const now = new Date().toISOString()
  const updated = normalizeLead({
    ...lead,
    lost: false,
    lost_reason: "",
    lost_at: null,
    updated_at: now,
  })
  updated.timeline = [
    ...lead.timeline,
    buildTimelineEvent("stage_changed", "Lead reaberto no pipeline.", now),
  ]
  return updated
}

export function getNextStage(lead: LeadEntry): PipelineStage | null {
  const currentIndex = PIPELINE_STAGES.indexOf(lead.status_stage)
  if (currentIndex >= 0 && currentIndex < PIPELINE_STAGES.length - 1) {
    return PIPELINE_STAGES[currentIndex + 1]
  }
  return null
}

export function getPrevStage(lead: LeadEntry): PipelineStage | null {
  const currentIndex = PIPELINE_STAGES.indexOf(lead.status_stage)
  if (currentIndex > 0) {
    return PIPELINE_STAGES[currentIndex - 1]
  }
  return null
}

export function canAdvanceStage(lead: LeadEntry): boolean {
  return getNextStage(lead) !== null
}

export function getStageCompletion(lead: LeadEntry, stage: PipelineStage): StageCompletion {
  return lead.stage_completion[stage] || {
    stage,
    fields_filled: [],
    total_fields: 0,
    completion_percentage: 0,
  }
}

export function updateQualification(lead: LeadEntry, data: Partial<QualificationData>): LeadEntry {
  const now = new Date().toISOString()
  const updated = normalizeLead({
    ...lead,
    qualification: {
      ...lead.qualification,
      ...data,
      qualified_at: data.qualified_at || lead.qualification.qualified_at || now,
    },
    updated_at: now,
  })

  updated.timeline = [
    ...lead.timeline,
    buildTimelineEvent("edited", "Informações de qualificação atualizadas.", now),
  ]

  return updated
}

export function updateOpportunity(lead: LeadEntry, data: Partial<OpportunityData>): LeadEntry {
  const now = new Date().toISOString()
  const updated = normalizeLead({
    ...lead,
    opportunity: {
      ...lead.opportunity,
      ...data,
      updated_at: now,
    },
    updated_at: now,
  })

  updated.timeline = [
    ...lead.timeline,
    buildTimelineEvent("edited", "Dados da oportunidade atualizados.", now),
  ]

  return updated
}

export function updateCommunication(lead: LeadEntry, data: Partial<CommunicationData>): LeadEntry {
  const now = new Date().toISOString()
  const updated = normalizeLead({
    ...lead,
    communication: {
      ...lead.communication,
      ...data,
    },
    updated_at: now,
  })

  return updated
}

// Apply edits to multiple sections at once, recording a single timeline event.
export function updateLeadSections(
  lead: LeadEntry,
  patch: {
    prospect?: Partial<ProspectData>
    qualification?: Partial<QualificationData>
    opportunity?: Partial<OpportunityData>
    communication?: Partial<CommunicationData>
  }
): LeadEntry {
  const now = new Date().toISOString()
  const updated = normalizeLead({
    ...lead,
    prospect: { ...lead.prospect, ...patch.prospect },
    qualification: { ...lead.qualification, ...patch.qualification },
    opportunity: { ...lead.opportunity, ...patch.opportunity, updated_at: now },
    communication: { ...lead.communication, ...patch.communication },
    updated_at: now,
  })

  updated.timeline = [
    ...lead.timeline,
    buildTimelineEvent("edited", "Dados do lead atualizados.", now),
  ]

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

// Pipeline-aware stats keyed on status_stage (the new source of truth).
// Lost leads are excluded from active counts and tracked separately.
export function computePipelineStats(leads: LeadEntry[]) {
  const now = new Date()
  const active = leads.filter((l) => !l.lost)
  const lost = leads.filter((l) => l.lost)

  const thisMonth = active.filter((l) => {
    const d = new Date(l.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const byStage = {} as Record<PipelineStage, number>
  for (const stage of PIPELINE_STAGES) {
    byStage[stage] = active.filter((l) => l.status_stage === stage).length
  }

  const clients = active.filter((l) => l.status_stage === "client")
  // Conversion = won vs. decided (won + lost)
  const decided = clients.length + lost.length
  const conversionRate = decided > 0 ? Math.round((clients.length / decided) * 100) : 0

  return {
    total: active.length,
    thisMonth: thisMonth.length,
    byStage,
    clients: clients.length,
    lost: lost.length,
    conversionRate,
  }
}
