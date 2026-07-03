"use client"

import { useEffect, useState } from "react"
import { Percent } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  applyNewOfferToProposal,
  calculateDiscountedTotal,
  getProposalBaselineTotal,
  getProposalOfferPricing,
  hasActiveProposalOffer,
} from "@/lib/proposals/offers"
import type { ProposalEntry } from "@/lib/proposals/store"
import { money } from "@/components/proposals/utils"

export function NewOfferDialog({
  proposal,
  open,
  onOpenChange,
  onConfirm,
}: {
  proposal: ProposalEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (next: ProposalEntry) => void
}) {
  const [discountPercent, setDiscountPercent] = useState("10")

  useEffect(() => {
    if (!open || !proposal) return
    setDiscountPercent(
      hasActiveProposalOffer(proposal) ? String(proposal.discountPercent) : "10"
    )
  }, [open, proposal])

  if (!proposal) return null

  const baseline = getProposalBaselineTotal(proposal)
  const parsedDiscount = Number.parseFloat(discountPercent.replace(",", "."))
  const safeDiscount = Number.isFinite(parsedDiscount)
    ? Math.min(Math.max(parsedDiscount, 0), 100)
    : 0
  const previewTotal = calculateDiscountedTotal(baseline, safeDiscount)
  const currentPricing = getProposalOfferPricing(proposal)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova oferta</DialogTitle>
          <DialogDescription>
            Aplica um desconto sobre o valor original e atualiza a proposta web que você já
            compartilhou — o link permanece o mesmo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
            <p className="text-muted-foreground">Valor original da proposta</p>
            <p className="mt-1 text-lg font-medium">{money(baseline)}</p>
            {currentPricing.hasOffer ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Oferta atual: {money(currentPricing.displayTotal)} ({currentPricing.discountPercent}
                %)
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="discount-percent" className="text-sm font-medium">
              Desconto (%)
            </label>
            <div className="relative">
              <Input
                id="discount-percent"
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={discountPercent}
                onChange={(event) => setDiscountPercent(event.target.value)}
                className="pr-10"
              />
              <Percent className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="rounded-lg border border-dashed px-4 py-3 text-sm">
            <p className="text-muted-foreground">Novo valor para o cliente</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{money(previewTotal)}</p>
            {safeDiscount > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Economia de {money(baseline - previewTotal)}
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onConfirm(applyNewOfferToProposal(proposal, safeDiscount))
              onOpenChange(false)
            }}
            disabled={safeDiscount <= 0}
          >
            Publicar nova oferta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
