"use client"

import Link from "next/link"
import { useMemo, useState, useSyncExternalStore } from "react"
import {
  ArrowLeft,
  Check,
  Inbox,
  PencilLine,
  RotateCcw,
  Undo2,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  getLeadsServerSnapshot,
  getLeadsSnapshot,
  subscribeLeadsStore,
  updateCommunication,
  updateQualification,
  type LeadEntry,
} from "@/lib/crm/store"
import {
  approachedToday,
  availableChannels,
  DEFAULT_OUTREACH_TEMPLATES,
  dueFollowup,
  followupQueue,
  formatShortDate,
  getTemplatesServerSnapshot,
  getTemplatesSnapshot,
  leadCompany,
  localDate,
  OUTREACH_TEMPLATE_LABEL,
  OUTREACH_VARIABLES,
  registerFollowupSent,
  registerInitialOutreach,
  registerNotInterested,
  registerReplied,
  saveTemplates,
  subscribeTemplates,
  toApproachQueue,
  waitingCount,
  type OutreachChannel,
  type OutreachTemplateKey,
  type OutreachTemplates,
} from "@/lib/crm/outreach"
import { FocusCard, persistLead, type Mode } from "@/components/crm/outreach-card"

// ─── Stat ───────────────────────────────────────────────────────────────────

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <Card className="min-w-[140px] flex-1">
      <CardContent className="px-4 pb-3 pt-4">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold leading-none tabular-nums">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}


// ─── Templates editor ───────────────────────────────────────────────────────

function TemplatesSheet({ open, onClose, templates }: {
  open: boolean
  onClose: () => void
  templates: OutreachTemplates
}) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {open ? <TemplatesForm templates={templates} onClose={onClose} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function TemplatesForm({ templates, onClose }: { templates: OutreachTemplates; onClose: () => void }) {
  const [draft, setDraft] = useState<OutreachTemplates>(templates)
  const keys = Object.keys(OUTREACH_TEMPLATE_LABEL) as OutreachTemplateKey[]

  return (
    <>
      <SheetHeader className="border-b px-6 pb-4 pt-6">
        <SheetTitle>Mensagens de abordagem</SheetTitle>
        <SheetDescription>
          Modelos usados para montar a mensagem de cada lead. Ficam salvos neste navegador.
        </SheetDescription>
      </SheetHeader>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 px-6 py-5">
          <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
            <p className="mb-1.5 font-medium text-foreground">Variáveis</p>
            <ul className="space-y-0.5">
              {OUTREACH_VARIABLES.map((v) => (
                <li key={v.key}>
                  <code className="font-mono text-foreground">{v.key}</code> {v.hint}
                </li>
              ))}
            </ul>
          </div>

          {keys.map((key) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium">{OUTREACH_TEMPLATE_LABEL[key]}</label>
              <Textarea
                value={draft[key]}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                className="min-h-28 text-sm"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() => setDraft(DEFAULT_OUTREACH_TEMPLATES)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            Restaurar mensagens padrão
          </button>
        </div>
      </ScrollArea>

      <SheetFooter className="flex-row gap-2 border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={() => {
            saveTemplates(draft)
            onClose()
          }}
        >
          Salvar mensagens
        </Button>
      </SheetFooter>
    </>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

interface UndoState {
  before: LeadEntry
  label: string
}

export default function OutreachPage() {
  const leads = useSyncExternalStore(subscribeLeadsStore, getLeadsSnapshot, getLeadsServerSnapshot)
  const templates = useSyncExternalStore(subscribeTemplates, getTemplatesSnapshot, getTemplatesServerSnapshot)

  const [mode, setMode] = useState<Mode>("approach")
  const [skipped, setSkipped] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [undo, setUndo] = useState<UndoState | null>(null)
  const [templatesOpen, setTemplatesOpen] = useState(false)

  const today = localDate()

  const approachQueue = useMemo(() => toApproachQueue(leads), [leads])
  const dueQueue = useMemo(() => followupQueue(leads, today), [leads, today])
  const stats = useMemo(
    () => ({
      today: approachedToday(leads, today),
      waiting: waitingCount(leads, today),
    }),
    [leads, today]
  )

  // Pulados vão para o fim da fila (só nesta sessão).
  const queue = useMemo(() => {
    const base = mode === "approach" ? approachQueue : dueQueue
    const rank = (l: LeadEntry) => skipped.indexOf(l.id)
    return [...base].sort((a, b) => rank(a) - rank(b))
  }, [mode, approachQueue, dueQueue, skipped])

  const current = queue.find((l) => l.id === selectedId) ?? queue[0] ?? null
  const currentIndex = current ? queue.indexOf(current) : -1
  const currentFollowup = current && mode === "followup" ? dueFollowup(current, today) : null

  function apply(before: LeadEntry, after: LeadEntry, label: string) {
    persistLead(after)
    setUndo({ before, label })
    setSelectedId(null)
  }

  function handleSend(channel: OutreachChannel, message: string) {
    if (!current) return
    if (mode === "approach") {
      apply(current, registerInitialOutreach(current, channel, message), `Abordagem registrada: ${leadCompany(current)}. Follow-ups agendados para D+3 e D+7.`)
    } else if (currentFollowup) {
      apply(current, registerFollowupSent(current, currentFollowup.id, channel), `${currentFollowup.description} registrado: ${leadCompany(current)}.`)
    }
  }

  function handleSkip() {
    if (!current) return
    setSkipped((s) => [...s.filter((id) => id !== current.id), current.id])
    setSelectedId(null)
  }

  function handleReplied() {
    if (!current) return
    apply(current, registerReplied(current), `${leadCompany(current)} respondeu. Follow-ups encerrados.`)
  }

  function handleNotInterested() {
    if (!current) return
    apply(current, registerNotInterested(current), `${leadCompany(current)} marcado como sem interesse.`)
  }

  function handleSaveContact(data: { contact_name: string; whatsapp: string; instagram: string; current_site: string }) {
    if (!current) return
    let updated = updateQualification(current, { contact_name: data.contact_name.trim() })
    updated = updateCommunication(updated, {
      whatsapp: data.whatsapp.trim(),
      instagram: data.instagram.trim(),
      current_site: data.current_site.trim(),
    })
    persistLead(updated)
    setSelectedId(updated.id)
  }

  function handleUndo() {
    if (!undo) return
    persistLead(undo.before)
    setSelectedId(undo.before.id)
    setUndo(null)
  }

  function switchMode(next: Mode) {
    setMode(next)
    setSelectedId(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={
          <Link href="/crm" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" />
            Leads & CRM
          </Link>
        }
        title="Modo Abordagem"
        description="Um lead por vez: revise a mensagem, envie em 1 clique e siga para o próximo."
        actions={
          <Button variant="outline" size="sm" onClick={() => setTemplatesOpen(true)} className="gap-1.5">
            <PencilLine className="size-3.5" />
            Mensagens
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Stat label="Para abordar" value={approachQueue.length} sub="leads no estágio Lead" />
        <Stat label="Follow-ups hoje" value={dueQueue.length} sub="vencidos ou para hoje" />
        <Stat label="Abordados hoje" value={stats.today} />
        <Stat label="Aguardando" value={stats.waiting} sub="follow-up agendado" />
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {([
          ["approach", "Primeira abordagem", approachQueue.length],
          ["followup", "Follow-ups de hoje", dueQueue.length],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={cn(
              "h-8 rounded-full border px-3 text-xs font-medium transition-colors",
              mode === key
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {label}
            <span className="ml-1 opacity-60">{count}</span>
          </button>
        ))}
      </div>

      {undo && (
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/50 px-4 py-2.5 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <Check className="size-4 shrink-0" />
            <span className="truncate">{undo.label}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={handleUndo} className="shrink-0 gap-1.5">
            <Undo2 className="size-3.5" />
            Desfazer
          </Button>
        </div>
      )}

      {current ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <FocusCard
            key={`${current.id}-${mode}-${currentFollowup?.id ?? ""}-${current.updated_at}`}
            lead={current}
            mode={mode}
            templates={templates}
            followup={currentFollowup}
            position={{ index: currentIndex, total: queue.length }}
            onSend={handleSend}
            onSkip={handleSkip}
            onReplied={handleReplied}
            onNotInterested={handleNotInterested}
            onSaveContact={handleSaveContact}
          />

          <Card className="h-fit py-0">
            <CardContent className="p-2">
              <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Fila
              </p>
              <ul className="max-h-[480px] overflow-y-auto">
                {queue.map((lead) => {
                  const hasChannel = availableChannels(lead).length > 0
                  const fu = mode === "followup" ? dueFollowup(lead, today) : null
                  return (
                    <li key={lead.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(lead.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                          lead.id === current.id ? "bg-muted font-medium" : "hover:bg-muted/60"
                        )}
                      >
                        <span className="truncate">{leadCompany(lead)}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {fu
                            ? formatShortDate(fu.date)
                            : !hasChannel
                              ? "sem contato"
                              : skipped.includes(lead.id)
                                ? "pulado"
                                : ""}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
            <Inbox className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">
            {mode === "approach" ? "Nenhum lead para abordar" : "Nenhum follow-up para hoje"}
          </p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            {mode === "approach"
              ? "Todos os leads do estágio Lead já foram abordados. Adicione novos no CRM."
              : "Os próximos follow-ups aparecem aqui no dia em que vencerem."}
          </p>
          {mode === "approach" && (
            <Link href="/crm" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
              Ir para o CRM
            </Link>
          )}
        </div>
      )}

      <TemplatesSheet open={templatesOpen} onClose={() => setTemplatesOpen(false)} templates={templates} />
    </div>
  )
}
