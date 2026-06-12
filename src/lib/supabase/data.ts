"use client"

import { createClient } from "@/lib/supabase/client"
import type { LeadEntry } from "@/lib/crm/store"
import type { ProposalEntry } from "@/lib/proposals/store"
import type { ClientEntry } from "@/lib/clients/store"
import type { ProjectEntry, WorkspaceTab } from "@/lib/projects/store"

// ─── Leads ────────────────────────────────────────────────────────────────────

function leadToRow(lead: LeadEntry): Record<string, unknown> {
  return {
    id: lead.id,
    status_stage: lead.status_stage,
    status: lead.status,
    lost: lead.lost,
    lost_reason: lead.lost_reason,
    lost_at: lead.lost_at,
    completion_percentage: lead.completion_percentage,
    company: lead.prospect?.company ?? lead.company ?? "",
    segment: lead.prospect?.segment ?? lead.segment ?? "",
    city: lead.prospect?.city ?? lead.city ?? "",
    state: lead.prospect?.state ?? lead.state ?? "",
    origin: lead.prospect?.origin ?? lead.origin ?? "",
    client_id: lead.client_id ?? null,
    prospect: lead.prospect ?? {},
    qualification: lead.qualification ?? {},
    opportunity: lead.opportunity ?? {},
    communication: lead.communication ?? {},
    stage_completion: lead.stage_completion ?? {},
    stages: lead.stages ?? [],
    activities: lead.activities ?? [],
    comments: lead.comments ?? [],
    timeline: lead.timeline ?? [],
    briefing: lead.briefing ?? {},
    proposal_ids: lead.proposal_ids ?? [],
    project_ids: lead.project_ids ?? [],
    name: lead.qualification?.contact_name ?? lead.name ?? "",
    email: lead.qualification?.email ?? lead.email ?? "",
    phone: lead.qualification?.phone ?? lead.phone ?? "",
    whatsapp: lead.communication?.whatsapp ?? lead.whatsapp ?? "",
    instagram: lead.communication?.instagram ?? lead.instagram ?? "",
    project_type: lead.qualification?.project_type ?? lead.project_type ?? "",
    project_objective: lead.qualification?.project_objective ?? lead.project_objective ?? "",
    desired_deadline: lead.qualification?.desired_deadline ?? lead.desired_deadline ?? "",
    investment_range: lead.qualification?.investment_range ?? lead.investment_range ?? "",
    estimated_value: lead.opportunity?.estimated_value ?? lead.estimated_value ?? null,
    responsible: lead.responsible ?? "",
    proposal_id: lead.proposal_id ?? null,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
  }
}

// ─── Proposals ────────────────────────────────────────────────────────────────

function proposalToRow(p: ProposalEntry): Record<string, unknown> {
  return {
    id: p.id,
    title: p.title,
    client_id: p.clientId,
    client_name: p.clientName,
    project_id: p.projectId,
    lead_id: p.leadId,
    proposal_date: p.proposalDate,
    valid_until: p.validUntil,
    objective: p.objective,
    scope: p.scope,
    estimated_deadline: p.estimatedDeadline,
    total_value: p.totalValue,
    entry_mode: p.entryMode,
    entry_value: p.entryValue,
    payment_method: p.paymentMethod,
    is_partnership: p.isPartnership,
    included: p.included,
    not_included: p.notIncluded,
    notes: p.notes,
    status: p.status,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }
}

export function rowToProposal(row: Record<string, unknown>): Partial<ProposalEntry> {
  return {
    id: row.id as string,
    title: row.title as string,
    clientId: (row.client_id as string | null) ?? null,
    clientName: (row.client_name as string) ?? "",
    projectId: (row.project_id as string | null) ?? null,
    leadId: (row.lead_id as string | null) ?? null,
    proposalDate: (row.proposal_date as string) ?? "",
    validUntil: (row.valid_until as string) ?? "",
    objective: (row.objective as string) ?? "",
    scope: (row.scope as ProposalEntry["scope"]) ?? [],
    estimatedDeadline: (row.estimated_deadline as string) ?? "",
    totalValue: (row.total_value as number) ?? 0,
    entryMode: (row.entry_mode as ProposalEntry["entryMode"]) ?? "percent",
    entryValue: (row.entry_value as number) ?? 0,
    paymentMethod: (row.payment_method as string) ?? "",
    isPartnership: (row.is_partnership as boolean) ?? false,
    included: (row.included as string[]) ?? [],
    notIncluded: (row.not_included as string[]) ?? [],
    notes: (row.notes as string | null) ?? null,
    status: (row.status as ProposalEntry["status"]) ?? "draft",
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

// ─── Clients ─────────────────────────────────────────────────────────────────

function clientToRow(c: ClientEntry): Record<string, unknown> {
  return {
    id: c.id,
    lead_id: c.leadId,
    proposal_id: c.proposalId,
    name: c.name,
    company: c.company,
    phone: c.phone,
    whatsapp: c.whatsapp,
    email: c.email,
    status: c.status,
    project_id: c.projectId,
    project_name: c.projectName,
    project_type: c.projectType,
    project_start_date: c.projectStartDate,
    project_delivery_date: c.projectDeliveryDate,
    contracted_value: c.contractedValue,
    published_site_url: c.publishedSiteUrl,
    plan: c.plan,
    plan_started_at: c.planStartedAt,
    monthly_value: c.monthlyValue,
    warranty_delivery_date: c.warrantyDeliveryDate,
    warranty_days: c.warrantyDays,
    entry_date: c.entryDate,
    delivery: c.delivery,
    checklist: c.checklist,
    requests: c.requests,
    opportunities: c.opportunities,
    comments: c.comments,
    timeline: c.timeline,
    created_at: c.created_at,
  }
}

export function rowToClient(row: Record<string, unknown>): Partial<ClientEntry> {
  return {
    id: row.id as string,
    leadId: (row.lead_id as string | null) ?? null,
    proposalId: (row.proposal_id as string | null) ?? null,
    name: (row.name as string) ?? "",
    company: (row.company as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    whatsapp: (row.whatsapp as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    status: (row.status as ClientEntry["status"]) ?? "active",
    projectId: (row.project_id as string | null) ?? null,
    projectName: (row.project_name as string) ?? "",
    projectType: (row.project_type as string) ?? "",
    projectStartDate: (row.project_start_date as string) ?? "",
    projectDeliveryDate: (row.project_delivery_date as string) ?? "",
    contractedValue: (row.contracted_value as number) ?? 0,
    publishedSiteUrl: (row.published_site_url as string) ?? "",
    plan: (row.plan as ClientEntry["plan"]) ?? "none",
    planStartedAt: (row.plan_started_at as string) ?? "",
    monthlyValue: (row.monthly_value as number) ?? 0,
    warrantyDeliveryDate: (row.warranty_delivery_date as string) ?? "",
    warrantyDays: (row.warranty_days as number) ?? 0,
    entryDate: (row.entry_date as string) ?? "",
    delivery: row.delivery as ClientEntry["delivery"],
    checklist: (row.checklist as ClientEntry["checklist"]) ?? [],
    requests: (row.requests as ClientEntry["requests"]) ?? [],
    opportunities: (row.opportunities as ClientEntry["opportunities"]) ?? [],
    comments: (row.comments as ClientEntry["comments"]) ?? [],
    timeline: (row.timeline as ClientEntry["timeline"]) ?? [],
    created_at: row.created_at as string,
  }
}

// ─── Projects ─────────────────────────────────────────────────────────────────

function projectToRow(p: ProjectEntry, workspace: string): Record<string, unknown> {
  return {
    id: p.id,
    workspace,
    name: p.name,
    client_id: p.clientId ?? null,
    client_name: p.clientName ?? null,
    description: p.description,
    status: p.status,
    value: p.value,
    observations: p.observations,
    billing_date: p.billing_date,
    started_at: p.started_at,
    ended_at: p.ended_at,
    stack: p.stack ?? [],
    payments: p.payments ?? [],
    links: p.links ?? [],
    timeline: p.timeline ?? [],
    created_at: p.created_at ?? new Date().toISOString(),
    updated_at: p.updated_at ?? new Date().toISOString(),
  }
}

export function rowToProject(row: Record<string, unknown>): ProjectEntry {
  return {
    id: row.id as string,
    name: (row.name as string) ?? "",
    clientId: (row.client_id as string | null) ?? null,
    clientName: (row.client_name as string | undefined) ?? undefined,
    description: (row.description as string | null) ?? null,
    status: row.status as ProjectEntry["status"],
    value: (row.value as number | null) ?? null,
    observations: (row.observations as string | null) ?? null,
    billing_date: (row.billing_date as string | null) ?? null,
    started_at: (row.started_at as string | null) ?? null,
    ended_at: (row.ended_at as string | null) ?? null,
    stack: (row.stack as string[]) ?? [],
    payments: (row.payments as ProjectEntry["payments"]) ?? [],
    links: (row.links as ProjectEntry["links"]) ?? [],
    timeline: (row.timeline as ProjectEntry["timeline"]) ?? [],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

// ─── Sync helpers ─────────────────────────────────────────────────────────────

async function syncTable(
  table: string,
  ids: string[],
  rows: Record<string, unknown>[]
) {
  const supabase = createClient()

  if (rows.length > 0) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" })
    if (error) console.error(`[supabase] upsert ${table}:`, error.message)
  }

  if (ids.length === 0) {
    await supabase.from(table).delete().not("id", "is", null)
  } else {
    await supabase.from(table).delete().not("id", "in", `(${ids.join(",")})`)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function syncLeadsToSupabase(data: LeadEntry[]) {
  await syncTable("leads", data.map((l) => l.id), data.map(leadToRow))
}

export async function syncProposalsToSupabase(data: ProposalEntry[]) {
  await syncTable("proposals", data.map((p) => p.id), data.map(proposalToRow))
}

export async function syncClientsToSupabase(data: ClientEntry[]) {
  await syncTable("clients", data.map((c) => c.id), data.map(clientToRow))
}

export async function syncProjectsToSupabase(data: Record<WorkspaceTab, ProjectEntry[]>) {
  const rows: Record<string, unknown>[] = []
  const ids: string[] = []
  for (const [workspace, projects] of Object.entries(data)) {
    for (const p of projects) {
      ids.push(p.id)
      rows.push(projectToRow(p, workspace))
    }
  }
  await syncTable("projects", ids, rows)
}

export async function fetchAllFromSupabase() {
  const supabase = createClient()
  const [leadsResult, proposalsResult, clientsResult, projectsResult] = await Promise.all([
    supabase.from("leads").select("*"),
    supabase.from("proposals").select("*"),
    supabase.from("clients").select("*"),
    supabase.from("projects").select("*"),
  ])

  const leadsData = (leadsResult.data ?? []) as Partial<LeadEntry>[]
  const proposalsData = (proposalsResult.data ?? []).map((r) => rowToProposal(r as Record<string, unknown>))
  const clientsData = (clientsResult.data ?? []).map((r) => rowToClient(r as Record<string, unknown>))

  const projectsData: Record<WorkspaceTab, ProjectEntry[]> = {
    freelancer: [],
    professional: [],
    personal: [],
  }
  for (const row of projectsResult.data ?? []) {
    const r = row as Record<string, unknown>
    const ws = r.workspace as WorkspaceTab
    if (projectsData[ws]) projectsData[ws].push(rowToProject(r))
  }

  return {
    leads: leadsData,
    proposals: proposalsData,
    clients: clientsData,
    projects: projectsData,
  }
}
