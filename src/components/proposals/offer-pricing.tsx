import { money } from "@/components/proposals/utils"
import { getProposalOfferPricing } from "@/lib/proposals/offers"
import type { ProposalOfferInput } from "@/lib/proposals/offers"

export function ProposalOfferBanner({
  source,
  className = "",
  variant = "internal",
}: {
  source: ProposalOfferInput
  className?: string
  variant?: "internal" | "public"
}) {
  const { hasOffer, discountPercent, offerRevision, baseline } = getProposalOfferPricing(source)

  if (!hasOffer) return null

  const isPublic = variant === "public"

  return (
    <div
      className={
        isPublic
          ? `rounded-2xl border border-[var(--accent-2)]/40 bg-[var(--accent)]/15 px-5 py-4 ${className}`
          : `rounded-2xl border border-[var(--accent-2)]/30 bg-[var(--accent-2)]/10 px-5 py-4 ${className}`
      }
    >
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--accent-2)]">
        Nova oferta · revisão {offerRevision}
      </p>
      <p
        className={
          isPublic
            ? "mt-2 text-sm leading-relaxed text-[var(--fg)]"
            : "mt-2 text-sm leading-relaxed text-[var(--soft)]"
        }
      >
        Valor atualizado com <strong className="text-[var(--fg)]">{discountPercent}%</strong> de
        desconto sobre {money(baseline)}.
      </p>
      {isPublic ? null : (
        <p className="mt-1 text-sm text-[var(--muted)]">
          O link compartilhado com o cliente já reflete este novo valor.
        </p>
      )}
    </div>
  )
}

export function ProposalOfferTotal({
  source,
  totalClassName = "text-3xl font-semibold tracking-tight",
  baselineClassName = "text-lg text-muted-foreground line-through",
}: {
  source: ProposalOfferInput
  totalClassName?: string
  baselineClassName?: string
}) {
  const { hasOffer, baseline, displayTotal, discountPercent } = getProposalOfferPricing(source)

  if (!hasOffer) {
    return <p className={totalClassName}>{money(displayTotal)}</p>
  }

  return (
    <div>
      <p className={baselineClassName}>{money(baseline)}</p>
      <p className={totalClassName}>{money(displayTotal)}</p>
      <p className="mt-2 text-sm opacity-70">Desconto de {discountPercent}% aplicado</p>
    </div>
  )
}
