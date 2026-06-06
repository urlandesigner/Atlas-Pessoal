"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import {
  ArrowLeft,
  AtSign,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  ExternalLink,
  FileText,
  Globe,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Save,
  Trash2,
  User,
  UserRound,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  addActivityToLead,
  addCommentToLead,
  ACTIVITY_TYPE_LABEL,
  ACTIVITY_TYPE_OPTIONS,
  BRIEFING_FEATURES,
  createLeadFormFromEntry,
  emitLeadsChange,
  getLeadsServerSnapshot,
  getLeadsSnapshot,
  LEAD_ORIGIN_LABEL,
  LEAD_ORIGIN_OPTIONS,
  LEAD_STATUS_LABEL,
  LEAD_STATUS_ORDER,
  PROJECT_TYPE_LABEL,
  PROJECT_TYPE_OPTIONS,
  saveLeads,
  subscribeLeadsStore,
  toggleActivityStatus,
  updateLeadBriefing,
  updateLeadFromForm,
  type ActivityStatus,
  type ActivityType,
  type BriefingData,
  type LeadActivity,
  type LeadEntry,
  type LeadForm,
  type LeadOrigin,
  type LeadStatus,
  type ProjectType,
  EMPTY_BRIEFING,
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

const TIMELINE_ICON: Record<string, React.ReactNode> = {
  created: <Circle className="size-3.5 text-sky-500" />,
  status_changed: <ChevronDown className="size-3.5 text-violet-500" />,
  comment_added: <MessageSquare className="size-3.5 text-amber-500" />,
  activity_added: <CheckCircle2 className="size-3.5 text-emerald-500" />,
  proposal_linked: <FileText className="size-3.5 text-blue-500" />,
  edited: <Save className="size-3.5 text-zinc-400" />,
}

// ─── Utilities ─────────────────────────────────────────────────────────────

function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(isoString: string) {
  return new Date(`${isoString.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

// ─── Info field ─────────────────────────────────────────────────────────────

function InfoField({ label, value, icon }: { label: string; value: string | null; icon?: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      {icon && <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm mt-0.5 break-words">{value}</p>
      </div>
    </div>
  )
}

// ─── Section heading ─────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </p>
  )
}

// ─── Tab button ──────────────────────────────────────────────────────────────

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      )}
    >
      {children}
    </button>
  )
}

// ─── Overview tab ────────────────────────────────────────────────────────────

function OverviewTab({ lead, onUpdate }: { lead: LeadEntry; onUpdate: (updated: LeadEntry) => void }) {
  const [form, setForm] = useState<LeadForm>(createLeadFormFromEntry(lead))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(createLeadFormFromEntry(lead))
  }, [lead.id])

  function set(key: keyof LeadForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    onUpdate(updateLeadFromForm(lead, form))
    setTimeout(() => setSaving(false), 600)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-8">
      {/* Contact section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            Dados do Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Nome *</label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">E-mail</label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Telefone</label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">WhatsApp</label>
            <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Company section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Empresa</label>
            <Input value={form.company} onChange={(e) => set("company", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Segmento</label>
            <Input value={form.segment} onChange={(e) => set("segment", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Cidade</label>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
            <Input value={form.state} onChange={(e) => set("state", e.target.value)} maxLength={2} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Instagram</label>
            <Input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Site atual</label>
            <Input value={form.current_site} onChange={(e) => set("current_site", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Opportunity section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            Oportunidade
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Tipo de projeto</label>
            <select
              value={form.project_type}
              onChange={(e) => set("project_type", e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Selecionar…</option>
              {PROJECT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{PROJECT_TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Prazo desejado</label>
            <Input value={form.desired_deadline} onChange={(e) => set("desired_deadline", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Faixa de investimento</label>
            <Input value={form.investment_range} onChange={(e) => set("investment_range", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Valor estimado (R$)</label>
            <Input
              value={form.estimated_value}
              onChange={(e) => set("estimated_value", e.target.value)}
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Responsável</label>
            <Input value={form.responsible} onChange={(e) => set("responsible", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Objetivo do projeto</label>
            <Textarea
              value={form.project_objective}
              onChange={(e) => set("project_objective", e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Origin & Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Origem & Status</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Origem do lead</label>
            <select
              value={form.origin}
              onChange={(e) => set("origin", e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Selecionar…</option>
              {LEAD_ORIGIN_OPTIONS.map((o) => (
                <option key={o} value={o}>{LEAD_ORIGIN_LABEL[o]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Status do pipeline</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as LeadStatus)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {LEAD_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
          <Save className="size-3.5" />
          {saving ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  )
}

// ─── Briefing tab ────────────────────────────────────────────────────────────

function BriefingTab({ lead, onUpdate }: { lead: LeadEntry; onUpdate: (updated: LeadEntry) => void }) {
  const [briefing, setBriefing] = useState<BriefingData>({ ...EMPTY_BRIEFING, ...lead.briefing })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setBriefing({ ...EMPTY_BRIEFING, ...lead.briefing })
  }, [lead.id])

  function set(key: keyof BriefingData, value: string | boolean | string[]) {
    setBriefing((b) => ({ ...b, [key]: value }))
  }

  function toggleFeature(feature: string) {
    setBriefing((b) => ({
      ...b,
      features: b.features.includes(feature)
        ? b.features.filter((f) => f !== feature)
        : [...b.features, feature],
    }))
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    onUpdate(updateLeadBriefing(lead, briefing))
    setTimeout(() => setSaving(false), 600)
  }

  const textareaProps = (key: keyof BriefingData) => ({
    value: briefing[key] as string,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => set(key, e.target.value),
    className: "resize-none",
    rows: 3 as const,
  })

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-8">
      {/* Sobre o negócio */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Sobre o Negócio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">O que a empresa faz?</label>
            <Textarea {...textareaProps("what_do_you_do")} placeholder="Descreva as atividades principais…" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Quais serviços oferece?</label>
            <Textarea {...textareaProps("services_offered")} placeholder="Liste os principais serviços…" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Qual o diferencial?</label>
            <Textarea {...textareaProps("differentials")} placeholder="O que diferencia dos concorrentes?" />
          </div>
        </CardContent>
      </Card>

      {/* Objetivos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Objetivos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              O que espera alcançar com o novo site?
            </label>
            <Textarea {...textareaProps("site_goals")} placeholder="Mais clientes, mais autoridade, mais vendas…" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Quais são os principais objetivos?</label>
            <Textarea {...textareaProps("main_objectives")} placeholder="Liste os objetivos prioritários…" />
          </div>
        </CardContent>
      </Card>

      {/* Público */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Público-Alvo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Quem são seus clientes?</label>
            <Textarea {...textareaProps("target_audience")} placeholder="Faixa etária, perfil, localização…" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Existe uma persona principal?</label>
            <Textarea {...textareaProps("main_persona")} placeholder="Descreva a persona ideal…" />
          </div>
        </CardContent>
      </Card>

      {/* Referências */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Referências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Sites que gosta</label>
            <Textarea
              {...textareaProps("sites_liked")}
              placeholder="URLs ou nomes de sites de referência…"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Sites concorrentes</label>
            <Textarea
              {...textareaProps("competitor_sites")}
              placeholder="URLs de concorrentes diretos…"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Conteúdo existente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(
              [
                { key: "has_texts", label: "Já possui textos prontos?" },
                { key: "has_images", label: "Já possui fotos/imagens?" },
                { key: "has_branding", label: "Já possui identidade visual?" },
              ] as const
            ).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => set(key, !briefing[key])}
                  className={cn(
                    "size-5 rounded border-2 flex items-center justify-center transition-colors",
                    briefing[key]
                      ? "border-foreground bg-foreground"
                      : "border-border group-hover:border-muted-foreground"
                  )}
                >
                  {briefing[key] && <Check className="size-3 text-background" />}
                </div>
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Funcionalidades desejadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {BRIEFING_FEATURES.map((feature) => {
              const selected = briefing.features.includes(feature)
              return (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  className={cn(
                    "h-8 px-3 rounded-full text-sm border transition-colors",
                    selected
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground"
                  )}
                >
                  {feature}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
          <Save className="size-3.5" />
          {saving ? "Salvando…" : "Salvar briefing"}
        </Button>
      </div>
    </form>
  )
}

// ─── Timeline tab ────────────────────────────────────────────────────────────

function TimelineTab({ lead }: { lead: LeadEntry }) {
  const sorted = [...lead.timeline].sort((a, b) => b.created_at.localeCompare(a.created_at))

  return (
    <div className="pb-8">
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Nenhum evento registrado.</p>
      ) : (
        <div className="relative space-y-0">
          {sorted.map((event, idx) => (
            <div key={event.id} className="flex gap-3 relative">
              {/* Line */}
              {idx < sorted.length - 1 && (
                <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />
              )}
              {/* Icon */}
              <div className="size-7 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5 z-10">
                {TIMELINE_ICON[event.type] ?? <Circle className="size-3.5 text-muted-foreground" />}
              </div>
              {/* Content */}
              <div className="flex-1 pb-6 min-w-0">
                <p className="text-sm leading-snug">{event.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(event.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Comments tab ─────────────────────────────────────────────────────────────

function CommentsTab({ lead, onUpdate }: { lead: LeadEntry; onUpdate: (updated: LeadEntry) => void }) {
  const [text, setText] = useState("")
  const sorted = [...lead.comments].sort((a, b) => b.created_at.localeCompare(a.created_at))

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    onUpdate(addCommentToLead(lead, text))
    setText("")
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Add comment */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <form onSubmit={handleAdd} className="space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Adicionar observação interna… (ex: Cliente demonstrou urgência)"
              className="resize-none"
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={!text.trim()} className="gap-1.5">
                <MessageSquare className="size-3.5" />
                Comentar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Comment list */}
      {sorted.length > 0 ? (
        <div className="space-y-3">
          {sorted.map((comment) => (
            <Card key={comment.id} className="border-border/60">
              <CardContent className="pt-3 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="size-5 rounded-full bg-muted flex items-center justify-center">
                    <UserRound className="size-3 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-medium">{comment.author}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatDateTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum comentário ainda.</p>
      )}
    </div>
  )
}

// ─── Activities tab ──────────────────────────────────────────────────────────

function ActivitiesTab({ lead, onUpdate }: { lead: LeadEntry; onUpdate: (updated: LeadEntry) => void }) {
  const [formOpen, setFormOpen] = useState(false)
  const [type, setType] = useState<ActivityType>("call")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")

  const sorted = [...lead.activities].sort((a, b) => b.date.localeCompare(a.date))
  const pending = sorted.filter((a) => a.status === "pending")
  const done = sorted.filter((a) => a.status === "done")

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    onUpdate(
      addActivityToLead(lead, {
        type,
        description: description.trim(),
        date: date || new Date().toISOString().split("T")[0],
        status: "pending",
      })
    )
    setDescription("")
    setDate("")
    setFormOpen(false)
  }

  function handleToggle(activityId: string) {
    onUpdate(toggleActivityStatus(lead, activityId))
  }

  function ActivityItem({ activity }: { activity: LeadActivity }) {
    return (
      <div className="flex items-start gap-3">
        <button
          onClick={() => handleToggle(activity.id)}
          className={cn(
            "size-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
            activity.status === "done"
              ? "border-emerald-500 bg-emerald-500"
              : "border-border hover:border-muted-foreground"
          )}
        >
          {activity.status === "done" && <Check className="size-3 text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="text-[10px] h-4 px-1.5 font-normal border-zinc-300/50 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
            >
              {ACTIVITY_TYPE_LABEL[activity.type]}
            </Badge>
            <span
              className={cn(
                "text-xs text-muted-foreground",
                activity.status === "done" && "line-through opacity-60"
              )}
            >
              {activity.date
                ? new Date(`${activity.date}T00:00:00`).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })
                : ""}
            </span>
          </div>
          <p
            className={cn(
              "text-sm mt-0.5",
              activity.status === "done" && "line-through text-muted-foreground"
            )}
          >
            {activity.description}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Add button */}
      {!formOpen ? (
        <Button onClick={() => setFormOpen(true)} size="sm" variant="outline" className="gap-1.5">
          <Plus className="size-4" />
          Nova atividade
        </Button>
      ) : (
        <Card>
          <CardContent className="pt-4 pb-4">
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ActivityType)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {ACTIVITY_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{ACTIVITY_TYPE_LABEL[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Data</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Descrição *</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva a atividade…"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={!description.trim()}>
                  Adicionar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Pendentes ({pending.length})
          </p>
          <Card>
            <CardContent className="pt-4 pb-4 space-y-4">
              {pending.map((a) => (
                <ActivityItem key={a.id} activity={a} />
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Done */}
      {done.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Concluídas ({done.length})
          </p>
          <Card className="opacity-70">
            <CardContent className="pt-4 pb-4 space-y-4">
              {done.map((a) => (
                <ActivityItem key={a.id} activity={a} />
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {lead.activities.length === 0 && !formOpen && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma atividade registrada.
        </p>
      )}
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

type TabId = "overview" | "briefing" | "timeline" | "comments" | "activities"

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const leads = useSyncExternalStore(subscribeLeadsStore, getLeadsSnapshot, getLeadsServerSnapshot)
  const [activeTab, setActiveTab] = useState<TabId>("overview")

  const lead = useMemo(() => leads.find((l) => l.id === id) ?? null, [leads, id])

  function handleUpdate(updated: LeadEntry) {
    const current = getLeadsSnapshot()
    const next = current.map((l) => (l.id === updated.id ? updated : l))
    saveLeads(next)
    emitLeadsChange()
  }

  function handleDelete() {
    if (!confirm("Excluir este lead permanentemente?")) return
    const next = getLeadsSnapshot().filter((l) => l.id !== id)
    saveLeads(next)
    emitLeadsChange()
    router.push("/crm")
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
        <p className="text-muted-foreground text-sm">Lead não encontrado.</p>
        <Link href="/crm">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="size-4" />
            Voltar ao CRM
          </Button>
        </Link>
      </div>
    )
  }

  const pendingCount = lead.activities.filter((a) => a.status === "pending").length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 pt-5 pb-0 shrink-0">
        {/* Breadcrumb + actions */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/crm"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Leads & CRM
          </Link>

          <div className="flex items-center gap-2">
            {/* Generate proposal button */}
            <Link
              href={`/freelancer/proposals?leadId=${lead.id}&clientName=${encodeURIComponent(lead.name)}${lead.company ? `&company=${encodeURIComponent(lead.company)}` : ""}`}
            >
              <Button size="sm" variant="outline" className="gap-1.5">
                <FileText className="size-3.5" />
                Gerar Proposta
              </Button>
            </Link>
            {/* Delete */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="gap-1.5 text-muted-foreground hover:text-rose-600"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Lead identity */}
        <div className="flex items-start gap-4 mb-4">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center shrink-0 font-semibold text-lg text-muted-foreground">
            {lead.name
              .trim()
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase() || <UserRound className="size-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-xl font-semibold leading-tight">
                {lead.name || "Lead sem nome"}
              </h1>
              <Badge
                variant="outline"
                className={cn("font-normal shrink-0", STATUS_CLASS[lead.status])}
              >
                {LEAD_STATUS_LABEL[lead.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {lead.company && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="size-3.5" />
                  {lead.company}
                </span>
              )}
              {lead.project_type && (
                <span className="text-sm text-muted-foreground">
                  {PROJECT_TYPE_LABEL[lead.project_type as ProjectType]}
                </span>
              )}
              {lead.estimated_value !== null && (
                <span className="text-sm font-medium">
                  {money(lead.estimated_value)}
                </span>
              )}
              {lead.origin && (
                <span className="text-sm text-muted-foreground">
                  via {LEAD_ORIGIN_LABEL[lead.origin as LeadOrigin]}
                </span>
              )}
            </div>

            {/* Quick contact links */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Mail className="size-3" />
                  {lead.email}
                </a>
              )}
              {lead.whatsapp && (
                <a
                  href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Phone className="size-3" />
                  {lead.whatsapp}
                </a>
              )}
              {lead.current_site && (
                <a
                  href={
                    lead.current_site.startsWith("http")
                      ? lead.current_site
                      : `https://${lead.current_site}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <Globe className="size-3" />
                  Site atual
                  <ExternalLink className="size-2.5" />
                </a>
              )}
              {lead.instagram && (
                <a
                  href={`https://instagram.com/${lead.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <AtSign className="size-3" />
                  {lead.instagram}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <TabBtn active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
            Visão Geral
          </TabBtn>
          <TabBtn active={activeTab === "briefing"} onClick={() => setActiveTab("briefing")}>
            Briefing
          </TabBtn>
          <TabBtn active={activeTab === "activities"} onClick={() => setActiveTab("activities")}>
            Atividades{pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center size-4 rounded-full bg-amber-500 text-[9px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </TabBtn>
          <TabBtn active={activeTab === "comments"} onClick={() => setActiveTab("comments")}>
            Comentários{lead.comments.length > 0 && (
              <span className="ml-1.5 text-muted-foreground text-xs">
                {lead.comments.length}
              </span>
            )}
          </TabBtn>
          <TabBtn active={activeTab === "timeline"} onClick={() => setActiveTab("timeline")}>
            Timeline
          </TabBtn>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 pt-6">
          {activeTab === "overview" && (
            <OverviewTab lead={lead} onUpdate={handleUpdate} />
          )}
          {activeTab === "briefing" && (
            <BriefingTab lead={lead} onUpdate={handleUpdate} />
          )}
          {activeTab === "timeline" && (
            <TimelineTab lead={lead} />
          )}
          {activeTab === "comments" && (
            <CommentsTab lead={lead} onUpdate={handleUpdate} />
          )}
          {activeTab === "activities" && (
            <ActivitiesTab lead={lead} onUpdate={handleUpdate} />
          )}
        </div>
      </div>
    </div>
  )
}
