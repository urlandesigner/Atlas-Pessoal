"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Eye,
  FileText,
  Globe,
  MoreHorizontal,
  Plus,
  Printer,
  Search,
  Share2,
  Trash2,
  WalletCards,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
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
import { Textarea } from "@/components/ui/textarea"
import {
  applyTemplateToForm,
  createProposalForm,
  createProposalFromForm,
  createScopeCategory,
  DOMAIN_ADDON_PRICE,
  duplicateProposal,
  emitProposalsChange,
  EMPTY_PROPOSAL_FORM,
  getProposalsServerSnapshot,
  getProposalsSnapshot,
  HOSTING_ADDON_PRICE,
  PROPOSAL_STATUS_LABEL,
  PROPOSAL_STATUS_OPTIONS,
  PROPOSAL_TEMPLATES,
  saveProposals,
  subscribeProposalsStore,
  updateProposalInCollection,
  type EntryMode,
  type ProposalEntry,
  type ProposalForm,
  type ProposalScopeCategory,
  type ProposalStatus,
} from "@/lib/proposals/store"
import {
  emitClientsChange,
  getClientsServerSnapshot,
  getClientsSnapshot,
  linkProposalToClient,
  saveClients,
  subscribeClientsStore,
  upsertClientFromApprovedProposal,
} from "@/lib/clients/store"
import {
  getProjectsSnapshot,
} from "@/lib/projects/store"
import {
  emitLeadsChange,
  getLeadsSnapshot,
  linkProposalToLead,
  saveLeads,
  type LeadEntry,
} from "@/lib/crm/store"
import { cn } from "@/lib/utils"

type PeriodFilter = "all" | "month" | "quarter" | "year"

const STATUS_CLASS: Record<ProposalStatus, string> = {
  draft: "border-muted-foreground/20 bg-muted text-muted-foreground",
  sent: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  viewed: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  approved: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  rejected: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  expired: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
}

const PERIOD_LABEL: Record<PeriodFilter, string> = {
  all: "Todo período",
  month: "Este mês",
  quarter: "Últimos 90 dias",
  year: "Este ano",
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Sem data"
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
}

function getEntryValue(form: ProposalForm | ProposalEntry) {
  const total = typeof form.totalValue === "number" ? form.totalValue : parseNumber(form.totalValue)
  const entry = typeof form.entryValue === "number" ? form.entryValue : parseNumber(form.entryValue)
  return form.entryMode === "percent" ? (total * entry) / 100 : entry
}

function getRemainingValue(form: ProposalForm | ProposalEntry) {
  const total = typeof form.totalValue === "number" ? form.totalValue : parseNumber(form.totalValue)
  return Math.max(total - getEntryValue(form), 0)
}

function isInPeriod(dateValue: string, period: PeriodFilter) {
  if (period === "all") return true
  const date = new Date(`${dateValue.slice(0, 10)}T00:00:00`)
  const now = new Date()

  if (period === "month") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }
  if (period === "year") return date.getFullYear() === now.getFullYear()

  const diff = now.getTime() - date.getTime()
  return diff <= 90 * 86400000
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

function buildProposalFormFromLead(lead: LeadEntry): ProposalForm {
  const clientName =
    lead.prospect.company || lead.qualification.contact_name?.trim() || lead.name?.trim() || ""
  return {
    ...EMPTY_PROPOSAL_FORM,
    leadId: lead.id,
    clientId: lead.client_id ?? "",
    clientName,
    title: clientName,
    objective: lead.qualification.project_objective?.trim() || "",
    totalValue: lead.opportunity.estimated_value ? String(lead.opportunity.estimated_value) : "",
    proposalDate: new Date().toISOString().split("T")[0],
  }
}

function createPrintHtml(form: ProposalForm | ProposalEntry) {
  const total = typeof form.totalValue === "number" ? form.totalValue : parseNumber(form.totalValue)
  const printIncludeDomain = form.included.some((i) => /(domínio|dominio)/i.test(i))
  const printIncludeHosting = form.included.some((i) => /hospedagem/i.test(i))
  const printAddonTotal = (printIncludeDomain ? DOMAIN_ADDON_PRICE : 0) + (printIncludeHosting ? HOSTING_ADDON_PRICE : 0)
  const printBaseTotal = total - printAddonTotal
  const logoUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/images/logo-urlandipre.svg`
      : "/images/logo-urlandipre.svg"
  const scope = form.scope
    .map(
      (category) =>
        `<section><h3>${category.name}</h3><ul>${category.items.map((item) => `<li>${item}</li>`).join("")}</ul></section>`
    )
    .join("")

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Proposta Comercial</title>
<style>
@page{margin:48px}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;color:#111;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;border-bottom:1px solid #e5e5e5;padding-bottom:28px;margin-bottom:28px}
section,.blk{break-inside:avoid;page-break-inside:avoid}
.tip{background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:10px 14px;font-size:13px;color:#713f12;margin-bottom:24px}
@media print{.tip{display:none}}
.logo{display:block;width:152px;height:auto}
.brand{font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#666}
h1{font-size:34px;line-height:1.05;margin:18px 0 12px}
h2{font-size:13px;letter-spacing:.14em;text-transform:uppercase;margin-top:34px;color:#555}
h3{font-size:16px;margin-bottom:8px}
.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0}
.box{border:1px solid #ddd;border-radius:14px;padding:14px}
.price{font-size:30px;font-weight:700}
ul{padding-left:20px}
</style>
</head>
<body>
<div class="tip">💡 Para remover data/hora no topo e "about:blank" no rodapé: no diálogo de impressão, desmarque <strong>Cabeçalhos e rodapés</strong> (ou <strong>Headers and footers</strong>).</div>
<div class="header">
<div>
<div class="brand">Proposta comercial</div>
<p>Cliente: <strong>${form.clientName || "Cliente não informado"}</strong></p>
</div>
<img class="logo" src="${logoUrl}" alt="Urlan Dipre" />
</div>
<div class="meta">
<div class="box">Data<br><strong>${formatDate(form.proposalDate)}</strong></div>
<div class="box">Validade<br><strong>${formatDate(form.validUntil)}</strong></div>
<div class="box">Prazo<br><strong>${form.estimatedDeadline || "A definir"}</strong></div>
</div>
<div class="blk"><h2>Objetivo</h2><p>${form.objective || "Objetivo a definir."}</p></div>
<div class="blk"><h2>Escopo</h2>${scope}</div>
<div class="blk"><h2>Investimento</h2>
${printAddonTotal > 0 ? `<table style="width:100%;border-collapse:collapse;margin-bottom:8px;font-size:15px"><tr><td>Desenvolvimento</td><td style="text-align:right">${money(printBaseTotal)}</td></tr>${printIncludeDomain ? `<tr><td>Domínio (anual)</td><td style="text-align:right">+ ${money(DOMAIN_ADDON_PRICE)}</td></tr>` : ""}${printIncludeHosting ? `<tr><td>Hospedagem (anual)</td><td style="text-align:right">+ ${money(HOSTING_ADDON_PRICE)}</td></tr>` : ""}</table>` : ""}
<p class="price">${money(total)}</p>
<p>Pagamento: <strong>${form.paymentMethod || "A definir"}</strong></p></div>
<div class="blk"><h2>Inclusos</h2><ul>${form.included.map((item) => `<li>${item}</li>`).join("")}</ul></div>
<div class="blk"><h2>Não inclusos</h2><ul>${form.notIncluded.map((item) => `<li>${item}</li>`).join("")}</ul></div>
${form.notes ? `<div class="blk"><h2>Observações</h2><p>${form.notes}</p></div>` : ""}
</body>
</html>`
}

function printProposal(form: ProposalForm | ProposalEntry) {
  sessionStorage.setItem("atlas-print-proposal", createPrintHtml(form))
  window.open("/print/proposal", "_blank")
}

function ProposalPreview({ form }: { form: ProposalForm }) {
  const total = parseNumber(form.totalValue)
  const previewIncludeDomain = form.included.some((i) => /(domínio|dominio)/i.test(i))
  const previewIncludeHosting = form.included.some((i) => /hospedagem/i.test(i))
  const addonTotal = (previewIncludeDomain ? DOMAIN_ADDON_PRICE : 0) + (previewIncludeHosting ? HOSTING_ADDON_PRICE : 0)
  const baseTotal = total - addonTotal

  return (
    <div className="rounded-xl border bg-background p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b pb-5">
        <div>
          <div className="inline-flex size-9 items-center justify-center rounded-lg bg-foreground text-sm font-semibold text-background">
            A
          </div>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Proposta comercial
          </p>
          <h2 className="mt-2 text-[1.7rem] font-semibold leading-tight tracking-tight">
            {form.clientName || "Nome do cliente"}
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            Preparada para <span className="font-medium text-foreground">{form.clientName || "Cliente"}</span>
          </p>
        </div>
        <Badge variant="outline" className={cn("font-normal", STATUS_CLASS[form.status])}>
          {PROPOSAL_STATUS_LABEL[form.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 py-5 text-sm">
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-muted-foreground">Data</p>
          <p className="mt-1 font-medium">{formatDate(form.proposalDate)}</p>
        </div>
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-muted-foreground">Validade</p>
          <p className="mt-1 font-medium">{formatDate(form.validUntil)}</p>
        </div>
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-muted-foreground">Prazo</p>
          <p className="mt-1 font-medium">{form.estimatedDeadline || "A definir"}</p>
        </div>
      </div>

      <PreviewSection title="Objetivo">
        <p>{form.objective || "Descreva o objetivo do projeto para o cliente."}</p>
      </PreviewSection>

      <PreviewSection title="Escopo">
        {form.scope.length ? (
          <div className="grid gap-3">
            {form.scope.map((category) => (
              <div key={category.id} className="rounded-lg border p-3">
                <h4 className="text-sm font-medium">{category.name || "Categoria"}</h4>
                <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
                  {category.items.length ? (
                    category.items.map((item) => <li key={item}>• {item}</li>)
                  ) : (
                    <li>• Item de escopo</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p>Adicione categorias e itens para estruturar o escopo.</p>
        )}
      </PreviewSection>

      <PreviewSection title="Investimento">
        <div className="rounded-xl bg-foreground p-5 text-background">
          {addonTotal > 0 && (
            <div className="mb-4 space-y-2 border-b border-background/15 pb-4 text-sm">
              <div className="flex justify-between opacity-70">
                <span>Desenvolvimento</span>
                <span>{money(baseTotal)}</span>
              </div>
              {previewIncludeDomain && (
                <div className="flex justify-between opacity-70">
                  <span>Domínio (anual)</span>
                  <span>+ {money(DOMAIN_ADDON_PRICE)}</span>
                </div>
              )}
              {previewIncludeHosting && (
                <div className="flex justify-between opacity-70">
                  <span>Hospedagem (anual)</span>
                  <span>+ {money(HOSTING_ADDON_PRICE)}</span>
                </div>
              )}
            </div>
          )}
          <p className="text-sm opacity-70">Valor total</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{money(total)}</p>
          <div className="mt-5 rounded-lg border border-background/15 bg-background/5 p-4">
            <p className="text-sm font-medium opacity-70">Pagamento</p>
            <p className="mt-1 text-lg font-medium leading-7">
              {form.paymentMethod || "A definir"}
            </p>
          </div>
        </div>
      </PreviewSection>

      <div className="grid gap-4 sm:grid-cols-2">
        <PreviewSection title="Inclusos">
          <Checklist items={form.included} empty="Itens inclusos aparecerão aqui." />
        </PreviewSection>
        <PreviewSection title="Não inclusos">
          <Checklist items={form.notIncluded} empty="Itens não inclusos aparecerão aqui." />
        </PreviewSection>
      </div>

      {form.notes ? (
        <PreviewSection title="Observações">
          <p>{form.notes}</p>
        </PreviewSection>
      ) : null}
    </div>
  )
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t py-5 first:border-t-0">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h3>
      <div className="text-[15px] leading-7 text-muted-foreground">{children}</div>
    </section>
  )
}

function Checklist({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p>{empty}</p>
  return (
    <ul className="grid gap-1.5 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-foreground">✓</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function EditableList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState("")

  function add() {
    if (!draft.trim()) return
    onChange([...items, draft.trim()])
    setDraft("")
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              add()
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus data-icon="inline-start" />
          Adicionar
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <Input
              value={item}
              onChange={(event) => {
                const next = [...items]
                next[index] = event.target.value
                onChange(next)
              }}
              className="border-0 px-0 shadow-none focus-visible:ring-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              <X />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScopeEditor({
  scope,
  onChange,
}: {
  scope: ProposalScopeCategory[]
  onChange: (scope: ProposalScopeCategory[]) => void
}) {
  function updateCategory(index: number, updates: Partial<ProposalScopeCategory>) {
    onChange(scope.map((category, itemIndex) => (itemIndex === index ? { ...category, ...updates } : category)))
  }

  function moveCategory(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= scope.length) return
    const next = [...scope]
    const current = next[index]
    next[index] = next[target]
    next[target] = current
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-muted-foreground">Escopo em categorias</label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...scope, createScopeCategory()])}>
          <Plus data-icon="inline-start" />
          Categoria
        </Button>
      </div>

      {scope.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/15 px-4 py-6 text-base text-muted-foreground">
          Adicione categorias como Estrutura do Site, Funcionalidades ou Entregas.
        </div>
      ) : (
        scope.map((category, categoryIndex) => (
          <div key={category.id} className="rounded-xl border bg-background p-3">
            <div className="flex items-center gap-2">
              <Input
                value={category.name}
                onChange={(event) => updateCategory(categoryIndex, { name: event.target.value })}
                placeholder="Nome da categoria"
              />
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveCategory(categoryIndex, -1)}>
                <ArrowUp />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveCategory(categoryIndex, 1)}>
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onChange(scope.filter((_, index) => index !== categoryIndex))}
              >
                <Trash2 />
              </Button>
            </div>
            <EditableList
              label="Itens"
              items={category.items}
              placeholder="Ex: Home"
              onChange={(items) => updateCategory(categoryIndex, { items })}
            />
          </div>
        ))
      )}
    </div>
  )
}

function ProposalEditor({
  open,
  mode,
  initialForm,
  clients,
  onClose,
  onSubmit,
}: {
  open: boolean
  mode: "create" | "edit"
  initialForm: ProposalForm
  clients: { id: string; name: string }[]
  onClose: () => void
  onSubmit: (form: ProposalForm) => void
}) {
  const [form, setForm] = useState<ProposalForm>(initialForm)

  const includeDomain = form.included.some((i) => /(domínio|dominio)/i.test(i))
  const includeHosting = form.included.some((i) => /hospedagem/i.test(i))

  function set<K extends keyof ProposalForm>(field: K, value: ProposalForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleDomain(checked: boolean) {
    setForm((prev) => ({
      ...prev,
      totalValue: String(Math.max(0, parseNumber(prev.totalValue) + (checked ? DOMAIN_ADDON_PRICE : -DOMAIN_ADDON_PRICE))),
      included: checked
        ? [...prev.included.filter((i) => !/(domínio|dominio)/i.test(i)), "Domínio (R$ 40/ano)"]
        : prev.included.filter((i) => !/(domínio|dominio)/i.test(i)),
      notIncluded: checked
        ? prev.notIncluded.filter((i) => !/(domínio|dominio)/i.test(i))
        : [...prev.notIncluded.filter((i) => !/(domínio|dominio)/i.test(i)), "Domínio"],
    }))
  }

  function toggleHosting(checked: boolean) {
    setForm((prev) => ({
      ...prev,
      totalValue: String(Math.max(0, parseNumber(prev.totalValue) + (checked ? HOSTING_ADDON_PRICE : -HOSTING_ADDON_PRICE))),
      included: checked
        ? [...prev.included.filter((i) => !/hospedagem/i.test(i)), "Hospedagem (R$ 250/ano)"]
        : prev.included.filter((i) => !/hospedagem/i.test(i)),
      notIncluded: checked
        ? prev.notIncluded.filter((i) => !/hospedagem/i.test(i))
        : [...prev.notIncluded.filter((i) => !/hospedagem/i.test(i)), "Hospedagem"],
    }))
  }

  function handleClientChange(clientId: string) {
    const client = clients.find((item) => item.id === clientId)
    setForm((prev) => ({ ...prev, clientId, clientName: client?.name ?? "" }))
  }

  function handleClose() {
    setForm(initialForm)
    onClose()
  }

  function handleSubmit() {
    if (!form.clientName.trim()) return
    onSubmit(form)
    setForm(initialForm)
  }

  return (
    <Sheet open={open} onOpenChange={(value) => !value && handleClose()}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full sm:data-[side=right]:w-[94vw] sm:data-[side=right]:max-w-[94vw]" side="right">
        <SheetHeader className="border-b px-5 pb-4 pt-5 pr-12">
          <SheetTitle className="text-lg">
            {mode === "create" ? "Nova proposta" : "Editar proposta"}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Estruture a proposta em blocos e acompanhe a prévia profissional em tempo real.
          </p>
        </SheetHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)]">
          <ScrollArea className="min-h-0 border-r">
            <div className="flex flex-col gap-6 p-5">
              <div className="rounded-xl border bg-muted/15 p-4">
                <label className="text-sm font-medium text-muted-foreground">Template</label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {PROPOSAL_TEMPLATES.map((template) => (
                    <Button
                      key={template.id}
                      type="button"
                      variant="outline"
                      className="justify-start"
                      onClick={() => setForm((prev) => applyTemplateToForm(prev, template))}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>

              <FormSection title="Informações gerais">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Status">
                    <select
                      value={form.status}
                      onChange={(event) => set("status", event.target.value as ProposalStatus)}
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-base outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                    >
                      {PROPOSAL_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {PROPOSAL_STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Cliente">
                    <select
                      value={form.clientId}
                      onChange={(event) => handleClientChange(event.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-base outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                    >
                      <option value="">Selecione um cliente</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Cliente manual">
                    <Input value={form.clientName} onChange={(event) => set("clientName", event.target.value)} placeholder="Nome do cliente" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Data">
                      <Input type="date" value={form.proposalDate} onChange={(event) => set("proposalDate", event.target.value)} />
                    </Field>
                    <Field label="Validade">
                      <Input type="date" value={form.validUntil} onChange={(event) => set("validUntil", event.target.value)} />
                    </Field>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Objetivo do projeto">
                <Textarea
                  value={form.objective}
                  onChange={(event) => set("objective", event.target.value)}
                  placeholder="Desenvolver um website institucional para fortalecer a presença digital da empresa..."
                  className="min-h-[120px] resize-none"
                />
              </FormSection>

              <FormSection title="Escopo">
                <ScopeEditor scope={form.scope} onChange={(scope) => set("scope", scope)} />
              </FormSection>

              <FormSection title="Prazo">
                <Input
                  value={form.estimatedDeadline}
                  onChange={(event) => set("estimatedDeadline", event.target.value)}
                  placeholder="10 dias úteis"
                />
              </FormSection>

              <FormSection title="Investimento">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Valor total">
                    <Input
                      type="number"
                      value={form.totalValue}
                      onChange={(event) => set("totalValue", event.target.value)}
                      placeholder="4500"
                    />
                  </Field>
                  <Field label="Entrada">
                    <div className="grid grid-cols-[1fr_8rem] gap-2">
                      <Input value={form.entryValue} onChange={(event) => set("entryValue", event.target.value)} />
                      <select
                        value={form.entryMode}
                        onChange={(event) => set("entryMode", event.target.value as EntryMode)}
                        className="h-10 rounded-md border border-input bg-transparent px-3 text-base outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                      >
                        <option value="percent">%</option>
                        <option value="value">R$</option>
                      </select>
                    </div>
                  </Field>
                  <Field label="Saldo restante">
                    <Input value={money(getRemainingValue(form))} readOnly />
                  </Field>
                  <Field label="Forma de pagamento">
                    <Input
                      value={form.paymentMethod}
                      onChange={(event) => set("paymentMethod", event.target.value)}
                      placeholder="50% na aprovação/publicação e 50% pra 30 dias"
                    />
                  </Field>
                </div>
              </FormSection>

              <FormSection title="Domínio e Hospedagem">
                <p className="text-sm text-muted-foreground">
                  Cobranças anuais — marque para incluir na proposta e somar ao orçamento.
                </p>
                <AddonToggle
                  label="Domínio"
                  detail="Registro anual do domínio"
                  price={DOMAIN_ADDON_PRICE}
                  checked={includeDomain}
                  onToggle={toggleDomain}
                />
                <AddonToggle
                  label="Hospedagem"
                  detail="Plano de hospedagem anual"
                  price={HOSTING_ADDON_PRICE}
                  checked={includeHosting}
                  onToggle={toggleHosting}
                />
              </FormSection>

              <FormSection title="Inclusos">
                <EditableList
                  label="Itens inclusos"
                  items={form.included}
                  onChange={(items) => set("included", items)}
                  placeholder="Design personalizado"
                />
              </FormSection>

              <FormSection title="Não inclusos">
                <EditableList
                  label="Itens não inclusos"
                  items={form.notIncluded}
                  onChange={(items) => set("notIncluded", items)}
                  placeholder="Hospedagem"
                />
              </FormSection>

              <FormSection title="Observações">
                <Textarea
                  value={form.notes}
                  onChange={(event) => set("notes", event.target.value)}
                  placeholder="Observações opcionais para condições, premissas ou próximos passos."
                  className="min-h-[100px] resize-none"
                />
              </FormSection>
            </div>
          </ScrollArea>

          <ScrollArea className="min-h-0 bg-muted/20">
            <div className="p-5">
              <ProposalPreview form={form} />
            </div>
          </ScrollArea>
        </div>

        <SheetFooter className="flex flex-row flex-wrap gap-2 border-t px-5 py-4">
          <Button variant="outline" onClick={() => printProposal(form)}>
            <Printer data-icon="inline-start" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={() => printProposal(form)}>
            <FileText data-icon="inline-start" />
            Exportar PDF
          </Button>
          <Button variant="ghost" className="ml-auto" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!form.clientName.trim()}>
            {mode === "create" ? "Salvar proposta" : "Salvar alterações"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-medium">{title}</h3>
      {children}
    </section>
  )
}

function AddonToggle({
  label,
  detail,
  price,
  checked,
  onToggle,
}: {
  label: string
  detail: string
  price: number
  checked: boolean
  onToggle: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
        checked ? "border-foreground/20 bg-muted/40" : "hover:bg-muted/20"
      )}
    >
      <div
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center rounded border-2 transition-colors",
          checked ? "border-foreground bg-foreground text-background" : "border-input"
        )}
      >
        {checked && <Check className="size-3" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <span className={cn("shrink-0 text-sm font-medium tabular-nums", checked ? "text-foreground" : "text-muted-foreground")}>
        + {money(price)}/ano
      </span>
    </button>
  )
}

function ProposalView({
  proposal,
  onClose,
  onEdit,
  onDuplicate,
  onShare,
}: {
  proposal: ProposalEntry | null
  onClose: () => void
  onEdit: (proposal: ProposalEntry) => void
  onDuplicate: (proposal: ProposalEntry) => void
  onShare: (proposal: ProposalEntry) => void
}) {
  return (
    <Sheet open={!!proposal} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex h-dvh min-h-0 flex-col gap-0 p-0 data-[side=right]:w-full sm:data-[side=right]:w-[54rem] sm:data-[side=right]:max-w-[54rem]" side="right">
        {proposal ? (
          <>
            <SheetHeader className="shrink-0 border-b px-5 pb-4 pt-5 pr-12">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="text-lg">{proposal.clientName}</SheetTitle>
                <Badge variant="outline" className={cn("font-normal", STATUS_CLASS[proposal.status])}>
                  {PROPOSAL_STATUS_LABEL[proposal.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {proposal.clientName} · {money(proposal.totalValue)} · {proposal.estimatedDeadline || "Prazo a definir"}
              </p>
            </SheetHeader>
            <ScrollArea className="min-h-0 flex-1 bg-muted/20">
              <div className="p-5 pb-8">
                <ProposalPreview form={createProposalForm(proposal)} />
              </div>
            </ScrollArea>
            <div className="shrink-0 flex flex-wrap gap-2 border-t px-5 py-4">
              <Button variant="outline" onClick={() => printProposal(proposal)}>
                <Printer data-icon="inline-start" />
                Imprimir
              </Button>
              <Button variant="outline" onClick={() => printProposal(proposal)}>
                <FileText data-icon="inline-start" />
                Exportar PDF
              </Button>
              <Button variant="outline" onClick={() => window.open(`/p/${proposal.id}`, "_blank")}>
                <Globe data-icon="inline-start" />
                Versão web
              </Button>
              <Button variant="outline" onClick={() => onShare(proposal)}>
                <Share2 data-icon="inline-start" />
                Compartilhar link
              </Button>
              <Button variant="outline" onClick={() => onDuplicate(proposal)}>
                <Copy data-icon="inline-start" />
                Duplicar
              </Button>
              <Button className="ml-auto" onClick={() => onEdit(proposal)}>
                Editar
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export default function ProposalsPage() {
  const proposals = useSyncExternalStore(
    subscribeProposalsStore,
    getProposalsSnapshot,
    getProposalsServerSnapshot
  )
  const clients = useSyncExternalStore(subscribeClientsStore, getClientsSnapshot, getClientsServerSnapshot)
  const [isCreating, setIsCreating] = useState(false)
  const [prefillForm, setPrefillForm] = useState<ProposalForm | null>(null)
  const [editing, setEditing] = useState<ProposalEntry | null>(null)
  const [viewing, setViewing] = useState<ProposalEntry | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "all">("all")
  const [clientFilter, setClientFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all")

  // Consume deep-link params: ?leadId&new opens a pre-filled editor, ?view opens a proposal.
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const leadId = params.get("leadId")
    const isNew = params.get("new")
    const viewId = params.get("view")
    let consumed = false

    if (viewId) {
      const found = getProposalsSnapshot().find((proposal) => proposal.id === viewId)
      if (found) {
        setViewing(found)
        consumed = true
      }
    }
    if (isNew && leadId) {
      const lead = getLeadsSnapshot().find((item) => item.id === leadId)
      if (lead) {
        setPrefillForm(buildProposalFormFromLead(lead))
        setIsCreating(true)
        consumed = true
      }
    }
    if (consumed) window.history.replaceState(null, "", window.location.pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const search = normalizeSearch(query)
    return proposals
      .filter((proposal) => {
        if (statusFilter !== "all" && proposal.status !== statusFilter) return false
        if (clientFilter !== "all" && proposal.clientId !== clientFilter) return false
        if (!isInPeriod(proposal.proposalDate, periodFilter)) return false
        if (!search) return true
        return normalizeSearch(
          [proposal.clientName, proposal.objective, proposal.estimatedDeadline].join(" ")
        ).includes(search)
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [clientFilter, periodFilter, proposals, query, statusFilter])

  const totals = useMemo(() => {
    const approved = proposals.filter((proposal) => proposal.status === "approved")
    return {
      count: proposals.length,
      approved: approved.length,
      sent: proposals.filter((proposal) => proposal.status === "sent" || proposal.status === "viewed").length,
      value: approved.reduce((sum, proposal) => sum + proposal.totalValue, 0),
    }
  }, [proposals])

  function syncApprovedClients(next: ProposalEntry[], previous: ProposalEntry[]) {
    const newlyApproved = next.filter((proposal) => {
      const old = previous.find((item) => item.id === proposal.id)
      return proposal.status === "approved" && old?.status !== "approved"
    })
    if (!newlyApproved.length) return

    const projects = getProjectsSnapshot()
    const freelancerProjects = projects.freelancer
    const nextClients = newlyApproved.reduce((collection, proposal) => {
      const project = proposal.projectId
        ? freelancerProjects.find((item) => item.id === proposal.projectId)
        : null
      return upsertClientFromApprovedProposal(collection, proposal, project)
    }, clients)

    saveClients(nextClients)
    emitClientsChange()
  }

  function persist(next: ProposalEntry[]) {
    syncApprovedClients(next, proposals)
    saveProposals(next)
    emitProposalsChange()
  }

  function handleCreate(form: ProposalForm) {
    const proposal = createProposalFromForm(form)
    persist([proposal, ...proposals])
    // Link the proposal back to its originating lead, if any.
    if (form.leadId) {
      const leads = getLeadsSnapshot()
      const nextLeads = leads.map((lead) =>
        lead.id === form.leadId ? linkProposalToLead(lead, proposal.id) : lead
      )
      saveLeads(nextLeads)
      emitLeadsChange()
    }
    // Link the proposal to the client, if any.
    if (form.clientId) {
      const clients = getClientsSnapshot()
      const nextClients = clients.map((client) =>
        client.id === form.clientId ? linkProposalToClient(client, proposal.id) : client
      )
      saveClients(nextClients)
      emitClientsChange()
    }
    setIsCreating(false)
    setPrefillForm(null)
  }

  function handleEdit(form: ProposalForm) {
    if (!editing) return
    const next = updateProposalInCollection(proposals, editing.id, form)
    persist(next)
    setEditing(null)
    setViewing(next.find((proposal) => proposal.id === editing.id) ?? null)
  }

  function handleDuplicate(proposal: ProposalEntry) {
    persist([duplicateProposal(proposal), ...proposals])
  }

  function handleDelete(proposal: ProposalEntry) {
    if (!window.confirm(`Excluir a proposta de "${proposal.clientName}"?`)) return
    persist(proposals.filter((item) => item.id !== proposal.id))
    if (viewing?.id === proposal.id) setViewing(null)
  }

  async function handleShare(proposal: ProposalEntry) {
    const url = `${window.location.origin}/p/${proposal.id}`
    await navigator.clipboard?.writeText(url)
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Propostas"
          description="Centralize propostas antes da aprovação e futura conversão em projeto."
          actions={
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus data-icon="inline-start" />
              Criar proposta
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Propostas" value={totals.count} icon={FileText} />
          <Metric label="Em negociação" value={totals.sent} icon={MoreHorizontal} />
          <Metric label="Aprovadas" value={totals.approved} icon={Eye} />
          <Metric label="Valor aprovado" value={money(totals.value)} icon={WalletCards} />
        </div>

        <Card className="py-0">
          <CardContent className="px-4 py-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_12rem_12rem_12rem]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por cliente, objetivo..."
                  className="pl-9"
                />
              </div>
              <select
                value={clientFilter}
                onChange={(event) => setClientFilter(event.target.value)}
                className="h-10 rounded-md border border-input bg-transparent px-3 text-base outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
              >
                <option value="all">Todos clientes</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ProposalStatus | "all")}
                className="h-10 rounded-md border border-input bg-transparent px-3 text-base outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
              >
                <option value="all">Todos status</option>
                {PROPOSAL_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {PROPOSAL_STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
              <select
                value={periodFilter}
                onChange={(event) => setPeriodFilter(event.target.value as PeriodFilter)}
                className="h-10 rounded-md border border-input bg-transparent px-3 text-base outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
              >
                {Object.entries(PERIOD_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {filtered.length ? (
          <div className="grid gap-4">
            {filtered.map((proposal) => (
              <Card key={proposal.id} className="py-0 transition-colors hover:bg-muted/25">
                <CardContent className="grid grid-cols-1 gap-3 px-4 py-3 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h2 className="line-clamp-1 text-lg font-semibold leading-snug">
                        {proposal.clientName}
                      </h2>
                      <Badge variant="outline" className={cn("h-6 px-2.5 text-sm font-normal", STATUS_CLASS[proposal.status])}>
                        {PROPOSAL_STATUS_LABEL[proposal.status]}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Info label="Valor total" value={money(proposal.totalValue)} />
                      <Info label="Prazo" value={proposal.estimatedDeadline || "A definir"} />
                      <Info label="Validade" value={formatDate(proposal.validUntil)} />
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                    <Button variant="outline" size="sm" onClick={() => setViewing(proposal)}>
                      <Eye data-icon="inline-start" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditing(proposal)}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDuplicate(proposal)}>
                      <Copy />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(proposal)}>
                      <Trash2 />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                <FileText className="size-5 text-muted-foreground" />
              </div>
              <p className="text-base text-muted-foreground">
                Nenhuma proposta encontrada. Crie uma proposta ou ajuste os filtros.
              </p>
              <Button size="sm" onClick={() => setIsCreating(true)}>
                <Plus data-icon="inline-start" />
                Criar proposta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <ProposalEditor
        key={`create-${isCreating ? prefillForm?.leadId || "open" : "closed"}`}
        open={isCreating}
        mode="create"
        initialForm={prefillForm ?? EMPTY_PROPOSAL_FORM}
        clients={clients}
        onClose={() => {
          setIsCreating(false)
          setPrefillForm(null)
        }}
        onSubmit={handleCreate}
      />
      <ProposalEditor
        key={`edit-${editing?.id ?? "closed"}`}
        open={!!editing}
        mode="edit"
        initialForm={editing ? createProposalForm(editing) : EMPTY_PROPOSAL_FORM}
        clients={clients}
        onClose={() => setEditing(null)}
        onSubmit={handleEdit}
      />
      <ProposalView
        proposal={viewing}
        onClose={() => setViewing(null)}
        onEdit={(proposal) => {
          setViewing(null)
          setEditing(proposal)
        }}
        onDuplicate={handleDuplicate}
        onShare={handleShare}
      />
    </>
  )
}

function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-3 px-4 py-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-[1.75rem] font-semibold leading-tight tracking-tight">{value}</p>
          <p className="text-[15px] leading-5 text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 line-clamp-1 text-[17px] font-medium leading-snug">{value}</p>
    </div>
  )
}
