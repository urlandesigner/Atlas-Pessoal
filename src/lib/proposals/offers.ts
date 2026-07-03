import type { ProposalEntry, ProposalForm } from "@/lib/proposals/store"
import {
  getProposalAddonOptions,
  getProposalDevelopmentTotal,
  getProposalDisplayTotal,
  normalizeProposalEntry,
} from "@/lib/proposals/store"

export type ProposalOfferSource = Pick<
  ProposalEntry,
  | "isPartnership"
  | "totalValue"
  | "included"
  | "domainFirstYearFree"
  | "hostingFirstYearFree"
  | "baselineTotalValue"
  | "discountPercent"
  | "offerRevision"
>

export type ProposalOfferInput = ProposalOfferSource | ProposalForm

function asOfferNumber(value: string | number | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value ?? "").replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
}

function coerceOfferSource(source: ProposalOfferInput): ProposalOfferSource {
  return {
    isPartnership: Boolean(source.isPartnership),
    totalValue: asOfferNumber(source.totalValue),
    included: source.included ?? [],
    domainFirstYearFree: Boolean(source.domainFirstYearFree),
    hostingFirstYearFree: Boolean(source.hostingFirstYearFree),
    baselineTotalValue: asOfferNumber(source.baselineTotalValue),
    discountPercent: asOfferNumber(source.discountPercent),
    offerRevision: asOfferNumber(source.offerRevision),
  }
}

export function hasActiveProposalOffer(
  source: Partial<
    Pick<ProposalEntry, "discountPercent" | "offerRevision" | "baselineTotalValue" | "totalValue">
  >
) {
  const discount = asOfferNumber(source.discountPercent)
  const revision = asOfferNumber(source.offerRevision)
  const baseline = asOfferNumber(source.baselineTotalValue)
  const total = asOfferNumber(source.totalValue)

  if (discount > 0 && revision > 0) return true
  if (discount > 0 && baseline > total + 0.009) return true
  return false
}

export function getProposalOfferDiscountAmount(source: ProposalOfferInput) {
  const pricing = getProposalOfferPricing(source)
  if (!pricing.hasOffer) return 0
  return Math.max(pricing.baseline - pricing.displayTotal, 0)
}

export function getProposalListDevelopmentTotal(source: ProposalOfferInput) {
  const pricing = getProposalOfferPricing(source)
  const normalized = coerceOfferSource(source)
  const listTotal = pricing.hasOffer ? pricing.baseline : normalized.totalValue

  return getProposalDevelopmentTotal(
    normalized.isPartnership,
    listTotal,
    normalized.included,
    pricing.addonOptions
  )
}

export function calculateDiscountedTotal(baseline: number, discountPercent: number) {
  const discount = Math.min(Math.max(discountPercent, 0), 100)
  return Math.round(baseline * (1 - discount / 100) * 100) / 100
}

export function getProposalBaselineTotal(source: ProposalOfferInput) {
  const normalized = coerceOfferSource(source)
  if (normalized.baselineTotalValue > 0) return normalized.baselineTotalValue
  const addonOptions = getProposalAddonOptions(normalized)
  return getProposalDisplayTotal(
    normalized.isPartnership,
    normalized.totalValue,
    normalized.included,
    addonOptions,
    normalized
  )
}

export function getProposalOfferPricing(source: ProposalOfferInput) {
  const normalized = coerceOfferSource(source)
  const addonOptions = getProposalAddonOptions(normalized)
  const baseline = getProposalBaselineTotal(normalized)
  const hasOffer = hasActiveProposalOffer(normalized)
  const displayTotal = hasOffer
    ? normalized.totalValue
    : getProposalDisplayTotal(
        normalized.isPartnership,
        normalized.totalValue,
        normalized.included,
        addonOptions,
        normalized
      )

  return {
    addonOptions,
    baseline,
    displayTotal,
    discountPercent: normalized.discountPercent,
    hasOffer,
    offerRevision: normalized.offerRevision,
  }
}

export function canCreateProposalOffer(proposal: ProposalEntry) {
  return proposal.status !== "draft" && proposal.status !== "expired"
}

export function applyNewOfferToProposal(proposal: ProposalEntry, discountPercent: number) {
  const addonOptions = getProposalAddonOptions(proposal)
  const baseline = getProposalBaselineTotal(proposal)
  const normalizedDiscount = Math.min(Math.max(discountPercent, 0), 100)
  const discountedTotal = calculateDiscountedTotal(baseline, normalizedDiscount)
  const now = new Date().toISOString()

  return normalizeProposalEntry({
    ...proposal,
    baselineTotalValue: baseline,
    discountPercent: normalizedDiscount,
    totalValue: discountedTotal,
    offerRevision: Math.max(proposal.offerRevision ?? 0, 0) + 1,
    offerUpdatedAt: now,
    updated_at: now,
    status: proposal.status === "draft" ? "sent" : proposal.status,
    isPartnership: proposal.isPartnership,
    included: proposal.included,
    domainFirstYearFree: addonOptions.domainFirstYearFree,
    hostingFirstYearFree: addonOptions.hostingFirstYearFree,
  })
}
