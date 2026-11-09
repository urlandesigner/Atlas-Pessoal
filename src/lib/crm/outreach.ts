"use client"

import {
  addActivityToLead,
  addCommentToLead,
  markLeadLost,
  moveLeadToStage,
  type LeadActivity,
  type LeadEntry,
} from "@/lib/crm/store"

// ─── Templates ──────────────────────────────────────────────────────────────

export type OutreachTemplateKey = "no_site" | "has_site" | "followup_1" | "followup_2"

export type OutreachTemplates = Record<OutreachTemplateKey, string>

export const OUTREACH_TEMPLATE_LABEL: Record<OutreachTemplateKey, string> = {
  no_site: "Primeira mensagem · sem site",
  has_site: "Primeira mensagem · tem site",
  followup_1: "Follow-up 1 · D+3",
  followup_2: "Follow-up 2 · D+7",
}

export const OUTREACH_VARIABLES = [
  { key: "{saudacao}", hint: "“Oi, Ana!” ou “Oi, tudo bem?” se não houver nome" },
  { key: "{nome}", hint: "Primeiro nome do contato (mantém Dr./Dra.)" },
  { key: "{empresa}", hint: "Nome da empresa / clínica" },
  { key: "{segmento}", hint: "Segmento ou especialidade" },
  { key: "{cidade}", hint: "Cidade do lead" },
  { key: "{site}", hint: "Site atual do lead" },
] as const

export const DEFAULT_OUTREACH_TEMPLATES: OutreachTemplates = {
  no_site:
    "{saudacao} Aqui é o Urlan, de Vitória. Pesquisei {segmento} em {cidade} no Google e não achei um site da {empresa}. Fiz estes para profissionais de saúde aqui no ES: https://udlabs.com.br/?ref=whatsapp#portfolio. Se quiser, te mostro como ficaria o seu.",
  has_site:
    "{saudacao} Sou o Urlan, crio sites sob medida para profissionais de saúde aqui no ES. Dei uma olhada no site da {empresa} ({site}) e anotei 2 pontos que podem estar fazendo pacientes desistirem antes de agendar. Posso te mandar? É rápido e sem compromisso.",
  followup_1:
    "{saudacao} Conseguiu ver minha mensagem? Se fizer sentido, te explico em 10 minutos por ligação, no horário que for melhor pra você.",
  followup_2:
    "{saudacao} Última mensagem por aqui, prometo 🙂 Se agora não for o momento, sem problema. Fico à disposição quando quiser fortalecer a presença online da {empresa}.",
}

const TEMPLATES_STORAGE_KEY = "atlas_outreach_templates"
const TEMPLATES_EVENT = "atlas-outreach-templates-change"

let cachedTemplates: OutreachTemplates | null = null

function readStoredTemplates(): OutreachTemplates {
  try {
    const raw = window.localStorage.getItem(TEMPLATES_STORAGE_KEY)
    if (!raw) return DEFAULT_OUTREACH_TEMPLATES
    const parsed = JSON.parse(raw) as Partial<OutreachTemplates>
    return { ...DEFAULT_OUTREACH_TEMPLATES, ...parsed }
  } catch {
    return DEFAULT_OUTREACH_TEMPLATES
  }
}

export function getTemplatesSnapshot(): OutreachTemplates {
  if (cachedTemplates === null) cachedTemplates = readStoredTemplates()
  return cachedTemplates
}

export function getTemplatesServerSnapshot(): OutreachTemplates {
  return DEFAULT_OUTREACH_TEMPLATES
}

export function subscribeTemplates(onChange: () => void) {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(TEMPLATES_EVENT, onChange)
  return () => window.removeEventListener(TEMPLATES_EVENT, onChange)
}

export function saveTemplates(templates: OutreachTemplates) {
  cachedTemplates = templates
  try {
    window.localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
  } catch {
    // Storage indisponível: mantém só em memória nesta sessão.
  }
  window.dispatchEvent(new Event(TEMPLATES_EVENT))
}

// ─── Lead helpers ───────────────────────────────────────────────────────────

const TITLE_RE = /^(dr|dra|dr\(a\))\.?$/i

/** "Dra. Ana Souza" → "Dra. Ana"; "Ana Souza" → "Ana". */
export function firstName(fullName: string | undefined): string {
  const tokens = (fullName ?? "").trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return ""
  if (TITLE_RE.test(tokens[0]) && tokens[1]) return `${tokens[0]} ${tokens[1]}`
  return tokens[0]
}

export function leadCompany(lead: LeadEntry) {
  return lead.prospect.company || lead.qualification.contact_name?.trim() || "Lead sem empresa"
}

export function leadSite(lead: LeadEntry) {
  return (lead.communication.current_site ?? lead.current_site ?? "").trim()
}

export function leadWhatsapp(lead: LeadEntry) {
  return (lead.communication.whatsapp ?? lead.whatsapp ?? "").trim()
}

export function leadInstagram(lead: LeadEntry) {
  return (lead.communication.instagram ?? lead.instagram ?? "").trim()
}

export function leadEmail(lead: LeadEntry) {
  return (lead.communication.email ?? lead.qualification.email ?? lead.email ?? "").trim()
}

export function renderTemplate(template: string, lead: LeadEntry) {
  const nome = firstName(lead.qualification.contact_name ?? lead.name)
  const values: Record<string, string> = {
    "{saudacao}": nome ? `Oi, ${nome}!` : "Oi, tudo bem?",
    "{nome}": nome,
    "{empresa}": lead.prospect.company?.trim() || "sua clínica",
    "{segmento}": lead.prospect.segment?.trim().toLowerCase() || "sua área",
    "{cidade}": lead.prospect.city?.trim() || "sua cidade",
    "{site}": leadSite(lead) || "seu site",
  }
  return template.replace(/\{[a-z_]+\}/g, (token) => values[token] ?? token)
}

export function defaultInitialTemplate(lead: LeadEntry): OutreachTemplateKey {
  return leadSite(lead) ? "has_site" : "no_site"
}

// ─── Channel links ──────────────────────────────────────────────────────────

/** Normaliza para o formato do wa.me (só dígitos, com DDI 55 quando faltar). */
export function normalizeWhatsapp(raw: string): string {
  let digits = raw.replace(/\D/g, "")
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "")
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`
  return digits
}

export function whatsappLink(raw: string, message: string) {
  return `https://wa.me/${normalizeWhatsapp(raw)}?text=${encodeURIComponent(message)}`
}

export function instagramHandle(raw: string) {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "")
}

export function instagramDmLink(raw: string) {
  return `https://ig.me/m/${instagramHandle(raw)}`
}

export function emailLink(raw: string, message: string, company: string) {
  const subject = `Site da ${company}`
  return `mailto:${raw}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
}

export type OutreachChannel = "whatsapp" | "instagram" | "email"

export function availableChannels(lead: LeadEntry): OutreachChannel[] {
  const channels: OutreachChannel[] = []
  if (normalizeWhatsapp(leadWhatsapp(lead)).length >= 12) channels.push("whatsapp")
  if (instagramHandle(leadInstagram(lead))) channels.push("instagram")
  if (leadEmail(lead).includes("@")) channels.push("email")
  return channels
}

export const CHANNEL_LABEL: Record<OutreachChannel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  email: "E-mail",
}

// ─── Dates ──────────────────────────────────────────────────────────────────

/** Data local no formato YYYY-MM-DD, deslocada em `offsetDays`. */
export function localDate(offsetDays = 0, from = new Date()) {
  const d = new Date(from)
  d.setDate(d.getDate() + offsetDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function formatShortDate(ymd: string) {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number)
  if (!y || !m || !d) return ymd
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

// ─── Queues ─────────────────────────────────────────────────────────────────

const FOLLOWUP_RE = /^Follow-up (\d)/

export function followupNumber(activity: LeadActivity): 1 | 2 {
  const match = activity.description.match(FOLLOWUP_RE)
  return match?.[1] === "2" ? 2 : 1
}

export function pendingFollowups(lead: LeadEntry) {
  return lead.activities
    .filter((a) => a.type === "followup" && a.status === "pending" && FOLLOWUP_RE.test(a.description))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Próximo follow-up pendente cuja data já chegou (ou passou). */
export function dueFollowup(lead: LeadEntry, today = localDate()) {
  return pendingFollowups(lead).find((a) => a.date.slice(0, 10) <= today) ?? null
}

/** Leads no estágio "Lead" que ainda não foram abordados. */
export function toApproachQueue(leads: LeadEntry[]) {
  return leads
    .filter((l) => !l.lost && l.status_stage === "lead")
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

/**
 * Que abordagem faz sentido agora para este lead: follow-up vencido tem
 * prioridade; senão, primeira abordagem se ele ainda está no estágio Lead.
 * `null` = nada a fazer (já abordado e aguardando, perdido ou mais adiante).
 */
export function outreachModeFor(
  lead: LeadEntry,
  today = localDate()
): "approach" | "followup" | null {
  if (lead.lost) return null
  if (dueFollowup(lead, today)) return "followup"
  return lead.status_stage === "lead" ? "approach" : null
}

export function followupQueue(leads: LeadEntry[], today = localDate()) {
  return leads
    .filter((l) => !l.lost && dueFollowup(l, today))
    .sort((a, b) => (dueFollowup(a, today)?.date ?? "").localeCompare(dueFollowup(b, today)?.date ?? ""))
}

export function waitingCount(leads: LeadEntry[], today = localDate()) {
  return leads.filter(
    (l) => !l.lost && pendingFollowups(l).length > 0 && !dueFollowup(l, today)
  ).length
}

export function approachedToday(leads: LeadEntry[], today = localDate()) {
  return leads.filter((l) =>
    l.activities.some(
      (a) =>
        a.status === "done" &&
        a.description.startsWith("Abordagem inicial") &&
        a.date.slice(0, 10) === today
    )
  ).length
}

// ─── Actions ────────────────────────────────────────────────────────────────

const ACTIVITY_TYPE_BY_CHANNEL: Record<OutreachChannel, LeadActivity["type"]> = {
  whatsapp: "whatsapp",
  instagram: "followup",
  email: "followup",
}

/**
 * Registra a primeira abordagem: atividade concluída, lead vai para "Contato"
 * e os follow-ups D+3 e D+7 ficam agendados.
 */
export function registerInitialOutreach(
  lead: LeadEntry,
  channel: OutreachChannel,
  message: string
): LeadEntry {
  const today = localDate()
  let updated = addActivityToLead(lead, {
    type: ACTIVITY_TYPE_BY_CHANNEL[channel],
    description: `Abordagem inicial via ${CHANNEL_LABEL[channel]}: ${message}`,
    date: today,
    status: "done",
  })
  updated = addActivityToLead(updated, {
    type: "followup",
    description: "Follow-up 1 (D+3)",
    date: localDate(3),
    status: "pending",
  })
  updated = addActivityToLead(updated, {
    type: "followup",
    description: "Follow-up 2 (D+7)",
    date: localDate(7),
    status: "pending",
  })
  updated = moveLeadToStage(updated, "qualified")
  updated.communication = { ...updated.communication, preferred_channel: channel }
  return updated
}

function completeActivities(lead: LeadEntry, ids: Set<string>): LeadEntry {
  return {
    ...lead,
    updated_at: new Date().toISOString(),
    activities: lead.activities.map((a) => (ids.has(a.id) ? { ...a, status: "done" } : a)),
  }
}

/** Marca o follow-up como enviado e registra o envio. */
export function registerFollowupSent(
  lead: LeadEntry,
  activityId: string,
  channel: OutreachChannel
): LeadEntry {
  const activity = lead.activities.find((a) => a.id === activityId)
  let completed = completeActivities(lead, new Set([activityId]))

  // Se o follow-up 1 saiu atrasado, empurra o 2 para não mandar dois seguidos.
  if (activity && followupNumber(activity) === 1) {
    const minDate = localDate(4)
    completed = {
      ...completed,
      activities: completed.activities.map((a) =>
        a.type === "followup" && a.status === "pending" && followupNumber(a) === 2 && a.date.slice(0, 10) < minDate
          ? { ...a, date: minDate }
          : a
      ),
    }
  }
  return addCommentToLead(
    completed,
    `${activity?.description ?? "Follow-up"} enviado via ${CHANNEL_LABEL[channel]}.`
  )
}

/** Lead respondeu: encerra os follow-ups pendentes e registra no histórico. */
export function registerReplied(lead: LeadEntry): LeadEntry {
  const ids = new Set(pendingFollowups(lead).map((a) => a.id))
  return addCommentToLead(completeActivities(lead, ids), "Lead respondeu à abordagem.")
}

/** Sem interesse: encerra follow-ups e marca o lead como perdido. */
export function registerNotInterested(lead: LeadEntry): LeadEntry {
  const ids = new Set(pendingFollowups(lead).map((a) => a.id))
  return markLeadLost(completeActivities(lead, ids), "Sem interesse na abordagem")
}
