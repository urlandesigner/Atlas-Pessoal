"use client"

import type { ProjectStatus } from "@/types"

export type WorkspaceTab = "professional" | "personal" | "freelancer"
export type ProjectPriority = "low" | "medium" | "high"
export type TimelineEventType =
  | "created"
  | "edited"
  | "payment"
  | "status"
  | "deploy"
  | "update"
  | "observation"

export interface PaymentEntry {
  id: string
  date: string
  amount: number
  type: "income" | "expense"
  notes: string | null
}

export interface ProjectLinkEntry {
  label: string
  url: string
}

export interface ProjectTimelineEntry {
  id: string
  type: TimelineEventType
  description: string
  created_at: string
  user_name: string
}

export interface ProjectEntry {
  id: string
  name: string
  clientId?: string | null
  clientName?: string
  description: string | null
  status: ProjectStatus
  stack: string[]
  value: number | null
  observations: string | null
  billing_date: string | null
  payments: PaymentEntry[]
  started_at: string | null
  ended_at: string | null
  created_at?: string
  updated_at?: string
  timeline?: ProjectTimelineEntry[]
  links: ProjectLinkEntry[]
}

export interface ProjectForm {
  name: string
  description: string
  status: ProjectStatus
  stack: string
  started_at: string
  clientId: string
  clientName: string
  value: string
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Ativo",
  not_started: "Não iniciado",
  paused: "Pausado",
  closed: "Concluído",
  inactive: "Cancelado",
}

export const STATUS_OPTIONS: ProjectStatus[] = ["not_started", "active", "paused", "closed", "inactive"]

export const TAB_LABEL: Record<WorkspaceTab, string> = {
  professional: "Profissional",
  personal: "Pessoal",
  freelancer: "Freelancer",
}

export const EMPTY_FORM: ProjectForm = {
  name: "",
  description: "",
  status: "active",
  stack: "",
  started_at: "",
  clientId: "",
  clientName: "",
  value: "",
}

const SEED: Record<WorkspaceTab, ProjectEntry[]> = {
  professional: [
    { id: "p1", name: "YberaTech", description: null, status: "active", stack: [], value: null, observations: null, billing_date: null, payments: [], started_at: null, ended_at: null, links: [] },
    { id: "p2", name: "Design System (Kaizen)", description: null, status: "active", stack: [], value: null, observations: null, billing_date: null, payments: [], started_at: null, ended_at: null, links: [] },
    { id: "p3", name: "Ybera PRO", description: null, status: "active", stack: [], value: null, observations: null, billing_date: null, payments: [], started_at: null, ended_at: null, links: [] },
    { id: "p4", name: "Report Tech", description: null, status: "active", stack: [], value: null, observations: null, billing_date: null, payments: [], started_at: null, ended_at: null, links: [] },
    { id: "p5", name: "Dashboard de Metas", description: null, status: "active", stack: [], value: null, observations: null, billing_date: null, payments: [], started_at: null, ended_at: null, links: [] },
    { id: "p6", name: "Loja interna Ybera", description: null, status: "active", stack: [], value: null, observations: null, billing_date: null, payments: [], started_at: null, ended_at: null, links: [] },
    { id: "p7", name: "Site Ybera", description: null, status: "active", stack: [], value: null, observations: null, billing_date: null, payments: [], started_at: null, ended_at: null, links: [] },
  ],
  personal: [
    { id: "pe1", name: "MyCofre", description: null, status: "active", stack: [], value: null, observations: null, billing_date: null, payments: [], started_at: null, ended_at: null, links: [] },
    { id: "pe2", name: "Condominio", description: null, status: "active", stack: [], value: null, observations: null, billing_date: null, payments: [], started_at: null, ended_at: null, links: [] },
    { id: "pe3", name: "Mensageiro do Bem", description: null, status: "active", stack: [], value: null, observations: null, billing_date: null, payments: [], started_at: null, ended_at: null, links: [] },
    { id: "pe4", name: "Site UrlanDipre", description: null, status: "active", stack: [], value: null, observations: null, billing_date: null, payments: [], started_at: null, ended_at: null, links: [] },
  ],
  freelancer: [
    { id: "f1", name: "Site Dra. Beatriz", clientId: null, clientName: "Dra. Beatriz", description: null, status: "active", stack: [], value: 290, observations: "Valores referentes a hospedagem e domínio anual.", billing_date: null, payments: [], started_at: null, ended_at: null, links: [] },
    { id: "f2", name: "Site Dr. Doglas", clientId: null, clientName: "Dr. Doglas", description: null, status: "active", stack: [], value: null, observations: null, billing_date: null, payments: [], started_at: null, ended_at: null, links: [] },
    { id: "f3", name: "Compropay", description: null, status: "active", stack: [], value: null, observations: null, billing_date: null, payments: [], started_at: null, ended_at: null, links: [] },
  ],
}

export const STORAGE_KEY = "atlas_projects"
export const PROJECTS_STORAGE_EVENT = "atlas-projects-change"
const DEFAULT_PROJECT_DATE = "2026-01-01T00:00:00.000Z"

let cachedProjectsRaw: string | null | undefined
let cachedProjectsSnapshot: Record<WorkspaceTab, ProjectEntry[]> | null = null

export function createTimelineEvent(
  type: TimelineEventType,
  description: string,
  createdAt = new Date().toISOString(),
  userName = "Você"
): ProjectTimelineEntry {
  return {
    id: crypto.randomUUID(),
    type,
    description,
    created_at: createdAt,
    user_name: userName,
  }
}

function getStatusLabel(status: ProjectStatus) {
  return STATUS_LABEL[status]
}

function buildInitialTimeline(project: ProjectEntry) {
  const baseCreatedAt = project.created_at ?? project.started_at ?? project.updated_at ?? DEFAULT_PROJECT_DATE
  const events: ProjectTimelineEntry[] = [
    {
      id: `${project.id}-created`,
      type: "created",
      description: "Projeto criado e incorporado ao workspace.",
      created_at: baseCreatedAt,
      user_name: "Você",
    },
  ]

  if (project.status !== "active") {
    events.push(
      {
        id: `${project.id}-status-initial`,
        type: "status",
        description: `Status inicial definido como ${getStatusLabel(project.status)}.`,
        created_at: project.updated_at ?? baseCreatedAt,
        user_name: "Você",
      }
    )
  }

  if (project.observations) {
    events.push(
      {
        id: `${project.id}-observation-initial`,
        type: "observation",
        description: "Observações iniciais registradas no projeto.",
        created_at: project.updated_at ?? baseCreatedAt,
        user_name: "Você",
      }
    )
  }

  for (const payment of project.payments ?? []) {
    const prefix = payment.type === "expense" ? "Despesa registrada" : "Pagamento registrado"
    const suffix = payment.notes ? ` (${payment.notes})` : ""
    events.push(
      {
        id: `${project.id}-payment-${payment.id}`,
        type: "payment",
        description: `${prefix} de ${payment.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}${suffix}.`,
        created_at: payment.date,
        user_name: "Você",
      }
    )
  }

  if ((project.updated_at ?? baseCreatedAt) !== baseCreatedAt) {
    events.push(
      {
        id: `${project.id}-edited-initial`,
        type: "edited",
        description: "Detalhes principais do projeto foram atualizados.",
        created_at: project.updated_at ?? baseCreatedAt,
        user_name: "Você",
      }
    )
  }

  return events.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function normalizeProjectForWorkspace(workspace: WorkspaceTab, project: ProjectEntry): ProjectEntry {
  const created_at = project.created_at ?? project.started_at ?? project.updated_at ?? DEFAULT_PROJECT_DATE
  const updated_at = project.updated_at ?? created_at

  return {
    ...project,
    clientId: workspace === "freelancer" ? (project.clientId ?? null) : null,
    clientName: workspace === "freelancer" ? project.clientName : undefined,
    value: workspace === "freelancer" ? project.value : null,
    billing_date: workspace === "freelancer" ? project.billing_date : null,
    created_at,
    updated_at,
    timeline: project.timeline?.length
      ? [...project.timeline].sort((a, b) => b.created_at.localeCompare(a.created_at))
      : buildInitialTimeline({ ...project, created_at, updated_at }),
  }
}

function mergeWithSeed(stored: Record<WorkspaceTab, ProjectEntry[]>): Record<WorkspaceTab, ProjectEntry[]> {
  const result = {} as Record<WorkspaceTab, ProjectEntry[]>
  for (const tab of Object.keys(SEED) as WorkspaceTab[]) {
    const storedList = stored[tab] ?? []
    result[tab] = storedList.map((storedProject) => {
      const seedProject = SEED[tab].find((s) => s.id === storedProject.id)
      if (!seedProject) return normalizeProjectForWorkspace(tab, storedProject)

      const merged = { ...storedProject }
      for (const key of Object.keys(seedProject) as (keyof ProjectEntry)[]) {
        if ((merged[key] === null || merged[key] === undefined) && seedProject[key] != null) {
          ;(merged as ProjectEntry)[key] = seedProject[key] as never
        }
      }
      return normalizeProjectForWorkspace(tab, merged)
    })
  }
  return result
}

function buildDefaultProjects(): Record<WorkspaceTab, ProjectEntry[]> {
  const result = {} as Record<WorkspaceTab, ProjectEntry[]>
  for (const tab of Object.keys(SEED) as WorkspaceTab[]) {
    result[tab] = SEED[tab].map((project) => normalizeProjectForWorkspace(tab, project))
  }
  return result
}

export const DEFAULT_PROJECTS = buildDefaultProjects()

export function getProjectsServerSnapshot(): Record<WorkspaceTab, ProjectEntry[]> {
  return DEFAULT_PROJECTS
}

export function getProjectsSnapshot(): Record<WorkspaceTab, ProjectEntry[]> {
  if (typeof window === "undefined") return DEFAULT_PROJECTS

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === cachedProjectsRaw && cachedProjectsSnapshot) return cachedProjectsSnapshot

    const snapshot = raw ? mergeWithSeed(JSON.parse(raw)) : DEFAULT_PROJECTS
    cachedProjectsRaw = raw
    cachedProjectsSnapshot = snapshot
    return snapshot
  } catch {
    cachedProjectsRaw = null
    cachedProjectsSnapshot = DEFAULT_PROJECTS
    return DEFAULT_PROJECTS
  }
}

export function saveProjects(data: Record<WorkspaceTab, ProjectEntry[]>) {
  if (typeof window === "undefined") return
  const raw = JSON.stringify(data)
  localStorage.setItem(STORAGE_KEY, raw)
  cachedProjectsRaw = raw
  cachedProjectsSnapshot = data
}

export function emitProjectsChange() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(PROJECTS_STORAGE_EVENT))
}

export function subscribeProjectsStore(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== STORAGE_KEY) return
    onStoreChange()
  }

  const handleProjectsChange = () => onStoreChange()

  window.addEventListener("storage", handleStorage)
  window.addEventListener(PROJECTS_STORAGE_EVENT, handleProjectsChange)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(PROJECTS_STORAGE_EVENT, handleProjectsChange)
  }
}

export function createProjectPath(workspace: WorkspaceTab, projectId: string) {
  return `/projects/${workspace}/${projectId}`
}

export function isWorkspaceTab(value: string): value is WorkspaceTab {
  return value === "professional" || value === "personal" || value === "freelancer"
}

export function createProjectFromForm(workspace: WorkspaceTab, form: ProjectForm): ProjectEntry {
  const now = new Date().toISOString()
  return normalizeProjectForWorkspace(workspace, {
    id: crypto.randomUUID(),
    name: form.name.trim(),
    clientId: workspace === "freelancer" ? (form.clientId || null) : null,
    clientName: workspace === "freelancer" ? (form.clientName.trim() || undefined) : undefined,
    description: form.description.trim() || null,
    status: form.status,
    stack: form.stack
      ? form.stack.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    value: workspace === "freelancer" && form.value ? parseFloat(form.value) : null,
    observations: null,
    billing_date: null,
    payments: [],
    started_at: form.started_at || null,
    ended_at: null,
    created_at: now,
    updated_at: now,
    timeline: [createTimelineEvent("created", "Projeto criado e pronto para acompanhamento.", now)],
    links: [],
  })
}

export function updateProjectInCollection(
  allProjects: Record<WorkspaceTab, ProjectEntry[]>,
  workspace: WorkspaceTab,
  updated: ProjectEntry
) {
  return {
    ...allProjects,
    [workspace]: allProjects[workspace].map((project) =>
      project.id === updated.id ? normalizeProjectForWorkspace(workspace, updated) : project
    ),
  }
}

export function addProjectToCollection(
  allProjects: Record<WorkspaceTab, ProjectEntry[]>,
  workspace: WorkspaceTab,
  entry: ProjectEntry
) {
  return {
    ...allProjects,
    [workspace]: [...allProjects[workspace], entry],
  }
}

export function findProject(
  allProjects: Record<WorkspaceTab, ProjectEntry[]>,
  workspace: WorkspaceTab,
  projectId: string
) {
  return allProjects[workspace].find((project) => project.id === projectId) ?? null
}
