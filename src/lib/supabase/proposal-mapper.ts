import type { ProposalEntry } from "@/lib/proposals/store"

export function proposalToRow(p: ProposalEntry): Record<string, unknown> {
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
    domain_first_year_free: p.domainFirstYearFree,
    hosting_first_year_free: p.hostingFirstYearFree,
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
    domainFirstYearFree: (row.domain_first_year_free as boolean) ?? false,
    hostingFirstYearFree: (row.hosting_first_year_free as boolean) ?? false,
    included: (row.included as string[]) ?? [],
    notIncluded: (row.not_included as string[]) ?? [],
    notes: (row.notes as string | null) ?? null,
    status: (row.status as ProposalEntry["status"]) ?? "draft",
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}
