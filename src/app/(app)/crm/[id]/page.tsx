"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import {
  ArrowLeft,
  ArrowRight,
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
  Trophy,
  User,
  UserRound,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  addActivityToLead,
  addCommentToLead,
  ACTIVITY_TYPE_LABEL,
  ACTIVITY_TYPE_OPTIONS,
  BRIEFING_FEATURES,
  emitLeadsChange,
  getLeadsServerSnapshot,
  getLeadsSnapshot,
  getNextStage,
  getPrevStage,
  LEAD_ORIGIN_LABEL,
  LEAD_ORIGIN_OPTIONS,
  moveLeadToStage,
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABEL,
  PROJECT_TYPE_LABEL,
  PROJECT_TYPE_OPTIONS,
  saveLeads,
  subscribeLeadsStore,
  toggleActivityStatus,
  updateLeadBriefing,
  updateLeadSections,
  type ActivityStatus,
  type ActivityType,
  type BriefingData,
  type LeadActivity,
  type LeadEntry,
  type LeadOrigin,
  type PipelineStage,
  type ProjectType,
  EMPTY_BRIEFING,
} from "@/lib/crm/store"
import { PipelineTracker, StageBadge, StageChecklist } from "@/components/crm"

// ─── Badge maps ────────────────────────────────────────────────────────────

const TIMELINE_ICON: Record<string, React.ReactNode> = {
  created: <Circle className="size-3.5 text-muted-foreground" />,
  stage_changed: <ChevronDown className="size-3.5 text-foreground" />,
  status_changed: <ChevronDown className="size-3.5 text-foreground" />,
  comment_added: <MessageSquare className="size-3.5 text-muted-foreground" />,
  activity_added: <CheckCircle2 className="size-3.5 text-foreground" />,
  proposal_linked: <FileText className="size-3.5 text-foreground" />,
  edited: <Save className="size-3.5 text-muted-foreground" />,
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

// ─── Shared field primitives ──────────────────────────────────────────────

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

const selectClass =
  "w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"

function parseMoney(value: string): number | null {
  if (!value.trim()) return null
  const n = parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", "."))
  return Number.isFinite(n) ? n : null
}

// ─── Overview tab ────────────────────────────────────────────────────────────

function OverviewTab({ lead, onUpdate }: { lead: LeadEntry; onUpdate: (updated: LeadEntry) => void }) {
  const [prospect, setProspect] = useState(lead.prospect)
  const [qual, setQual] = useState(lead.qualification)
  const [opp, setOpp] = useState(lead.opportunity)
  const [comm, setComm] = useState(lead.communication)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setProspect(lead.prospect)
    setQual(lead.qualification)
    setOpp(lead.opportunity)
    setComm(lead.communication)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    onUpdate(
      updateLeadSections(lead, {
        prospect,
        qualification: qual,
        opportunity: opp,
        communication: comm,
      })
    )
    setTimeout(() => setSaving(false), 600)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-24">
      {/* Stage checklist — what's left in the current stage */}
      <StageChecklist lead={lead} stage={lead.status_stage} />

      {/* Empresa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building2 className="size-4 text-muted-foreground" />
            Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Empresa" className="sm:col-span-2">
            <Input
              value={prospect.company}
              onChange={(e) => setProspect((p) => ({ ...p, company: e.target.value }))}
            />
          </Field>
          <Field label="Segmento">
            <Input
              value={prospect.segment ?? ""}
              onChange={(e) => setProspect((p) => ({ ...p, segment: e.target.value }))}
            />
          </Field>
          <Field label="Cidade">
            <Input
              value={prospect.city ?? ""}
              onChange={(e) => setProspect((p) => ({ ...p, city: e.target.value }))}
            />
          </Field>
          <Field label="Estado">
            <Input
              value={prospect.state ?? ""}
              maxLength={2}
              onChange={(e) => setProspect((p) => ({ ...p, state: e.target.value }))}
            />
          </Field>
          <Field label="Origem">
            <select
              value={prospect.origin ?? ""}
              onChange={(e) =>
                setProspect((p) => ({ ...p, origin: e.target.value as LeadOrigin | "" }))
              }
              className={selectClass}
            >
              <option value="">Selecionar…</option>
              {LEAD_ORIGIN_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {LEAD_ORIGIN_LABEL[o]}
                </option>
              ))}
            </select>
          </Field>
        </CardContent>
      </Card>

      {/* Qualificação */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <User className="size-4 text-muted-foreground" />
            Qualificação
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nome do contato">
            <Input
              value={qual.contact_name ?? ""}
              onChange={(e) => setQual((q) => ({ ...q, contact_name: e.target.value }))}
            />
          </Field>
          <Field label="Cargo">
            <Input
              value={qual.job_title ?? ""}
              onChange={(e) => setQual((q) => ({ ...q, job_title: e.target.value }))}
            />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              value={qual.email ?? ""}
              onChange={(e) => setQual((q) => ({ ...q, email: e.target.value }))}
            />
          </Field>
          <Field label="Telefone">
            <Input
              value={qual.phone ?? ""}
              onChange={(e) => setQual((q) => ({ ...q, phone: e.target.value }))}
            />
          </Field>
          <Field label="Tipo de projeto">
            <select
              value={qual.project_type ?? ""}
              onChange={(e) =>
                setQual((q) => ({ ...q, project_type: e.target.value as ProjectType | "" }))
              }
              className={selectClass}
            >
              <option value="">Selecionar…</option>
              {PROJECT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {PROJECT_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prazo desejado">
            <Input
              value={qual.desired_deadline ?? ""}
              placeholder="Ex: 30 dias"
              onChange={(e) => setQual((q) => ({ ...q, desired_deadline: e.target.value }))}
            />
          </Field>
          <Field label="Faixa de investimento" className="sm:col-span-2">
            <Input
              value={qual.investment_range ?? ""}
              placeholder="Ex: R$ 3k–6k"
              onChange={(e) => setQual((q) => ({ ...q, investment_range: e.target.value }))}
            />
          </Field>
          <Field label="Objetivo do projeto" className="sm:col-span-2">
            <Textarea
              value={qual.project_objective ?? ""}
              onChange={(e) => setQual((q) => ({ ...q, project_objective: e.target.value }))}
              className="resize-none"
              rows={3}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Oportunidade */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-muted-foreground" />
            Oportunidade
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Valor estimado (R$)">
            <Input
              inputMode="decimal"
              value={opp.estimated_value ?? ""}
              onChange={(e) => setOpp((o) => ({ ...o, estimated_value: parseMoney(e.target.value) }))}
            />
          </Field>
          <Field label="Valor enviado (R$)">
            <Input
              inputMode="decimal"
              value={opp.quote_value ?? ""}
              onChange={(e) => setOpp((o) => ({ ...o, quote_value: parseMoney(e.target.value) }))}
            />
          </Field>
          <Field label="Valor fechado (R$)">
            <Input
              inputMode="decimal"
              value={opp.closed_value ?? ""}
              onChange={(e) => setOpp((o) => ({ ...o, closed_value: parseMoney(e.target.value) }))}
            />
          </Field>
          <Field label="Probabilidade de fechamento" className="sm:col-span-3">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={opp.closing_probability ?? 0}
                onChange={(e) =>
                  setOpp((o) => ({ ...o, closing_probability: Number(e.target.value) }))
                }
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-foreground"
              />
              <span className="w-12 text-right font-mono text-sm tabular-nums">
                {opp.closing_probability ?? 0}%
              </span>
            </div>
          </Field>
          <Field label="Observações" className="sm:col-span-3">
            <Textarea
              value={opp.notes ?? ""}
              onChange={(e) => setOpp((o) => ({ ...o, notes: e.target.value }))}
              className="resize-none"
              rows={3}
              placeholder="Notas comerciais, contexto da negociação…"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Contato & Canais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Phone className="size-4 text-muted-foreground" />
            Contato & Canais
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="WhatsApp">
            <Input
              value={comm.whatsapp ?? ""}
              placeholder="+55 27 99999-9999"
              onChange={(e) => setComm((c) => ({ ...c, whatsapp: e.target.value }))}
            />
          </Field>
          <Field label="Instagram">
            <Input
              value={comm.instagram ?? ""}
              placeholder="@perfil"
              onChange={(e) => setComm((c) => ({ ...c, instagram: e.target.value }))}
            />
          </Field>
          <Field label="Site atual" className="sm:col-span-2">
            <Input
              value={comm.current_site ?? ""}
              placeholder="https://…"
              onChange={(e) => setComm((c) => ({ ...c, current_site: e.target.value }))}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 -mx-6 flex justify-end border-t bg-background/80 px-6 py-3 backdrop-blur">
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

  function handleMoveStage(current: LeadEntry, toStage: PipelineStage) {
    if (toStage === current.status_stage) return
    const forward = PIPELINE_STAGES.indexOf(toStage) > PIPELINE_STAGES.indexOf(current.status_stage)
    const verb = forward ? "Avançar" : "Retornar"
    if (!confirm(`${verb} este lead para "${PIPELINE_STAGE_LABEL[toStage]}"?`)) return
    handleUpdate(moveLeadToStage(current, toStage))
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
  const nextStage = getNextStage(lead)
  const prevStage = getPrevStage(lead)
  const contactName = lead.qualification.contact_name?.trim() ?? ""
  const titleInitial = (lead.prospect.company || contactName || "?").trim().charAt(0).toUpperCase()
  const completionByStage = Object.fromEntries(
    Object.entries(lead.stage_completion).map(([s, c]) => [s, c.completion_percentage])
  ) as Partial<Record<PipelineStage, number>>

  const waLink = lead.communication.whatsapp
    ? `https://wa.me/${lead.communication.whatsapp.replace(/\D/g, "")}`
    : null
  const igHandle = lead.communication.instagram?.replace("@", "")
  const siteLink = lead.communication.current_site
    ? lead.communication.current_site.startsWith("http")
      ? lead.communication.current_site
      : `https://${lead.communication.current_site}`
    : null

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
        <div className="mb-5 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-lg font-semibold text-background">
            {titleInitial || <UserRound className="size-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold leading-tight tracking-tight">
                {lead.prospect.company || contactName || "Lead sem empresa"}
              </h1>
              <StageBadge stage={lead.status_stage} solid />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              {contactName && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="size-3.5" />
                  {contactName}
                  {lead.qualification.job_title ? ` · ${lead.qualification.job_title}` : ""}
                </span>
              )}
              {lead.prospect.segment && (
                <span className="text-sm text-muted-foreground">{lead.prospect.segment}</span>
              )}
              {lead.prospect.city && (
                <span className="text-sm text-muted-foreground">{lead.prospect.city}</span>
              )}
              {lead.prospect.origin && (
                <span className="text-sm text-muted-foreground">
                  via {LEAD_ORIGIN_LABEL[lead.prospect.origin as LeadOrigin]}
                </span>
              )}
            </div>

            {/* Quick contact links */}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {lead.qualification.email && (
                <a
                  href={`mailto:${lead.qualification.email}`}
                  className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail className="size-3" />
                  {lead.qualification.email}
                </a>
              )}
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Phone className="size-3" />
                  {lead.communication.whatsapp}
                </a>
              )}
              {siteLink && (
                <a
                  href={siteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Globe className="size-3" />
                  Site atual
                  <ExternalLink className="size-2.5" />
                </a>
              )}
              {igHandle && (
                <a
                  href={`https://instagram.com/${igHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <AtSign className="size-3" />
                  {lead.communication.instagram}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline tracker — the hero */}
        <div className="mb-5 rounded-2xl border border-border/70 bg-gradient-to-b from-muted/40 to-card px-4 py-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Jornada comercial
            </p>
            <div className="flex items-center gap-1.5">
              {prevStage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMoveStage(lead, prevStage)}
                  className="h-7 gap-1.5 px-2.5 text-xs"
                  title={`Retornar para ${PIPELINE_STAGE_LABEL[prevStage]}`}
                >
                  <ArrowLeft className="size-3.5" />
                  <span className="hidden sm:inline">Voltar</span>
                </Button>
              )}
              {nextStage ? (
                <Button
                  size="sm"
                  onClick={() => handleMoveStage(lead, nextStage)}
                  className="h-7 gap-1.5 px-3 text-xs"
                >
                  Avançar para {PIPELINE_STAGE_LABEL[nextStage]}
                  <ArrowRight className="size-3.5" />
                </Button>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Trophy className="size-3.5" />
                  Cliente conquistado
                </span>
              )}
            </div>
          </div>
          <PipelineTracker
            current={lead.status_stage}
            completionByStage={completionByStage}
            onSelect={(stage) => handleMoveStage(lead, stage)}
          />
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
