"use client"

import { useSyncExternalStore } from "react"
import { Copy, FileText, Globe, Printer, Share2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  createProposalForm,
  getProposalPlanName,
  getProposalsServerSnapshot,
  getProposalsSnapshot,
  PROPOSAL_STATUS_LABEL,
  subscribeProposalsStore,
  type ProposalEntry,
} from "@/lib/proposals/store"
import { cn } from "@/lib/utils"

import { STATUS_CLASS } from "./constants"
import { printProposal } from "./print"
import { ProposalPreview } from "./preview"
import { money } from "./utils"

export function ProposalView({
  proposal,
  onClose,
  onEdit,
  onDuplicate,
  onShare,
}: {
  proposal: ProposalEntry | null
  onClose: () => void
  onEdit: (proposal: ProposalEntry) => void
  onDuplicate: (proposal: ProposalEntry) => void
  onShare: (proposal: ProposalEntry) => void
}) {
  const proposals = useSyncExternalStore(
    subscribeProposalsStore,
    getProposalsSnapshot,
    getProposalsServerSnapshot
  )
  const current = proposal ? proposals.find((item) => item.id === proposal.id) ?? proposal : null

  return (
    <Sheet open={!!proposal} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex h-dvh min-h-0 flex-col gap-0 p-0 data-[side=right]:w-full sm:data-[side=right]:w-[54rem] sm:data-[side=right]:max-w-[54rem]" side="right">
        {current ? (
          <>
            <SheetHeader className="shrink-0 border-b px-5 pb-4 pt-5 pr-12">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-lg">{current.clientName}</SheetTitle>
                <Badge variant="outline" className={cn("font-normal", STATUS_CLASS[current.status])}>
                  {PROPOSAL_STATUS_LABEL[current.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {[
                  getProposalPlanName(current) || null,
                  current.isPartnership
                    ? current.totalValue > 0
                      ? `Gratuito · Parceria + ${money(current.totalValue)}`
                      : "Gratuito · Parceria"
                    : money(current.totalValue),
                  current.estimatedDeadline || "Prazo a definir",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </SheetHeader>
            <ScrollArea className="min-h-0 flex-1 bg-muted/20">
              <div className="p-5 pb-8">
                <ProposalPreview form={createProposalForm(current)} />
              </div>
            </ScrollArea>
            <div className="shrink-0 flex flex-wrap gap-2 border-t px-5 py-4">
              <Button variant="outline" onClick={() => printProposal(current)}>
                <Printer data-icon="inline-start" />
                Imprimir
              </Button>
              <Button variant="outline" onClick={() => printProposal(current)}>
                <FileText data-icon="inline-start" />
                Exportar PDF
              </Button>
              <Button variant="outline" onClick={() => window.open(`/p/${current.id}`, "_blank")}>
                <Globe data-icon="inline-start" />
                Versão web
              </Button>
              <Button variant="outline" onClick={() => onShare(current)}>
                <Share2 data-icon="inline-start" />
                Compartilhar link
              </Button>
              <Button variant="outline" onClick={() => onDuplicate(current)}>
                <Copy data-icon="inline-start" />
                Duplicar
              </Button>
              <Button className="ml-auto" onClick={() => onEdit(current)}>
                Editar
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
