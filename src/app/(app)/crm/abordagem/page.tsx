"use client"

import Link from "next/link"
import { useMemo, useState, useSyncExternalStore } from "react"
import {
  ArrowLeft,
  AtSign,
  Ban,
  CalendarClock,
  Check,
  ExternalLink,
  Globe,
  Inbox,
  Mail,
  MessageCircle,
  MessageSquareReply,
  PencilLine,
  RotateCcw,
  SkipForward,
  Undo2,
  UserRound,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  emitLeadsChange,
  getLeadsServerSnapshot,
  getLeadsSnapshot,
  saveLeads,
  subscribeLeadsStore,
  updateCommunication,
  updateQualification,
  type LeadActivity,
  type LeadEntry,
} from "@/lib/crm/store"
import {
  approachedToday,
  availableChannels,
  CHANNEL_LABEL,
  DEFAULT_OUTREACH_TEMPLATES,
  defaultInitialTemplate,
  dueFollowup,
  emailLink,
  followupNumber,
  followupQueue,
  formatShortDate,
  getTemplatesServerSnapshot,
  getTemplatesSnapshot,
  instagramDmLink,
  instagramHandle,
  leadCompany,
  leadEmail,
  leadInstagram,
  leadSite,
  leadWhatsapp,
  localDate,
  OUTREACH_TEMPLATE_LABEL,
  OUTREACH_VARIABLES,
  registerFollowupSent,
  registerInitialOutreach,
  registerNotInterested,
  registerReplied,
  renderTemplate,
  saveTemplates,
  subscribeTemplates,
  toApproachQueue,
  waitingCount,
  whatsappLink,
  type OutreachChannel,
  type OutreachTemplateKey,
  type OutreachTemplates,
} from "@/lib/crm/outreach"

// ─── Helpers ────────────────────────────────────────────────────────────────

type Mode = "approach" | "followup"

function persistLead(updated: LeadEntry) {
  saveLeads(getLeadsSnapshot().map((l) => (l.id === updated.id ? updated : l)))
  emitLeadsChange()
}

function siteHref(site: string) {
  return site.startsWith("http") ? site : `https://${site}`
}

const CHANNEL_ICON: Record<OutreachChannel, React.ElementType> = {
  whatsapp: MessageCircle,
  instagram: AtSign,
  email: Mail,
}

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

// ─── Contact quick edit ─────────────────────────────────────────────────────

function ContactForm({ lead, onSave, onCancel }: {
  lead: LeadEntry
  onSave: (data: { contact_name: string; whatsapp: string; instagram: string; current_site: string }) => void
  onCancel?: () => void
}) {
  const [form, setForm] = useState({
    contact_name: lead.qualification.contact_name ?? "",
    whatsapp: leadWhatsapp(lead),
    instagram: leadInstagram(lead),
    current_site: leadSite(lead),
  })

  function field(key: keyof typeof form, label: string, placeholder: string) {
    return (
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
        <Input
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="h-8 text-sm"
        />
      </div>
    )
  }

  return (
    <form
      className="space-y-3 rounded-xl border border-dashed p-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(form)
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {field("contact_name", "Nome do contato", "Ex: Dra. Ana Souza")}
        {field("whatsapp", "WhatsApp", "Ex: 27 99999-9999")}
        {field("instagram", "Instagram", "@clinica")}
        {field("current_site", "Site atual", "clinica.com.br (vazio = sem site)")}
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" size="sm">
          Salvar contato
        </Button>
      </div>
    </form>
  )
}

// ─── Focus card ─────────────────────────────────────────────────────────────

interface FocusCardProps {
  lead: LeadEntry
  mode: Mode
  templates: OutreachTemplates
  followup: LeadActivity | null
  position: { index: number; total: number }
  onSend: (channel: OutreachChannel, message: string) => void
  onSkip: () => void
  onReplied: () => void
  onNotInterested: () => void
  onSaveContact: (data: { contact_name: string; whatsapp: string; instagram: string; current_site: string }) => void
}

function FocusCard({
  lead,
  mode,
  templates,
  followup,
  position,
  onSend,
  onSkip,
  onReplied,
  onNotInterested,
  onSaveContact,
}: FocusCardProps) {
  const initialKey: OutreachTemplateKey =
    mode === "followup"
      ? followup && followupNumber(followup) === 2
        ? "followup_2"
        : "followup_1"
      : defaultInitialTemplate(lead)

  const [templateKey, setTemplateKey] = useState<OutreachTemplateKey>(initialKey)
  const [message, setMessage] = useState(() => renderTemplate(templates[initialKey], lead))
  const [editingContact, setEditingContact] = useState(false)
  const [copied, setCopied] = useState(false)

  const channels = availableChannels(lead)
  const site = leadSite(lead)
  const contactName = lead.qualification.contact_name?.trim()
  const templateOptions: OutreachTemplateKey[] =
    mode === "followup" ? ["followup_1", "followup_2"] : ["no_site", "has_site"]

  function pickTemplate(key: OutreachTemplateKey) {
    setTemplateKey(key)
    setMessage(renderTemplate(templates[key], lead))
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard bloqueado: o usuário ainda pode copiar manualmente.
    }
  }

  function channelHref(channel: OutreachChannel) {
    if (channel === "whatsapp") return whatsappLink(leadWhatsapp(lead), message)
    if (channel === "instagram") return instagramDmLink(leadInstagram(lead))
    return emailLink(leadEmail(lead), message, leadCompany(lead))
  }

  function handleChannelClick(channel: OutreachChannel) {
    // Instagram não aceita texto pré-preenchido: copia antes de abrir a DM.
    if (channel === "instagram") void navigator.clipboard?.writeText(message).catch(() => {})
    onSend(channel, message)
  }

  return (
    <Card className="py-0">
      <CardContent className="space-y-5 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-sm font-semibold text-background">
              {leadCompany(lead).charAt(0).toUpperCase() || <UserRound className="size-4" />}
            </div>
            <div className="min-w-0">
              <Link
                href={`/crm/${lead.id}`}
                className="block truncate text-lg font-semibold underline-offset-2 hover:underline"
              >
                {leadCompany(lead)}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {[contactName, lead.prospect.segment, lead.prospect.city].filter(Boolean).join(" · ") || "Sem detalhes"}
              </p>
            </div>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {position.index + 1} de {position.total}
          </span>
        </div>

        {/* Context chips */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {site ? (
            <a
              href={siteHref(site)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 hover:bg-muted"
            >
              <Globe className="size-3" />
              {site.replace(/^https?:\/\//, "")}
              <ExternalLink className="size-3 opacity-50" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-muted-foreground">
              <Globe className="size-3" />
              Sem site
            </span>
          )}
          {channels.map((c) => {
            const Icon = CHANNEL_ICON[c]
            return (
              <span key={c} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-muted-foreground">
                <Icon className="size-3" />
                {c === "instagram" ? `@${instagramHandle(leadInstagram(lead))}` : CHANNEL_LABEL[c]}
              </span>
            )
          })}
          {mode === "followup" && followup && (
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-0.5 text-background">
              <CalendarClock className="size-3" />
              {followup.description} · {formatShortDate(followup.date)}
            </span>
          )}
          {!editingContact && channels.length > 0 && (
            <button
              type="button"
              onClick={() => setEditingContact(true)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-muted-foreground hover:text-foreground"
            >
              <PencilLine className="size-3" />
              Editar contato
            </button>
          )}
        </div>

        {/* Contact form when needed */}
        {(channels.length === 0 || editingContact) && (
          <div className="space-y-2">
            {channels.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Este lead ainda não tem WhatsApp, Instagram ou e-mail. Cole um contato para liberar o envio.
              </p>
            )}
            <ContactForm
              lead={lead}
              onCancel={channels.length > 0 ? () => setEditingContact(false) : undefined}
              onSave={(data) => {
                onSaveContact(data)
                setEditingContact(false)
              }}
            />
          </div>
        )}

        {/* Template picker */}
        <div className="flex flex-wrap gap-1">
          {templateOptions.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => pickTemplate(key)}
              className={cn(
                "h-7 rounded-full border px-2.5 text-xs font-medium transition-colors",
                templateKey === key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              )}
            >
              {OUTREACH_TEMPLATE_LABEL[key]}
            </button>
          ))}
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-32 text-sm"
            aria-label="Mensagem"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Ajuste à vontade. A mudança vale só para este lead.</span>
            <button type="button" onClick={copyMessage} className="inline-flex items-center gap-1 hover:text-foreground">
              {copied ? <Check className="size-3" /> : null}
              {copied ? "Copiado" : "Copiar texto"}
            </button>
          </div>
        </div>

        {/* Send actions */}
        <div className="flex flex-wrap gap-2">
          {channels.map((channel, i) => {
            const Icon = CHANNEL_ICON[channel]
            const label =
              channel === "instagram" ? "Copiar e abrir DM" : `Abrir no ${CHANNEL_LABEL[channel]}`
            return (
              <a
                key={channel}
                href={channelHref(channel)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleChannelClick(channel)}
                className={cn(
                  buttonVariants({ variant: i === 0 ? "default" : "outline", size: "lg" }),
                  "gap-2 px-4"
                )}
              >
                <Icon className="size-4" />
                {label}
              </a>
            )
          })}
        </div>

        {/* Secondary actions */}
        <div className="flex flex-wrap items-center gap-1 border-t pt-4">
          <Button variant="ghost" size="sm" onClick={onSkip} className="gap-1.5">
            <SkipForward className="size-3.5" />
            Pular
          </Button>
          {mode === "followup" && (
            <Button variant="ghost" size="sm" onClick={onReplied} className="gap-1.5">
              <MessageSquareReply className="size-3.5" />
              Respondeu
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onNotInterested}
            className="ml-auto gap-1.5 text-muted-foreground"
          >
            <Ban className="size-3.5" />
            Sem interesse
          </Button>
        </div>
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
