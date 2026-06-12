// One-shot migration: .atlas/local-data.json → Supabase
// Run: node scripts/migrate-to-supabase.mjs
import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=")
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data } = JSON.parse(
  readFileSync(new URL("../.atlas/local-data.json", import.meta.url), "utf8")
)

const leads = data.atlas_crm_leads ?? []
const proposals = data.atlas_proposals ?? []
const clients = data.atlas_clients ?? []
const projectsByWs = data.atlas_projects ?? {}

// ─── Mappers (mirror src/lib/supabase/data.ts) ──────────────────────────────

const leadRow = (l) => ({
  id: l.id,
  status_stage: l.status_stage ?? "lead",
  status: l.status ?? "new",
  lost: l.lost ?? false,
  lost_reason: l.lost_reason ?? "",
  lost_at: l.lost_at ?? null,
  completion_percentage: l.completion_percentage ?? 0,
  company: l.prospect?.company ?? l.company ?? "",
  segment: l.prospect?.segment ?? l.segment ?? "",
  city: l.prospect?.city ?? l.city ?? "",
  state: l.prospect?.state ?? l.state ?? "",
  origin: l.prospect?.origin ?? l.origin ?? "",
  client_id: l.client_id ?? null,
  prospect: l.prospect ?? {},
  qualification: l.qualification ?? {},
  opportunity: l.opportunity ?? {},
  communication: l.communication ?? {},
  stage_completion: l.stage_completion ?? {},
  stages: l.stages ?? [],
  activities: l.activities ?? [],
  comments: l.comments ?? [],
  timeline: l.timeline ?? [],
  briefing: l.briefing ?? {},
  proposal_ids: l.proposal_ids ?? [],
  project_ids: l.project_ids ?? [],
  name: l.qualification?.contact_name ?? l.name ?? "",
  email: l.qualification?.email ?? l.email ?? "",
  phone: l.qualification?.phone ?? l.phone ?? "",
  whatsapp: l.communication?.whatsapp ?? l.whatsapp ?? "",
  instagram: l.communication?.instagram ?? l.instagram ?? "",
  project_type: l.qualification?.project_type ?? l.project_type ?? "",
  project_objective: l.qualification?.project_objective ?? l.project_objective ?? "",
  desired_deadline: l.qualification?.desired_deadline ?? l.desired_deadline ?? "",
  investment_range: l.qualification?.investment_range ?? l.investment_range ?? "",
  estimated_value: l.opportunity?.estimated_value ?? l.estimated_value ?? null,
  responsible: l.responsible ?? "",
  proposal_id: l.proposal_id ?? null,
  created_at: l.created_at,
  updated_at: l.updated_at,
})

const proposalRow = (p) => ({
  id: p.id,
  title: p.title ?? "",
  client_id: p.clientId ?? null,
  client_name: p.clientName ?? "",
  project_id: p.projectId ?? null,
  lead_id: p.leadId ?? null,
  proposal_date: p.proposalDate ?? "",
  valid_until: p.validUntil ?? "",
  objective: p.objective ?? "",
  scope: p.scope ?? [],
  estimated_deadline: p.estimatedDeadline ?? "",
  total_value: p.totalValue ?? 0,
  entry_mode: p.entryMode ?? "percent",
  entry_value: p.entryValue ?? 0,
  payment_method: p.paymentMethod ?? "",
  is_partnership: p.isPartnership ?? false,
  included: p.included ?? [],
  not_included: p.notIncluded ?? [],
  notes: p.notes ?? null,
  status: p.status ?? "draft",
  created_at: p.created_at,
  updated_at: p.updated_at,
})

const clientRow = (c) => ({
  id: c.id,
  lead_id: c.leadId ?? null,
  proposal_id: c.proposalId ?? null,
  name: c.name ?? "",
  company: c.company ?? null,
  phone: c.phone ?? null,
  whatsapp: c.whatsapp ?? null,
  email: c.email ?? null,
  status: c.status ?? "active",
  project_id: c.projectId ?? null,
  project_name: c.projectName ?? "",
  project_type: c.projectType ?? "",
  project_start_date: c.projectStartDate ?? "",
  project_delivery_date: c.projectDeliveryDate ?? "",
  contracted_value: c.contractedValue ?? 0,
  published_site_url: c.publishedSiteUrl ?? "",
  plan: c.plan ?? "none",
  plan_started_at: c.planStartedAt ?? "",
  monthly_value: c.monthlyValue ?? 0,
  warranty_delivery_date: c.warrantyDeliveryDate ?? "",
  warranty_days: c.warrantyDays ?? 0,
  entry_date: c.entryDate ?? "",
  delivery: c.delivery ?? {},
  checklist: c.checklist ?? [],
  requests: c.requests ?? [],
  opportunities: c.opportunities ?? [],
  comments: c.comments ?? [],
  timeline: c.timeline ?? [],
  created_at: c.created_at,
})

const projectRow = (p, workspace) => ({
  id: p.id,
  workspace,
  name: p.name ?? "",
  client_id: p.clientId ?? null,
  client_name: p.clientName ?? null,
  description: p.description ?? null,
  status: p.status,
  value: p.value ?? null,
  observations: p.observations ?? null,
  billing_date: p.billing_date ?? null,
  started_at: p.started_at ?? null,
  ended_at: p.ended_at ?? null,
  stack: p.stack ?? [],
  payments: p.payments ?? [],
  links: p.links ?? [],
  timeline: p.timeline ?? [],
  created_at: p.created_at ?? new Date().toISOString(),
  updated_at: p.updated_at ?? new Date().toISOString(),
})

// ─── Run ────────────────────────────────────────────────────────────────────

async function upsert(table, rows) {
  if (!rows.length) {
    console.log(`  ${table}: nada para migrar`)
    return
  }
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" })
  if (error) {
    console.error(`  ✗ ${table}:`, error.message)
    process.exitCode = 1
  } else {
    console.log(`  ✓ ${table}: ${rows.length} registros`)
  }
}

const projectRows = Object.entries(projectsByWs).flatMap(([ws, arr]) =>
  (arr ?? []).map((p) => projectRow(p, ws))
)

console.log("Migrando para Supabase...")
await upsert("leads", leads.map(leadRow))
await upsert("proposals", proposals.map(proposalRow))
await upsert("clients", clients.map(clientRow))
await upsert("projects", projectRows)
console.log("Concluído.")
