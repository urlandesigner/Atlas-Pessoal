"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  Building2,
  ChevronDown,
  ExternalLink,
  Filter,
  Kanban,
  LayoutList,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  computeLeadStats,
  createLeadFromQuickForm,
  emitLeadsChange,
  EMPTY_QUICK_LEAD_FORM,
  getLeadsServerSnapshot,
  getLeadsSnapshot,
  LEAD_ORIGIN_LABEL,
  LEAD_ORIGIN_OPTIONS,
  LEAD_STATUS_LABEL,
  LEAD_STATUS_ORDER,
  moveLeadToStatus,
  PROJECT_TYPE_LABEL,
  PROJECT_TYPE_OPTIONS,
  PIPELINE_STAGE_LABEL,
  saveLeads,
  subscribeLeadsStore,
  updateLeadFromForm,
  type LeadEntry,
  type LeadForm,
  type LeadOrigin,
  type LeadStatus,
  type ProjectType,
  type QuickLeadForm,
} from "@/lib/crm/store"

// ─── Badge maps ────────────────────────────────────────────────────────────

const STATUS_CLASS: Record<LeadStatus, string> = {
  new: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  contacted: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  briefing: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  proposal_sent: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  negotiation: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  closed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  lost: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
}

const ORIGIN_CLASS: Record<LeadOrigin, string> = {
  instagram: "border-pink-500/20 bg-pink-500/10 text-pink-700 dark:text-pink-300",
  google: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  referral: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  linkedin: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  whatsapp: "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
  other: "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
}

const KANBAN_COLUMN_COLORS: Record<LeadStatus, string> = {
  new: "border-sky-500/30",
  contacted: "border-violet-500/30",
  briefing: "border-amber-500/30",
  proposal_sent: "border-blue-500/30",
  negotiation: "border-orange-500/30",
  closed: "border-emerald-500/30",
  lost: "border-rose-500/30",
}

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

function getInitials(name: string) {
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
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

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <Card className="flex-1 min-w-[140px]">
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className={cn("text-2xl font-semibold tabular-nums leading-none", accent)}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function LeadAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "size-7 text-[10px]" : "size-9 text-xs"
  return (
    <div
      className={cn(
        "rounded-full bg-muted flex items-center justify-center shrink-0 font-semibold text-muted-foreground",
        sizeClass
      )}
    >
      {getInitials(name) || <UserRound className="size-3.5" />}
    </div>
  )
}

// ─── Lead form (Sheet) ─────────────────────────────────────────────────────

interface LeadSheetProps {
  open: boolean
  onClose: () => void
  editing: LeadEntry | null
  onSave: (form: QuickLeadForm) => void
}

function LeadSheet({ open, onClose, editing, onSave }: LeadSheetProps) {
  const [form, setForm] = useState<QuickLeadForm>(EMPTY_QUICK_LEAD_FORM)

  // Reset form when sheet opens
  const prevOpen = useRef(false)
  if (open && !prevOpen.current) {
    const next = EMPTY_QUICK_LEAD_FORM
    if (JSON.stringify(next) !== JSON.stringify(form)) setForm(next)
  }
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
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>{editing ? "Editar Lead" : "Novo Lead"}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <form id="lead-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <p className="text-xs text-muted-foreground mb-4">
              Preencha o essencial. Outras informações podem ser adicionadas depois.
            </p>

            {/* Empresa - Obrigatório */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Empresa <span className="text-rose-500">*</span>
              </label>
              <Input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Nome da empresa"
                required
              />
            </div>

            {/* Segmento */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Segmento</label>
              <Input
                value={form.segment}
                onChange={(e) => set("segment", e.target.value)}
                placeholder="Ex: Saúde, Jurídico, Varejo…"
              />
            </div>

            {/* Cidade */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cidade</label>
              <Input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Onde está localizada"
              />
            </div>

            {/* Origem */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Origem do Lead</label>
              <select
                value={form.origin}
                onChange={(e) => set("origin", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
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

        <SheetFooter className="px-6 py-4 border-t gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" form="lead-form" className="flex-1">
            {editing ? "Salvar" : "Criar Lead"}
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
  onEdit,
  onDelete,
}: {
  lead: LeadEntry
  onDragStart: (id: string) => void
  onEdit: (lead: LeadEntry) => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(lead.id)}
      className="group cursor-grab active:cursor-grabbing"
    >
      <Link href={`/crm/${lead.id}`} onClick={(e) => e.stopPropagation()}>
        <Card className="hover:shadow-md transition-shadow border border-border/60 hover:border-border">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight truncate">{lead.name || "—"}</p>
                {lead.company && (
                  <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete(lead.id)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {lead.project_type && (
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 font-normal border-zinc-300/50 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
              >
                {PROJECT_TYPE_LABEL[lead.project_type as ProjectType]}
              </Badge>
            )}

            <div className="flex items-center justify-between pt-1">
              {lead.estimated_value !== null ? (
                <span className="text-xs font-medium text-foreground">
                  {money(lead.estimated_value)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Sem valor</span>
              )}
              <span className="text-[10px] text-muted-foreground">{formatRelative(lead.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}

// ─── Kanban column ──────────────────────────────────────────────────────────

function KanbanColumn({
  status,
  leads,
  dragLeadId,
  onDragStart,
  onDrop,
  onEdit,
  onDelete,
}: {
  status: LeadStatus
  leads: LeadEntry[]
  dragLeadId: string | null
  onDragStart: (id: string) => void
  onDrop: (status: LeadStatus) => void
  onEdit: (lead: LeadEntry) => void
  onDelete: (id: string) => void
}) {
  const [dragOver, setDragOver] = useState(false)

  const totalValue = leads
    .filter((l) => l.estimated_value !== null)
    .reduce((sum, l) => sum + (l.estimated_value ?? 0), 0)

  return (
    <div className="flex flex-col w-[260px] shrink-0">
      {/* Column header */}
      <div className={cn("rounded-t-lg border-t-2 px-3 py-2.5 bg-muted/40", KANBAN_COLUMN_COLORS[status])}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold truncate">{LEAD_STATUS_LABEL[status]}</span>
            <span className="text-[10px] font-medium bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
              {leads.length}
            </span>
          </div>
          {totalValue > 0 && (
            <span className="text-[10px] text-muted-foreground font-medium">{money(totalValue)}</span>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={() => {
          setDragOver(false)
          onDrop(status)
        }}
        className={cn(
          "flex-1 min-h-[400px] rounded-b-lg border border-t-0 p-2 space-y-2 transition-colors",
          dragOver ? "bg-muted/60 border-border" : "bg-muted/20 border-border/40"
        )}
      >
        {leads.map((lead) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            onDragStart={onDragStart}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {leads.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/60">
            Arraste cards aqui
          </div>
        )}
      </div>
    </div>
  )
}

// ─── List row ───────────────────────────────────────────────────────────────

function LeadListRow({
  lead,
  onEdit,
  onDelete,
}: {
  lead: LeadEntry
  onEdit: (lead: LeadEntry) => void
  onDelete: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Card className="group hover:shadow-sm transition-shadow border-border/60 hover:border-border">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 px-4 py-3">
          {/* Avatar */}
          <LeadAvatar name={lead.name} />

          {/* Name + company */}
          <div className="min-w-0 flex-[2]">
            <Link
              href={`/crm/${lead.id}`}
              className="text-sm font-medium hover:underline underline-offset-2 truncate block"
            >
              {lead.name || "Sem nome"}
            </Link>
            {lead.company && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <Building2 className="size-3 shrink-0" />
                {lead.company}
              </p>
            )}
          </div>

          {/* Project type */}
          <div className="hidden sm:block flex-1 min-w-0">
            {lead.project_type ? (
              <Badge
                variant="outline"
                className="font-normal text-xs border-zinc-300/50 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
              >
                {PROJECT_TYPE_LABEL[lead.project_type as ProjectType]}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground/50">—</span>
            )}
          </div>

          {/* Status */}
          <div className="hidden md:block flex-1 min-w-0">
            <Badge
              variant="outline"
              className={cn("font-normal text-xs", STATUS_CLASS[lead.status])}
            >
              {LEAD_STATUS_LABEL[lead.status]}
            </Badge>
          </div>

          {/* Origin */}
          <div className="hidden lg:block flex-1 min-w-0">
            {lead.origin ? (
              <Badge
                variant="outline"
                className={cn("font-normal text-xs", ORIGIN_CLASS[lead.origin as LeadOrigin])}
              >
                {LEAD_ORIGIN_LABEL[lead.origin as LeadOrigin]}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground/50">—</span>
            )}
          </div>

          {/* Value */}
          <div className="hidden sm:block text-right shrink-0 w-24">
            {lead.estimated_value !== null ? (
              <span className="text-sm font-medium tabular-nums">{money(lead.estimated_value)}</span>
            ) : (
              <span className="text-xs text-muted-foreground/50">—</span>
            )}
          </div>

          {/* Date */}
          <div className="hidden md:block text-right shrink-0 w-20">
            <span className="text-xs text-muted-foreground">{formatRelative(lead.created_at)}</span>
          </div>

          {/* Actions */}
          <div className="shrink-0 flex items-center gap-1">
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
                  <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border bg-popover shadow-lg py-1">
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => {
                        setMenuOpen(false)
                        onEdit(lead)
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
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
type StatusFilter = LeadStatus | "all"

export default function CrmPage() {
  const leads = useSyncExternalStore(subscribeLeadsStore, getLeadsSnapshot, getLeadsServerSnapshot)

  const [view, setView] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<LeadEntry | null>(null)

  // Importa leads enviados via webhook (Google Sheets → API → Supabase)
  useEffect(() => {
    fetch("/api/leads/incoming")
      .then((r) => r.json())
      .then(({ leads }) => {
        if (!leads?.length) return
        const current = getLeadsSnapshot()
        const existingIds = new Set(current.map((l) => l.id))
        const newLeads = (leads as Array<Record<string, unknown>>)
          .filter((l) => !existingIds.has(l.id as string))
          .map((l) =>
            createLeadFromForm({
              name: String(l.name ?? ""),
              email: String(l.email ?? ""),
              phone: String(l.phone ?? ""),
              whatsapp: String(l.whatsapp ?? ""),
              company: String(l.company ?? ""),
              segment: String(l.segment ?? ""),
              city: String(l.city ?? ""),
              state: String(l.state ?? ""),
              current_site: String(l.current_site ?? ""),
              instagram: String(l.instagram ?? ""),
              project_type: (l.project_type as LeadForm["project_type"]) || "",
              project_objective: String(l.project_objective ?? ""),
              desired_deadline: String(l.desired_deadline ?? ""),
              investment_range: String(l.investment_range ?? ""),
              origin: (l.origin as LeadOrigin) || "",
              status: "new",
              estimated_value: l.estimated_value ? String(l.estimated_value) : "",
              responsible: String(l.responsible ?? ""),
            })
          )
        if (!newLeads.length) return
        saveLeads([...newLeads, ...current])
        emitLeadsChange()
      })
      .catch(() => {})
  }, [])

  // Kanban drag state
  const dragLeadId = useRef<string | null>(null)

  const stats = useMemo(() => computeLeadStats(leads), [leads])

  const filtered = useMemo(() => {
    const q = normalizeSearch(search)
    return leads
      .filter((l) => {
        if (statusFilter !== "all" && l.status !== statusFilter) return false
        if (!q) return true
        return (
          normalizeSearch(l.name).includes(q) ||
          normalizeSearch(l.company).includes(q) ||
          normalizeSearch(l.email).includes(q)
        )
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [leads, search, statusFilter])

  const kanbanByStatus = useMemo(() => {
    const result = {} as Record<LeadStatus, LeadEntry[]>
    for (const status of LEAD_STATUS_ORDER) {
      result[status] = filtered.filter((l) => l.status === status)
    }
    return result
  }, [filtered])

  function openNew() {
    setEditingLead(null)
    setSheetOpen(true)
  }

  function openEdit(lead: LeadEntry) {
    setEditingLead(lead)
    setSheetOpen(true)
  }

  function handleSave(form: QuickLeadForm) {
    const current = getLeadsSnapshot()
    // Quick form is only for creating new leads
    const newLead = createLeadFromQuickForm(form)
    const updated = [newLead, ...current]
    saveLeads(updated)
    emitLeadsChange()
    setSheetOpen(false)
    setEditingLead(null)
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este lead?")) return
    const updated = getLeadsSnapshot().filter((l) => l.id !== id)
    saveLeads(updated)
    emitLeadsChange()
  }

  function handleKanbanDrop(toStatus: LeadStatus) {
    const id = dragLeadId.current
    if (!id) return
    dragLeadId.current = null

    const current = getLeadsSnapshot()
    const lead = current.find((l) => l.id === id)
    if (!lead || lead.status === toStatus) return

    const updated = current.map((l) =>
      l.id === id ? moveLeadToStatus(l, toStatus) : l
    )
    saveLeads(updated)
    emitLeadsChange()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b shrink-0">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Leads & CRM</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie seu pipeline comercial
          </p>
        </div>
        <Button onClick={openNew} size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Novo Lead
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 space-y-5">
          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            <StatCard label="Total de leads" value={stats.total} />
            <StatCard label="Este mês" value={stats.thisMonth} />
            <StatCard
              label="Propostas enviadas"
              value={stats.proposalSent}
              sub={`${stats.total ? Math.round((stats.proposalSent / stats.total) * 100) : 0}% do total`}
            />
            <StatCard
              label="Fechados"
              value={stats.closed}
              accent="text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              label="Conversão"
              value={`${stats.conversionRate}%`}
              sub="fechados vs. perdidos"
              accent={stats.conversionRate >= 50 ? "text-emerald-600 dark:text-emerald-400" : undefined}
            />
            {stats.pipelineValue > 0 && (
              <StatCard
                label="Em negociação"
                value={money(stats.pipelineValue)}
                sub="valor estimado no pipeline"
              />
            )}
            {stats.closedValue > 0 && (
              <StatCard
                label="Total vendido"
                value={money(stats.closedValue)}
                accent="text-emerald-600 dark:text-emerald-400"
              />
            )}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, empresa…"
                className="pl-8 h-8 text-sm"
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

            {/* Status filter */}
            <div className="flex items-center gap-1 flex-wrap">
              {(["all", ...LEAD_STATUS_ORDER] as (StatusFilter)[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "h-7 px-2.5 rounded-full text-xs font-medium transition-colors border",
                    statusFilter === s
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {s === "all" ? "Todos" : LEAD_STATUS_LABEL[s]}
                  {s !== "all" && (
                    <span className="ml-1 opacity-60">
                      {leads.filter((l) => l.status === s).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center rounded-md border overflow-hidden ml-auto">
              <button
                onClick={() => setView("list")}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors",
                  view === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutList className="size-3.5" />
                Lista
              </button>
              <button
                onClick={() => setView("kanban")}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors",
                  view === "kanban" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
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
              {/* Table header */}
              {filtered.length > 0 && (
                <div className="hidden md:flex items-center gap-4 px-4 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="size-9 shrink-0" />
                  <div className="flex-[2]">Contato</div>
                  <div className="hidden sm:block flex-1">Serviço</div>
                  <div className="hidden md:block flex-1">Status</div>
                  <div className="hidden lg:block flex-1">Origem</div>
                  <div className="hidden sm:block text-right w-24">Valor</div>
                  <div className="hidden md:block text-right w-20">Data</div>
                  <div className="w-16 shrink-0" />
                </div>
              )}

              {filtered.length > 0 ? (
                filtered.map((lead) => (
                  <LeadListRow
                    key={lead.id}
                    lead={lead}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <UserRound className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">
                    {search || statusFilter !== "all" ? "Nenhum lead encontrado" : "Nenhum lead ainda"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    {search || statusFilter !== "all"
                      ? "Tente ajustar os filtros de busca."
                      : "Adicione seu primeiro lead clicando em + Novo Lead."}
                  </p>
                  {!search && statusFilter === "all" && (
                    <Button onClick={openNew} size="sm" className="mt-4 gap-1.5">
                      <Plus className="size-4" />
                      Novo Lead
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Kanban view */
            <div className="overflow-x-auto pb-4 -mx-6 px-6">
              <div className="flex gap-3 w-max">
                {LEAD_STATUS_ORDER.map((status) => (
                  <KanbanColumn
                    key={status}
                    status={status}
                    leads={kanbanByStatus[status]}
                    dragLeadId={dragLeadId.current}
                    onDragStart={(id) => {
                      dragLeadId.current = id
                    }}
                    onDrop={handleKanbanDrop}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sheet */}
      <LeadSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false)
          setEditingLead(null)
        }}
        editing={editingLead}
        onSave={handleSave}
      />
    </div>
  )
}
