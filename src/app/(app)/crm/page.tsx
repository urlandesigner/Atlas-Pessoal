"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  Ban,
  Building2,
  FilePlus2,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABEL,
  saveLeads,
  subscribeLeadsStore,
  type LeadEntry,
  type LeadOrigin,
  type PipelineStage,
  type QuickLeadForm,
} from "@/lib/crm/store"
import { StageBadge } from "@/components/crm"

// ─── Utilities ─────────────────────────────────────────────────────────────

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

// ─── List row ───────────────────────────────────────────────────────────────

function LeadTableRow({
  lead,
  onDelete,
}: {
  lead: LeadEntry
  onDelete: (id: string) => void
}) {
  const router = useRouter()
  const href = `/crm/${lead.id}`

  return (
    <TableRow
      className="group cursor-pointer"
      onClick={() => router.push(href)}
    >
      {/* Company + contact */}
      <TableCell>
        <div className="flex items-center gap-3">
          <LeadAvatar label={leadTitle(lead)} size="sm" />
          <div className="min-w-0">
            <span className="block truncate font-medium underline-offset-2 group-hover:underline">
              {leadTitle(lead)}
            </span>
            <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
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
            </span>
          </div>
        </div>
      </TableCell>

      {/* Stage */}
      <TableCell className="hidden md:table-cell">
        {lead.lost ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium leading-5 text-muted-foreground">
            <Ban className="size-3" strokeWidth={2} />
            Perdido
          </span>
        ) : (
          <StageBadge stage={lead.status_stage} />
        )}
      </TableCell>

      {/* Origin */}
      <TableCell className="hidden lg:table-cell">
        {lead.prospect.origin ? (
          <span className="text-xs text-muted-foreground">
            {LEAD_ORIGIN_LABEL[lead.prospect.origin as LeadOrigin]}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </TableCell>

      {/* Proposal */}
      <TableCell className="hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
        {lead.proposal_id ? (
          <Link
            href={`/freelancer/proposals?view=${lead.proposal_id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/30"
          >
            <FileText className="size-3" />
            Proposta
          </Link>
        ) : (
          <button
            onClick={() => router.push(`/freelancer/proposals?leadId=${lead.id}&new=1`)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <FilePlus2 className="size-3.5" />
            Criar
          </button>
        )}
      </TableCell>

      {/* Date */}
      <TableCell className="hidden text-right text-xs text-muted-foreground md:table-cell">
        {formatRelative(lead.created_at)}
      </TableCell>

      {/* Actions */}
      <TableCell
        className="w-px text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover:opacity-100 data-[popup-open]:opacity-100"
              />
            }
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem render={<Link href={href} />}>Abrir</DropdownMenuItem>
            {lead.proposal_id ? (
              <DropdownMenuItem render={<Link href={`/freelancer/proposals?view=${lead.proposal_id}`} />}>
                <FileText className="size-3.5" />
                Ver proposta
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => router.push(`/freelancer/proposals?leadId=${lead.id}&new=1`)}
              >
                <FilePlus2 className="size-3.5" />
                Criar proposta
              </DropdownMenuItem>
            )}
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(lead.id)}>
              <Trash2 className="size-3.5" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

type StageFilter = PipelineStage | "all" | "lost"

export default function CrmPage() {
  const leads = useSyncExternalStore(subscribeLeadsStore, getLeadsSnapshot, getLeadsServerSnapshot)

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

  const stats = useMemo(() => computePipelineStats(leads), [leads])

  const filtered = useMemo(() => {
    const q = normalizeSearch(search)
    return leads
      .filter((l) => {
        // "Perdidos" shows only lost; every other view hides lost leads.
        if (stageFilter === "lost") {
          if (!l.lost) return false
        } else {
          if (l.lost) return false
          if (stageFilter !== "all" && l.status_stage !== stageFilter) return false
        }
        if (!q) return true
        return (
          normalizeSearch(l.prospect.company).includes(q) ||
          normalizeSearch(l.qualification.contact_name ?? "").includes(q) ||
          normalizeSearch(l.prospect.segment ?? "").includes(q)
        )
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [leads, search, stageFilter])

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Leads & CRM"
        description="Gerencie seu pipeline comercial"
        actions={
          <Button onClick={() => setSheetOpen(true)} size="sm" className="gap-1.5">
            <Plus className="size-4" />
            Novo Lead
          </Button>
        }
      />

      <div className="flex flex-col gap-5">
          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            <StatCard label="Leads ativos" value={stats.total} />
            <StatCard label="Este mês" value={stats.thisMonth} />
            <StatCard label="Clientes" value={stats.clients} />
            <StatCard label="Perdidos" value={stats.lost} />
            <StatCard
              label="Conversão"
              value={`${stats.conversionRate}%`}
              sub="clientes vs. fechados"
            />
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
              {(["all", ...PIPELINE_STAGES, "lost"] as StageFilter[]).map((s) => {
                const label =
                  s === "all" ? "Todos" : s === "lost" ? "Perdidos" : PIPELINE_STAGE_LABEL[s]
                const count =
                  s === "all"
                    ? null
                    : s === "lost"
                      ? leads.filter((l) => l.lost).length
                      : leads.filter((l) => !l.lost && l.status_stage === s).length
                return (
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
                    {label}
                    {count !== null && <span className="ml-1 opacity-60">{count}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          {filtered.length > 0 ? (
            <Card className="overflow-hidden py-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Empresa</TableHead>
                    <TableHead className="hidden md:table-cell">Estágio</TableHead>
                    <TableHead className="hidden lg:table-cell">Origem</TableHead>
                    <TableHead className="hidden lg:table-cell">Proposta</TableHead>
                    <TableHead className="hidden text-right md:table-cell">Data</TableHead>
                    <TableHead className="w-px" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => (
                    <LeadTableRow key={lead.id} lead={lead} onDelete={handleDelete} />
                  ))}
                </TableBody>
              </Table>
            </Card>
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

      <LeadSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSave={handleSave} />
    </div>
  )
}
