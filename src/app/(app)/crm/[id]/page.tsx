"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Ban,
  Building2,
  ExternalLink,
  FileText,
  Globe,
  Mail,
  MessageSquare,
  Phone,
  RotateCcw,
  Save,
  Trash2,
  Trophy,
  User,
  UserRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  emitLeadsChange,
  getLeadsServerSnapshot,
  getLeadsSnapshot,
  getNextStage,
  getPrevStage,
  LEAD_ORIGIN_LABEL,
  LEAD_ORIGIN_OPTIONS,
  markLeadLost,
  moveLeadToStage,
  PIPELINE_STAGE_LABEL,
  PROJECT_TYPE_LABEL,
  PROJECT_TYPE_OPTIONS,
  reopenLead,
  saveLeads,
  subscribeLeadsStore,
  updateLeadSections,
  type LeadEntry,
  type LeadOrigin,
  type PipelineStage,
  type ProjectType,
} from "@/lib/crm/store"
import { PipelineTracker, StageBadge } from "@/components/crm"

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
          <Field label="E-mail">
            <Input
              type="email"
              value={qual.email ?? ""}
              onChange={(e) => setQual((q) => ({ ...q, email: e.target.value }))}
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
          <Field label="O que precisa / objetivo" className="sm:col-span-2">
            <Textarea
              value={qual.project_objective ?? ""}
              onChange={(e) => setQual((q) => ({ ...q, project_objective: e.target.value }))}
              className="resize-none"
              rows={3}
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

      {/* Observações */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="size-4 text-muted-foreground" />
            Observações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={opp.notes ?? ""}
            onChange={(e) => setOpp((o) => ({ ...o, notes: e.target.value }))}
            className="resize-none"
            rows={3}
            placeholder="Anotações livres sobre este lead…"
          />
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

// ─── Page ───────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const leads = useSyncExternalStore(subscribeLeadsStore, getLeadsSnapshot, getLeadsServerSnapshot)

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
    handleUpdate(moveLeadToStage(current, toStage))
  }

  function handleMarkLost(current: LeadEntry) {
    const reason = prompt("Motivo (opcional):") ?? ""
    handleUpdate(markLeadLost(current, reason))
  }

  function handleReopen(current: LeadEntry) {
    handleUpdate(reopenLead(current))
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

  const nextStage = getNextStage(lead)
  const prevStage = getPrevStage(lead)
  const contactName = lead.qualification.contact_name?.trim() ?? ""
  const titleInitial = (lead.prospect.company || contactName || "?").trim().charAt(0).toUpperCase()

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
      <div className="border-b px-6 pt-5 pb-5 shrink-0">
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
              {lead.lost ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium leading-5 text-muted-foreground">
                  <Ban className="size-3" strokeWidth={2} />
                  Perdido
                </span>
              ) : (
                <StageBadge stage={lead.status_stage} solid />
              )}
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
              {lead.lost ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReopen(lead)}
                  className="h-7 gap-1.5 px-3 text-xs"
                >
                  <RotateCcw className="size-3.5" />
                  Reabrir
                </Button>
              ) : (
                <>
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMarkLost(lead)}
                    className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                    title="Marcar como perdido"
                  >
                    <Ban className="size-3.5" />
                    <span className="hidden sm:inline">Perdido</span>
                  </Button>
                </>
              )}
            </div>
          </div>
          <PipelineTracker
            current={lead.status_stage}
            onSelect={lead.lost ? undefined : (stage) => handleMoveStage(lead, stage)}
            className={lead.lost ? "opacity-50" : undefined}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 pt-6">
          <OverviewTab lead={lead} onUpdate={handleUpdate} />
        </div>
      </div>
    </div>
  )
}
