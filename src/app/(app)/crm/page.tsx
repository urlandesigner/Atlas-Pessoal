"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  Building2,
  ExternalLink,
  Kanban,
  LayoutList,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  computePipelineStats,
  createLeadFromQuickForm,
  emitLeadsChange,
  EMPTY_QUICK_LEAD_FORM,
  getLeadsServerSnapshot,
  getLeadsSnapshot,
  LEAD_ORIGIN_LABEL,
  LEAD_ORIGIN_OPTIONS,
  moveLeadToStage,
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABEL,
  saveLeads,
  subscribeLeadsStore,
  type LeadEntry,
  type LeadOrigin,
  type PipelineStage,
  type QuickLeadForm,
} from "@/lib/crm/store"
import { StageBadge, STAGE_META } from "@/components/crm"

// ─── Utilities ─────────────────────────────────────────────────────────────

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

function formatRelative(isoString: string) {
  const diff = Date.now() - new Date(isoString).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Hoje"
  if (days === 1) return "Ontem"
  if (days < 7) return `${days}d atrás`
  if (days < 30) return `${Math.floor(days / 7)}sem atrás`
  return new Date(isoString).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

function leadTitle(lead: LeadEntry) {
  return lead.prospect.company || lead.qualification.contact_name?.trim() || "Lead sem empresa"
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
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

function LeadAvatar({ label, size = "md" }: { label: string; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "size-7 rounded-lg text-[11px]" : "size-9 rounded-xl text-xs"
  const initial = label.trim().charAt(0).toUpperCase()
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-foreground font-semibold text-background",
        sizeClass
      )}
    >
      {initial || <UserRound className="size-3.5" />}
    </div>
  )
}

// ─── Lead form (Sheet) — quick capture ──────────────────────────────────────

interface LeadSheetProps {
  open: boolean
  onClose: () => void
  onSave: (form: QuickLeadForm) => void
}

function LeadSheet({ open, onClose, onSave }: LeadSheetProps) {
  const [form, setForm] = useState<QuickLeadForm>(EMPTY_QUICK_LEAD_FORM)

  const prevOpen = useRef(false)
  if (open && !prevOpen.current) setForm(EMPTY_QUICK_LEAD_FORM)
  prevOpen.current = open

  function set(key: keyof QuickLeadForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(form)
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-6 pb-4 pt-6">
          <SheetTitle>Novo Lead</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <form id="lead-form" onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
            <p className="mb-4 text-xs text-muted-foreground">
              Preencha o essencial. Outras informações podem ser adicionadas depois.
            </p>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Empresa <span className="text-rose-500">*</span>
              </label>
              <Input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Nome da empresa"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Segmento</label>
              <Input
                value={form.segment ?? ""}
                onChange={(e) => set("segment", e.target.value)}
                placeholder="Ex: Saúde, Jurídico, Varejo…"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Cidade</label>
              <Input
                value={form.city ?? ""}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Onde está localizada"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Origem do Lead</label>
              <select
                value={form.origin ?? ""}
                onChange={(e) => set("origin", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Selecionar…</option>
                {LEAD_ORIGIN_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {LEAD_ORIGIN_LABEL[o]}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </ScrollArea>

        <SheetFooter className="flex-row gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" form="lead-form" className="flex-1">
            Criar Lead
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Kanban card ────────────────────────────────────────────────────────────

function KanbanCard({
  lead,
  onDragStart,
  onDelete,
}: {
  lead: LeadEntry
  onDragStart: (id: string) => void
  onDelete: (id: string) => void
}) {
  const value = lead.opportunity.estimated_value
  return (
    <div
      draggable
      onDragStart={() => onDragStart(lead.id)}
      className="group cursor-grab active:cursor-grabbing"
    >
      <Link href={`/crm/${lead.id}`} onClick={(e) => e.stopPropagation()}>
        <Card className="border border-border/60 transition-shadow hover:border-border hover:shadow-md">
          <CardContent className="space-y-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-tight">{leadTitle(lead)}</p>
                {lead.qualification.contact_name && (
                  <p className="truncate text-xs text-muted-foreground">
                    {lead.qualification.contact_name}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete(lead.id)
                }}
                className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {lead.prospect.segment && (
              <p className="truncate text-xs text-muted-foreground/80">{lead.prospect.segment}</p>
            )}

            <div className="flex items-center justify-between pt-1">
              {value ? (
                <span className="font-mono text-xs font-medium tabular-nums text-foreground">
                  {money(value)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground/60">Sem valor</span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {formatRelative(lead.created_at)}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}

// ─── Kanban column ──────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  leads,
  onDragStart,
  onDrop,
  onDelete,
}: {
  stage: PipelineStage
  leads: LeadEntry[]
  onDragStart: (id: string) => void
  onDrop: (stage: PipelineStage) => void
  onDelete: (id: string) => void
}) {
  const [dragOver, setDragOver] = useState(false)
  const Icon = STAGE_META[stage].icon
  const totalValue = leads.reduce((sum, l) => sum + (l.opportunity.estimated_value ?? 0), 0)

  return (
    <div className="flex w-[260px] shrink-0 flex-col">
      <div className="flex items-center justify-between rounded-t-lg border-t-2 border-foreground/15 bg-muted/40 px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
          <span className="truncate text-xs font-semibold">{PIPELINE_STAGE_LABEL[stage]}</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {leads.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="font-mono text-[10px] font-medium text-muted-foreground">
            {money(totalValue)}
          </span>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={() => {
          setDragOver(false)
          onDrop(stage)
        }}
        className={cn(
          "min-h-[400px] flex-1 space-y-2 rounded-b-lg border border-t-0 p-2 transition-colors",
          dragOver ? "border-foreground/30 bg-muted/60" : "border-border/40 bg-muted/20"
        )}
      >
        {leads.map((lead) => (
          <KanbanCard key={lead.id} lead={lead} onDragStart={onDragStart} onDelete={onDelete} />
        ))}

        {leads.length === 0 && (
          <div className="flex h-20 items-center justify-center text-xs text-muted-foreground/60">
            Arraste para cá
          </div>
        )}
      </div>
    </div>
  )
}

// ─── List row ───────────────────────────────────────────────────────────────

function LeadListRow({
  lead,
  onDelete,
}: {
  lead: LeadEntry
  onDelete: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const value = lead.opportunity.estimated_value

  return (
    <Card className="group border-border/60 transition-shadow hover:border-border hover:shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 px-4 py-3">
          <LeadAvatar label={leadTitle(lead)} />

          {/* Company + contact */}
          <div className="min-w-0 flex-[2]">
            <Link
              href={`/crm/${lead.id}`}
              className="block truncate text-sm font-medium underline-offset-2 hover:underline"
            >
              {leadTitle(lead)}
            </Link>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              {lead.qualification.contact_name ? (
                lead.qualification.contact_name
              ) : lead.prospect.segment ? (
                <>
                  <Building2 className="size-3 shrink-0" />
                  {lead.prospect.segment}
                </>
              ) : (
                "—"
              )}
            </p>
          </div>

          {/* Stage */}
          <div className="hidden min-w-0 flex-1 md:block">
            <StageBadge stage={lead.status_stage} />
          </div>

          {/* Origin */}
          <div className="hidden min-w-0 flex-1 lg:block">
            {lead.prospect.origin ? (
              <span className="text-xs text-muted-foreground">
                {LEAD_ORIGIN_LABEL[lead.prospect.origin as LeadOrigin]}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/50">—</span>
            )}
          </div>

          {/* Value */}
          <div className="hidden w-24 shrink-0 text-right sm:block">
            {value ? (
              <span className="font-mono text-sm font-medium tabular-nums">{money(value)}</span>
            ) : (
              <span className="text-xs text-muted-foreground/50">—</span>
            )}
          </div>

          {/* Date */}
          <div className="hidden w-20 shrink-0 text-right md:block">
            <span className="text-xs text-muted-foreground">{formatRelative(lead.created_at)}</span>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1">
            <Link href={`/crm/${lead.id}`}>
              <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100">
                <ExternalLink className="size-3.5" />
              </Button>
            </Link>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover:opacity-100"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border bg-popover py-1 shadow-lg">
                    <Link
                      href={`/crm/${lead.id}`}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      Abrir
                    </Link>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      onClick={() => {
                        setMenuOpen(false)
                        onDelete(lead.id)
                      }}
                    >
                      <Trash2 className="size-3.5" />
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

type ViewMode = "list" | "kanban"
type StageFilter = PipelineStage | "all"

export default function CrmPage() {
  const leads = useSyncExternalStore(subscribeLeadsStore, getLeadsSnapshot, getLeadsServerSnapshot)

  const [view, setView] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState<StageFilter>("all")
  const [sheetOpen, setSheetOpen] = useState(false)

  // Import leads received via webhook (Google Sheets → API → Supabase)
  useEffect(() => {
    fetch("/api/leads/incoming")
      .then((r) => r.json())
      .then(({ leads: incoming }) => {
        if (!incoming?.length) return
        const current = getLeadsSnapshot()
        const existingIds = new Set(current.map((l) => l.id))
        const newLeads = (incoming as Array<Record<string, unknown>>)
          .filter((l) => !existingIds.has(l.id as string))
          .map((l) =>
            createLeadFromQuickForm({
              company: String(l.company ?? l.name ?? ""),
              segment: String(l.segment ?? ""),
              city: String(l.city ?? ""),
              origin: (l.origin as LeadOrigin) || "",
            })
          )
        if (!newLeads.length) return
        saveLeads([...newLeads, ...current])
        emitLeadsChange()
      })
      .catch(() => {})
  }, [])

  const dragLeadId = useRef<string | null>(null)

  const stats = useMemo(() => computePipelineStats(leads), [leads])

  const filtered = useMemo(() => {
    const q = normalizeSearch(search)
    return leads
      .filter((l) => {
        if (stageFilter !== "all" && l.status_stage !== stageFilter) return false
        if (!q) return true
        return (
          normalizeSearch(l.prospect.company).includes(q) ||
          normalizeSearch(l.qualification.contact_name ?? "").includes(q) ||
          normalizeSearch(l.prospect.segment ?? "").includes(q)
        )
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [leads, search, stageFilter])

  const kanbanByStage = useMemo(() => {
    const result = {} as Record<PipelineStage, LeadEntry[]>
    for (const stage of PIPELINE_STAGES) {
      result[stage] = filtered.filter((l) => l.status_stage === stage)
    }
    return result
  }, [filtered])

  function handleSave(form: QuickLeadForm) {
    const current = getLeadsSnapshot()
    saveLeads([createLeadFromQuickForm(form), ...current])
    emitLeadsChange()
    setSheetOpen(false)
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este lead?")) return
    saveLeads(getLeadsSnapshot().filter((l) => l.id !== id))
    emitLeadsChange()
  }

  function handleKanbanDrop(toStage: PipelineStage) {
    const id = dragLeadId.current
    if (!id) return
    dragLeadId.current = null

    const current = getLeadsSnapshot()
    const lead = current.find((l) => l.id === id)
    if (!lead || lead.status_stage === toStage) return

    saveLeads(current.map((l) => (l.id === id ? moveLeadToStage(l, toStage) : l)))
    emitLeadsChange()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-6 pb-4 pt-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Leads &amp; CRM</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Gerencie seu pipeline comercial</p>
        </div>
        <Button onClick={() => setSheetOpen(true)} size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Novo Lead
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 px-6 py-5">
          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            <StatCard label="Total de leads" value={stats.total} />
            <StatCard label="Este mês" value={stats.thisMonth} />
            <StatCard
              label="Propostas enviadas"
              value={stats.proposalSent}
              sub={`${stats.total ? Math.round((stats.proposalSent / stats.total) * 100) : 0}% do total`}
            />
            <StatCard label="Clientes" value={stats.clients} />
            <StatCard
              label="Conversão"
              value={`${stats.conversionRate}%`}
              sub="clientes vs. total"
            />
            {stats.pipelineValue > 0 && (
              <StatCard
                label="Em negociação"
                value={money(stats.pipelineValue)}
                sub="valor estimado ativo"
              />
            )}
            {stats.wonValue > 0 && (
              <StatCard label="Total vendido" value={money(stats.wonValue)} />
            )}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por empresa, contato…"
                className="h-8 pl-8 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Stage filter */}
            <div className="flex flex-wrap items-center gap-1">
              {(["all", ...PIPELINE_STAGES] as StageFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStageFilter(s)}
                  className={cn(
                    "h-7 rounded-full border px-2.5 text-xs font-medium transition-colors",
                    stageFilter === s
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {s === "all" ? "Todos" : PIPELINE_STAGE_LABEL[s]}
                  {s !== "all" && (
                    <span className="ml-1 opacity-60">
                      {leads.filter((l) => l.status_stage === s).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center overflow-hidden rounded-md border">
              <button
                onClick={() => setView("list")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors",
                  view === "list"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutList className="size-3.5" />
                Lista
              </button>
              <button
                onClick={() => setView("kanban")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors",
                  view === "kanban"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Kanban className="size-3.5" />
                Kanban
              </button>
            </div>
          </div>

          {/* Content */}
          {view === "list" ? (
            <div className="space-y-2">
              {filtered.length > 0 && (
                <div className="hidden items-center gap-4 px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground md:flex">
                  <div className="size-9 shrink-0" />
                  <div className="flex-[2]">Empresa</div>
                  <div className="hidden flex-1 md:block">Estágio</div>
                  <div className="hidden flex-1 lg:block">Origem</div>
                  <div className="hidden w-24 text-right sm:block">Valor</div>
                  <div className="hidden w-20 text-right md:block">Data</div>
                  <div className="w-16 shrink-0" />
                </div>
              )}

              {filtered.length > 0 ? (
                filtered.map((lead) => (
                  <LeadListRow key={lead.id} lead={lead} onDelete={handleDelete} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                    <UserRound className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">
                    {search || stageFilter !== "all" ? "Nenhum lead encontrado" : "Nenhum lead ainda"}
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    {search || stageFilter !== "all"
                      ? "Tente ajustar os filtros de busca."
                      : "Adicione seu primeiro lead clicando em + Novo Lead."}
                  </p>
                  {!search && stageFilter === "all" && (
                    <Button onClick={() => setSheetOpen(true)} size="sm" className="mt-4 gap-1.5">
                      <Plus className="size-4" />
                      Novo Lead
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="-mx-6 overflow-x-auto px-6 pb-4">
              <div className="flex w-max gap-3">
                {PIPELINE_STAGES.map((stage) => (
                  <KanbanColumn
                    key={stage}
                    stage={stage}
                    leads={kanbanByStage[stage]}
                    onDragStart={(id) => {
                      dragLeadId.current = id
                    }}
                    onDrop={handleKanbanDrop}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <LeadSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSave={handleSave} />
    </div>
  )
}
