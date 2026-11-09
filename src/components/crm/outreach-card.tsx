"use client"

import Link from "next/link"
import { useState, useSyncExternalStore } from "react"
import {
  AtSign,
  Ban,
  CalendarClock,
  Check,
  ExternalLink,
  Globe,
  Mail,
  MessageCircle,
  MessageSquareReply,
  PencilLine,
  SkipForward,
  UserRound,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  emitLeadsChange,
  getLeadsSnapshot,
  saveLeads,
  updateCommunication,
  updateQualification,
  type LeadActivity,
  type LeadEntry,
} from "@/lib/crm/store"
import {
  availableChannels,
  CHANNEL_LABEL,
  defaultInitialTemplate,
  emailLink,
  dueFollowup,
  followupNumber,
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
  OUTREACH_TEMPLATE_LABEL,
  outreachModeFor,
  registerFollowupSent,
  registerInitialOutreach,
  registerNotInterested,
  registerReplied,
  renderTemplate,
  subscribeTemplates,
  whatsappLink,
  type OutreachChannel,
  type OutreachTemplateKey,
  type OutreachTemplates,
} from "@/lib/crm/outreach"

// Peças do Modo Abordagem compartilhadas entre a fila (/crm/abordagem) e a
// gaveta de abordagem dentro do lead (/crm/[id]).

export type Mode = "approach" | "followup"

export function persistLead(updated: LeadEntry) {
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

// ─── Contact quick edit ─────────────────────────────────────────────────────

export function ContactForm({ lead, onSave, onCancel }: {
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

export interface FocusCardProps {
  lead: LeadEntry
  mode: Mode
  templates: OutreachTemplates
  followup: LeadActivity | null
  /** Posição na fila. Sem ela, o contador "1 de N" some (uso fora da fila). */
  position?: { index: number; total: number }
  onSend: (channel: OutreachChannel, message: string) => void
  /** Sem ela, o botão "Pular" não aparece (uso fora da fila). */
  onSkip?: () => void
  onReplied: () => void
  onNotInterested: () => void
  onSaveContact: (data: { contact_name: string; whatsapp: string; instagram: string; current_site: string }) => void
  /** Nome da empresa vira link para o lead. Desligue quando o card já está no lead. */
  linkToLead?: boolean
}

export function FocusCard({
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
  linkToLead = true,
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
              {linkToLead ? (
                <Link
                  href={`/crm/${lead.id}`}
                  className="block truncate text-lg font-semibold underline-offset-2 hover:underline"
                >
                  {leadCompany(lead)}
                </Link>
              ) : (
                <p className="truncate text-lg font-semibold">{leadCompany(lead)}</p>
              )}
              <p className="truncate text-xs text-muted-foreground">
                {[contactName, lead.prospect.segment, lead.prospect.city].filter(Boolean).join(" · ") || "Sem detalhes"}
              </p>
            </div>
          </div>
          {position && (
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {position.index + 1} de {position.total}
            </span>
          )}
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
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip} className="gap-1.5">
              <SkipForward className="size-3.5" />
              Pular
            </Button>
          )}
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

// ─── Gaveta de abordagem dentro do lead ─────────────────────────────────────

/**
 * Abre a abordagem de UM lead sem sair da tela dele. Escolhe sozinha entre
 * primeira abordagem e follow-up vencido (ver `outreachModeFor`) e registra
 * o envio no mesmo formato da fila em /crm/abordagem.
 */
export function OutreachSheet({ lead, open, onOpenChange }: {
  lead: LeadEntry
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const templates = useSyncExternalStore(subscribeTemplates, getTemplatesSnapshot, getTemplatesServerSnapshot)
  const mode = outreachModeFor(lead)
  const followup = mode === "followup" ? dueFollowup(lead) : null

  function done(updated: LeadEntry) {
    persistLead(updated)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle>{mode === "followup" ? "Follow-up" : "Abordar lead"}</SheetTitle>
          <SheetDescription>
            Revise a mensagem, envie em 1 clique e o envio fica registrado no lead.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {open && mode ? (
            <FocusCard
              key={`${lead.id}-${mode}-${followup?.id ?? ""}-${lead.updated_at}`}
              lead={lead}
              mode={mode}
              templates={templates}
              followup={followup}
              linkToLead={false}
              onSend={(channel, message) => {
                if (mode === "approach") done(registerInitialOutreach(lead, channel, message))
                else if (followup) done(registerFollowupSent(lead, followup.id, channel))
              }}
              onReplied={() => done(registerReplied(lead))}
              onNotInterested={() => done(registerNotInterested(lead))}
              onSaveContact={(data) => {
                let updated = updateQualification(lead, { contact_name: data.contact_name.trim() })
                updated = updateCommunication(updated, {
                  whatsapp: data.whatsapp.trim(),
                  instagram: data.instagram.trim(),
                  current_site: data.current_site.trim(),
                })
                persistLead(updated)
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Este lead não tem abordagem pendente agora.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
