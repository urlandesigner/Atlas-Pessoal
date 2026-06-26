import type { ClientEntry } from "@/lib/clients/store"
import type { LeadEntry } from "@/lib/crm/store"
import {
  EMPTY_PROPOSAL_FORM,
  getDefaultProposalDate,
  getProposalAddonOptions,
  getProposalDisplayTotal,
  getProposalValidUntil,
  type ProposalEntry,
  type ProposalForm,
} from "@/lib/proposals/store"

import type { PeriodFilter } from "./constants"

export function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Sem data"
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatAddonPrice(price: number, firstYearFree: boolean, withPlus = false) {
  if (firstYearFree) return "Gratuito (1º ano)"
  const value = money(price)
  return withPlus ? `+ ${value}` : value
}

export function getResolvedTotal(form: ProposalForm | ProposalEntry) {
  const rawTotal = typeof form.totalValue === "number" ? form.totalValue : parseNumber(form.totalValue)
  const options = getProposalAddonOptions(form)
  return getProposalDisplayTotal(form.isPartnership, rawTotal, form.included, options)
}

export function getEntryValue(form: ProposalForm | ProposalEntry) {
  const total = getResolvedTotal(form)
  const entry = typeof form.entryValue === "number" ? form.entryValue : parseNumber(form.entryValue)
  return form.entryMode === "percent" ? (total * entry) / 100 : entry
}

export function getRemainingValue(form: ProposalForm | ProposalEntry) {
  return Math.max(getResolvedTotal(form) - getEntryValue(form), 0)
}

export function isInPeriod(dateValue: string, period: PeriodFilter) {
  if (period === "all") return true
  const date = new Date(`${dateValue.slice(0, 10)}T00:00:00`)
  const now = new Date()

  if (period === "month") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }
  if (period === "year") return date.getFullYear() === now.getFullYear()

  const diff = now.getTime() - date.getTime()
  return diff <= 90 * 86400000
}

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

export function buildProposalFormFromLead(lead: LeadEntry): ProposalForm {
  const clientName =
    lead.prospect.company || lead.qualification.contact_name?.trim() || lead.name?.trim() || ""
  const proposalDate = getDefaultProposalDate()
  return {
    ...EMPTY_PROPOSAL_FORM,
    leadId: lead.id,
    clientId: lead.client_id ?? "",
    clientName,
    title: "",
    objective: lead.qualification.project_objective?.trim() || "",
    totalValue: lead.opportunity.estimated_value ? String(lead.opportunity.estimated_value) : "",
    proposalDate,
    validUntil: getProposalValidUntil(proposalDate),
  }
}

export function buildProposalFormFromClient(client: ClientEntry): ProposalForm {
  const clientName = client.company || client.name || ""
  const proposalDate = getDefaultProposalDate()
  return {
    ...EMPTY_PROPOSAL_FORM,
    leadId: client.leadId ?? "",
    clientId: client.id,
    clientName,
    title: "",
    objective: client.projectName?.trim() || "",
    totalValue: client.contractedValue ? String(client.contractedValue) : "",
    proposalDate,
    validUntil: getProposalValidUntil(proposalDate),
  }
}
