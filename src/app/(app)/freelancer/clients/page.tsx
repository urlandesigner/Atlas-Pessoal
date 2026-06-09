"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  CalendarClock,
  Check,
  Clock3,
  ExternalLink,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users2,
  WalletCards,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  CLIENT_STATUS_LABEL,
  EMPTY_POST_SALE_CLIENT_FORM,
  OPPORTUNITY_STATUS_LABEL,
  PLAN_DESCRIPTION,
  PLAN_LABEL,
  REQUEST_CATEGORY_LABEL,
  REQUEST_STATUS_LABEL,
  addClientToCollection,
  createPostSaleClientForm,
  createPostSaleClientFromForm,
  emitClientsChange,
  getChecklistProgress,
  getClientsServerSnapshot,
  getClientsSnapshot,
  getLastInteraction,
  getWarrantyDaysLeft,
  saveClients,
  subscribeClientsStore,
  updateClientRecord,
  updatePostSaleClientInCollection,
  type ClientComment,
  type ClientEntry,
  type ClientOpportunity,
  type ClientRequest,
  type ClientStatus,
  type DeliveryStatus,
  type MaintenancePlan,
  type OpportunityStatus,
  type PostSaleClientForm,
  type RequestCategory,
  type RequestStatus,
} from "@/lib/clients/store"
import { cn } from "@/lib/utils"

type SortMode = "recent" | "name" | "delivery" | "plan"

const planOptions: MaintenancePlan[] = ["none", "essential", "professional", "growth"]
const statusOptions: ClientStatus[] = ["active", "onboarding", "paused", "inactive"]
const requestCategories: RequestCategory[] = ["fix", "content", "visual", "feature", "question"]
const requestStatuses: RequestStatus[] = ["open", "in_progress", "done", "canceled"]
const opportunityStatuses: OpportunityStatus[] = ["identified", "presented", "negotiation", "won", "lost"]

const planClass: Record<MaintenancePlan, string> = {
  none: "border-muted-foreground/20 bg-muted text-muted-foreground",
  essential: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  professional: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  growth: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(value: string | null | undefined, fallback = "Sem data") {
  if (!value) return fallback
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function getWarrantyLabel(client: ClientEntry) {
  const days = getWarrantyDaysLeft(client)
  if (days === null) return "Sem entrega"
  if (days <= 0) return "Garantia encerrada"
  return `Restam ${days} dias`
}

function isWarrantyActive(client: ClientEntry) {
  const days = getWarrantyDaysLeft(client)
  return days !== null && days > 0
}

function Metric({ label, value, icon: Icon, hint }: { label: string; value: string | number; icon: React.ElementType; hint: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}


function ClientFormSheet({
  open,
  mode,
  initialForm,
  onClose,
  onSubmit,
}: {
  open: boolean
  mode: "create" | "edit"
  initialForm: PostSaleClientForm
  onClose: () => void
  onSubmit: (form: PostSaleClientForm) => void
}) {
  const [form, setForm] = useState(initialForm)

  function set(field: keyof PostSaleClientForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function close() {
    setForm(initialForm)
    onClose()
  }

  function submit() {
    if (!form.name.trim()) return
    onSubmit(form)
    setForm(initialForm)
  }

  return (
    <Sheet open={open} onOpenChange={(value) => !value && close()}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full sm:data-[side=right]:w-[42rem] sm:data-[side=right]:max-w-[42rem]" side="right">
        <SheetHeader className="border-b px-5 pb-4 pt-5 pr-12">
          <SheetTitle className="text-base">{mode === "create" ? "Novo cliente" : "Editar cliente"}</SheetTitle>
          <p className="text-xs text-muted-foreground">Dados principais do relacionamento, projeto, garantia e plano.</p>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="grid gap-5 p-5">
            <FormBlock title="Resumo">
              <Field label="Nome *"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Empresa"><Input value={form.company} onChange={(e) => set("company", e.target.value)} /></Field>
              <Field label="WhatsApp"><Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></Field>
              <Field label="E-mail"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
              <Field label="Status">
                <select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}>
                  {statusOptions.map((status) => <option key={status} value={status}>{CLIENT_STATUS_LABEL[status]}</option>)}
                </select>
              </Field>
            </FormBlock>
            <FormBlock title="Projeto atual">
              <Field label="Projeto contratado"><Input value={form.projectName} onChange={(e) => set("projectName", e.target.value)} /></Field>
              <Field label="Tipo"><Input value={form.projectType} onChange={(e) => set("projectType", e.target.value)} /></Field>
              <Field label="Inicio"><Input type="date" value={form.projectStartDate} onChange={(e) => set("projectStartDate", e.target.value)} /></Field>
              <Field label="Entrega"><Input type="date" value={form.projectDeliveryDate} onChange={(e) => set("projectDeliveryDate", e.target.value)} /></Field>
              <Field label="Valor contratado"><Input type="number" value={form.contractedValue} onChange={(e) => set("contractedValue", e.target.value)} /></Field>
              <Field label="Site publicado"><Input value={form.publishedSiteUrl} onChange={(e) => set("publishedSiteUrl", e.target.value)} /></Field>
            </FormBlock>
            <FormBlock title="Plano e garantia">
              <Field label="Plano atual">
                <select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={form.plan} onChange={(e) => set("plan", e.target.value)}>
                  {planOptions.map((plan) => <option key={plan} value={plan}>{PLAN_LABEL[plan]}</option>)}
                </select>
              </Field>
              <Field label="Data de contratacao"><Input type="date" value={form.planStartedAt} onChange={(e) => set("planStartedAt", e.target.value)} /></Field>
              <Field label="Valor mensal"><Input type="number" value={form.monthlyValue} onChange={(e) => set("monthlyValue", e.target.value)} /></Field>
              <Field label="Data da entrega"><Input type="date" value={form.warrantyDeliveryDate} onChange={(e) => set("warrantyDeliveryDate", e.target.value)} /></Field>
              <Field label="Dias de garantia"><Input type="number" value={form.warrantyDays} onChange={(e) => set("warrantyDays", e.target.value)} /></Field>
            </FormBlock>
          </div>
        </ScrollArea>
        <SheetFooter className="flex flex-row gap-2 border-t px-5 py-4">
          <Button variant="ghost" className="flex-1" onClick={close}>Cancelar</Button>
          <Button className="flex-1" onClick={submit} disabled={!form.name.trim()}>Salvar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">{label}{children}</label>
}

function FormBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="grid gap-3 rounded-lg border bg-muted/10 p-4"><h3 className="text-sm font-semibold text-foreground">{title}</h3><div className="grid gap-3 sm:grid-cols-2">{children}</div></section>
}


function Info({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/70 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("truncate text-right text-xs font-medium", active && "text-emerald-700 dark:text-emerald-300")}>{value}</span>
    </div>
  )
}

function ProfileSheet({
  client,
  onClose,
  onEdit,
  onUpdate,
}: {
  client: ClientEntry | null
  onClose: () => void
  onEdit: (client: ClientEntry) => void
  onUpdate: (client: ClientEntry) => void
}) {
  const [comment, setComment] = useState("")
  const [request, setRequest] = useState({ title: "", category: "fix" as RequestCategory, description: "", status: "open" as RequestStatus })
  const [opportunity, setOpportunity] = useState({ title: "", description: "", revenuePotential: "", status: "identified" as OpportunityStatus })

  function updateClient(next: ClientEntry) {
    onUpdate(next)
  }

  if (!client) return null
  const currentClient = client
  const progress = getChecklistProgress(currentClient)
  const daysLeft = getWarrantyDaysLeft(currentClient)

  function addComment() {
    if (!comment.trim()) return
    const entry: ClientComment = { id: crypto.randomUUID(), author: "Voce", body: comment.trim(), created_at: new Date().toISOString() }
    updateClient({ ...currentClient, comments: [entry, ...currentClient.comments], timeline: [{ id: crypto.randomUUID(), type: "comment", title: "Comentario interno", description: entry.body, created_at: entry.created_at, author: entry.author }, ...currentClient.timeline] })
    setComment("")
  }

  function addRequest() {
    if (!request.title.trim()) return
    const entry: ClientRequest = { id: crypto.randomUUID(), title: request.title, category: request.category, description: request.description, status: request.status, date: new Date().toISOString().slice(0, 10) }
    updateClient({ ...currentClient, requests: [entry, ...currentClient.requests], timeline: [{ id: crypto.randomUUID(), type: "request", title: "Solicitacao registrada", description: entry.title, created_at: new Date().toISOString(), author: "Voce" }, ...currentClient.timeline] })
    setRequest({ title: "", category: "fix", description: "", status: "open" })
  }

  function addOpportunity() {
    if (!opportunity.title.trim()) return
    const entry: ClientOpportunity = { id: crypto.randomUUID(), title: opportunity.title, description: opportunity.description, revenuePotential: Number(opportunity.revenuePotential) || 0, status: opportunity.status }
    updateClient({ ...currentClient, opportunities: [entry, ...currentClient.opportunities] })
    setOpportunity({ title: "", description: "", revenuePotential: "", status: "identified" })
  }

  function updateDelivery(field: string, value: string) {
    updateClient({ ...currentClient, delivery: { ...currentClient.delivery, [field]: value } })
  }

  function updateIntegration(field: keyof ClientEntry["delivery"]["integrations"], value: DeliveryStatus) {
    updateClient({ ...currentClient, delivery: { ...currentClient.delivery, integrations: { ...currentClient.delivery.integrations, [field]: value } } })
  }

  return (
    <Sheet open={!!client} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex h-dvh min-h-0 flex-col gap-0 p-0 data-[side=right]:w-full sm:data-[side=right]:w-[64rem] sm:data-[side=right]:max-w-[64rem]" side="right">
        <SheetHeader className="shrink-0 border-b px-5 pb-4 pt-5 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="text-lg">{client.name}</SheetTitle>
            <Badge variant="outline" className={cn("font-normal", planClass[client.plan])}>{PLAN_LABEL[client.plan]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{client.company || "Sem empresa"} · {client.projectName}</p>
          {client.leadId ? (
            <Link
              href={`/crm/${client.leadId}`}
              className="inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              <ArrowUpRight className="size-3.5" />
              Ver lead de origem
            </Link>
          ) : null}
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-5">
            <Tabs defaultValue="summary">
              <TabsList className="mb-5 flex w-full flex-wrap justify-start">
                <TabsTrigger value="summary">Resumo</TabsTrigger>
                <TabsTrigger value="delivery">Entrega</TabsTrigger>
                <TabsTrigger value="requests">Solicitacoes</TabsTrigger>
                <TabsTrigger value="plan">Garantia & Plano</TabsTrigger>
                <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="grid gap-5">
                <div className="grid gap-4 lg:grid-cols-3">
                  <SummaryItem icon={MessageCircle} label="WhatsApp" value={client.whatsapp || "Nao informado"} />
                  <SummaryItem icon={Mail} label="E-mail" value={client.email || "Nao informado"} />
                  <SummaryItem icon={Clock3} label="Entrada" value={formatDate(client.entryDate)} />
                </div>
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                  <Panel title="Projeto atual">
                    <Info label="Nome" value={client.projectName} />
                    <Info label="Tipo" value={client.projectType} />
                    <Info label="Inicio" value={formatDate(client.projectStartDate)} />
                    <Info label="Entrega" value={formatDate(client.projectDeliveryDate)} />
                    <Info label="Valor" value={money(client.contractedValue)} />
                    {client.publishedSiteUrl ? <Link className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline" href={client.publishedSiteUrl} target="_blank">Site publicado <ExternalLink className="size-3" /></Link> : null}
                  </Panel>
                  <Panel title="Timeline">
                    <div className="space-y-3">
                      {client.timeline.map((item) => (
                        <div key={item.id} className="rounded-lg border bg-background px-3 py-2">
                          <div className="flex justify-between gap-3 text-xs text-muted-foreground"><span>{item.author}</span><span>{formatDate(item.created_at)}</span></div>
                          <p className="mt-1 text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
                <Panel title="Comentarios internos">
                  <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Cliente muito satisfeito, interessado em SEO..." className="min-h-24" />
                  <Button size="sm" className="mt-3" onClick={addComment}>Registrar comentario</Button>
                  <div className="mt-4 space-y-2">
                    {client.comments.map((item) => <Info key={item.id} label={`${item.author} · ${formatDate(item.created_at)}`} value={item.body} />)}
                  </div>
                </Panel>
              </TabsContent>

              <TabsContent value="delivery" className="grid gap-5">
                <Panel title={`Checklist de entrega · ${progress}%`}>
                  <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-foreground" style={{ width: `${progress}%` }} /></div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {client.checklist.map((item) => (
                      <button key={item.id} type="button" onClick={() => updateClient({ ...client, checklist: client.checklist.map((candidate) => candidate.id === item.id ? { ...candidate, completed: !candidate.completed } : candidate) })} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted/30">
                        <span className={cn("flex size-5 items-center justify-center rounded border", item.completed && "border-foreground bg-foreground text-background")}>{item.completed ? <Check className="size-3" /> : null}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </Panel>
                <div className="grid gap-4 lg:grid-cols-3">
                  <Panel title="Site">
                    <Field label="URL do site"><Input value={client.delivery.siteUrl} onChange={(e) => updateDelivery("siteUrl", e.target.value)} /></Field>
                    <Field label="URL de homologacao"><Input value={client.delivery.stagingUrl} onChange={(e) => updateDelivery("stagingUrl", e.target.value)} /></Field>
                  </Panel>
                  <Panel title="Dominio">
                    <Field label="Dominio"><Input value={client.delivery.domainName} onChange={(e) => updateDelivery("domainName", e.target.value)} /></Field>
                    <Field label="Vencimento"><Input type="date" value={client.delivery.domainExpiresAt} onChange={(e) => updateDelivery("domainExpiresAt", e.target.value)} /></Field>
                  </Panel>
                  <Panel title="Hospedagem">
                    <Field label="Provedor"><Input value={client.delivery.hostingProvider} onChange={(e) => updateDelivery("hostingProvider", e.target.value)} /></Field>
                    <Field label="Vencimento"><Input type="date" value={client.delivery.hostingExpiresAt} onChange={(e) => updateDelivery("hostingExpiresAt", e.target.value)} /></Field>
                  </Panel>
                </div>
                <Panel title="Integracoes">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(client.delivery.integrations).map(([key, value]) => (
                      <Field key={key} label={key.replace(/([A-Z])/g, " $1")}>
                        <select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={value} onChange={(e) => updateIntegration(key as keyof ClientEntry["delivery"]["integrations"], e.target.value as DeliveryStatus)}>
                          <option value="configured">Configurado</option>
                          <option value="not_configured">Nao configurado</option>
                        </select>
                      </Field>
                    ))}
                  </div>
                </Panel>
              </TabsContent>

              <TabsContent value="requests" className="grid gap-5">
                <Panel title="Nova solicitacao">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Titulo"><Input value={request.title} onChange={(e) => setRequest((prev) => ({ ...prev, title: e.target.value }))} /></Field>
                    <Field label="Categoria"><select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={request.category} onChange={(e) => setRequest((prev) => ({ ...prev, category: e.target.value as RequestCategory }))}>{requestCategories.map((item) => <option key={item} value={item}>{REQUEST_CATEGORY_LABEL[item]}</option>)}</select></Field>
                    <Field label="Status"><select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={request.status} onChange={(e) => setRequest((prev) => ({ ...prev, status: e.target.value as RequestStatus }))}>{requestStatuses.map((item) => <option key={item} value={item}>{REQUEST_STATUS_LABEL[item]}</option>)}</select></Field>
                    <Field label="Descricao"><Input value={request.description} onChange={(e) => setRequest((prev) => ({ ...prev, description: e.target.value }))} /></Field>
                  </div>
                  <Button size="sm" className="mt-3" onClick={addRequest}>Criar chamado</Button>
                </Panel>
                <div className="grid gap-3">
                  {client.requests.map((item) => (
                    <Card key={item.id}><CardContent className="flex flex-wrap items-start justify-between gap-3 p-4"><div><p className="font-medium">{item.title}</p><p className="text-sm text-muted-foreground">{REQUEST_CATEGORY_LABEL[item.category]} · {item.description}</p></div><Badge variant="outline">{REQUEST_STATUS_LABEL[item.status]}</Badge></CardContent></Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="plan" className="grid gap-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Panel title="Garantia">
                    <div className="rounded-lg border bg-background p-4">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="mt-1 text-2xl font-semibold">{daysLeft !== null && daysLeft > 0 ? "Garantia ativa" : "Garantia encerrada"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{daysLeft === null ? "Informe a data da entrega." : daysLeft > 0 ? `Restam ${daysLeft} dias de garantia.` : "Periodo de garantia finalizado."}</p>
                    </div>
                    <Info label="Data da entrega" value={formatDate(client.warrantyDeliveryDate)} />
                    <Info label="Dias de garantia" value={`${client.warrantyDays} dias`} />
                  </Panel>
                  <Panel title="Plano contratado">
                    <Badge variant="outline" className={cn("mb-3 font-normal", planClass[client.plan])}>{PLAN_LABEL[client.plan]}</Badge>
                    <div className="space-y-2">{PLAN_DESCRIPTION[client.plan].map((item) => <Info key={item} label="Inclui" value={item} />)}</div>
                    <Info label="Contratacao" value={formatDate(client.planStartedAt)} />
                    <Info label="Valor mensal" value={money(client.monthlyValue)} />
                  </Panel>
                </div>
              </TabsContent>

              <TabsContent value="opportunities" className="grid gap-5">
                <Panel title="Nova oportunidade">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Titulo"><Input value={opportunity.title} onChange={(e) => setOpportunity((prev) => ({ ...prev, title: e.target.value }))} /></Field>
                    <Field label="Potencial de receita"><Input type="number" value={opportunity.revenuePotential} onChange={(e) => setOpportunity((prev) => ({ ...prev, revenuePotential: e.target.value }))} /></Field>
                    <Field label="Status"><select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={opportunity.status} onChange={(e) => setOpportunity((prev) => ({ ...prev, status: e.target.value as OpportunityStatus }))}>{opportunityStatuses.map((item) => <option key={item} value={item}>{OPPORTUNITY_STATUS_LABEL[item]}</option>)}</select></Field>
                    <Field label="Descricao"><Input value={opportunity.description} onChange={(e) => setOpportunity((prev) => ({ ...prev, description: e.target.value }))} /></Field>
                  </div>
                  <Button size="sm" className="mt-3" onClick={addOpportunity}>Registrar oportunidade</Button>
                </Panel>
                <div className="grid gap-3 md:grid-cols-2">
                  {client.opportunities.map((item) => (
                    <Card key={item.id}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{item.title}</p><p className="text-sm text-muted-foreground">{item.description || "Sem descricao"}</p></div><Badge variant="outline">{OPPORTUNITY_STATUS_LABEL[item.status]}</Badge></div><p className="mt-3 text-sm font-medium">{money(item.revenuePotential)}</p></CardContent></Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
        <div className="shrink-0 flex flex-wrap gap-2 border-t px-5 py-4">
          <Button variant="outline" onClick={() => onEdit(client)}><Pencil data-icon="inline-start" />Editar perfil</Button>
          <Button variant="ghost" className="ml-auto" onClick={onClose}>Fechar</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SummaryItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex size-9 items-center justify-center rounded-lg bg-muted"><Icon className="size-4 text-muted-foreground" /></div><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="truncate text-sm font-medium">{value}</p></div></CardContent></Card>
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border bg-muted/10 p-4"><h3 className="mb-3 text-sm font-semibold">{title}</h3><div className="space-y-3">{children}</div></section>
}

export default function ClientsPage() {
  const clients = useSyncExternalStore(subscribeClientsStore, getClientsSnapshot, getClientsServerSnapshot)
  const [isAdding, setIsAdding] = useState(false)
  const [editing, setEditing] = useState<ClientEntry | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [planFilter, setPlanFilter] = useState<MaintenancePlan | "all">("all")
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all")
  const [sort, setSort] = useState<SortMode>("recent")

  const viewing = clients.find((client) => client.id === viewingId) ?? null

  const metrics = useMemo(() => {
    const withPlan = clients.filter((client) => client.plan !== "none")
    const opportunities = clients.flatMap((client) => client.opportunities)
    return {
      active: clients.filter((client) => client.status === "active" || client.status === "onboarding").length,
      withPlan: withPlan.length,
      mrr: withPlan.reduce((sum, client) => sum + client.monthlyValue, 0),
      warranties: clients.filter(isWarrantyActive).length,
      openRequests: clients.flatMap((client) => client.requests).filter((request) => request.status === "open" || request.status === "in_progress").length,
      opportunities: opportunities.filter((item) => item.status !== "won" && item.status !== "lost").length,
    }
  }, [clients])

  const filtered = useMemo(() => {
    const search = normalizeSearch(query)
    return clients
      .filter((client) => {
        if (planFilter !== "all" && client.plan !== planFilter) return false
        if (statusFilter !== "all" && client.status !== statusFilter) return false
        if (!search) return true
        return normalizeSearch([client.name, client.company, client.projectName, client.email].join(" ")).includes(search)
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name, "pt-BR")
        if (sort === "delivery") return (a.projectDeliveryDate || "9999").localeCompare(b.projectDeliveryDate || "9999")
        if (sort === "plan") return PLAN_LABEL[a.plan].localeCompare(PLAN_LABEL[b.plan], "pt-BR")
        return getLastInteraction(b).localeCompare(getLastInteraction(a))
      })
  }, [clients, planFilter, query, sort, statusFilter])

  function persist(next: ClientEntry[]) {
    saveClients(next)
    emitClientsChange()
  }

  function handleCreate(form: PostSaleClientForm) {
    persist(addClientToCollection(clients, createPostSaleClientFromForm(form)))
    setIsAdding(false)
  }

  function handleEdit(form: PostSaleClientForm) {
    if (!editing) return
    persist(updatePostSaleClientInCollection(clients, editing.id, form))
    setEditing(null)
  }

  function handleUpdate(client: ClientEntry) {
    persist(updateClientRecord(clients, client))
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Clientes"
          description="CRM pos-venda para acompanhar entrega, suporte, garantia, recorrencia e novas oportunidades."
          actions={
            <Button size="sm" onClick={() => setIsAdding(true)}>
              <Plus data-icon="inline-start" />Novo cliente
            </Button>
          }
        />

        {/* Stats Bar */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
          <Metric label="Clientes ativos" value={metrics.active} icon={Users2} hint="Em relacionamento" />
          <Metric label="Com plano" value={metrics.withPlan} icon={ShieldCheck} hint="Recorrencia ativa" />
          <Metric label="MRR" value={money(metrics.mrr)} icon={WalletCards} hint="Receita mensal" />
          <Metric label="Garantias" value={metrics.warranties} icon={CalendarClock} hint="Ainda ativas" />
          <Metric label="Solicitacoes" value={metrics.openRequests} icon={Ticket} hint="Abertas ou andamento" />
          <Metric label="Oportunidades" value={metrics.opportunities} icon={Sparkles} hint="Pipeline futuro" />
        </div>

        {/* Filters */}
        <Card className="py-0">
          <CardContent className="px-4 py-3">
            <div className="grid gap-3 lg:grid-cols-[1fr_11rem_11rem_10rem]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente, empresa ou projeto..." className="pl-9" />
              </div>
              <select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={planFilter} onChange={(e) => setPlanFilter(e.target.value as MaintenancePlan | "all")}><option value="all">Todos planos</option>{planOptions.map((plan) => <option key={plan} value={plan}>{PLAN_LABEL[plan]}</option>)}</select>
              <select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ClientStatus | "all")}><option value="all">Todos status</option>{statusOptions.map((status) => <option key={status} value={status}>{CLIENT_STATUS_LABEL[status]}</option>)}</select>
              <select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}><option value="recent">Mais recentes</option><option value="name">Nome</option><option value="delivery">Entrega</option><option value="plan">Plano</option></select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/15 px-6 py-14 text-center">
            <Users2 className="mx-auto size-9 text-muted-foreground" />
            <h2 className="mt-4 font-semibold">Nenhum cliente encontrado</h2>
            <p className="mt-1 text-sm text-muted-foreground">Aprovacoes de propostas tambem criam clientes automaticamente.</p>
          </div>
        ) : (
          <Card className="overflow-hidden py-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                    <TableHead className="hidden lg:table-cell">Empresa</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead className="hidden md:table-cell">Plano</TableHead>
                    <TableHead className="hidden lg:table-cell">Garantia</TableHead>
                    <TableHead className="hidden lg:table-cell">Última interação</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((client) => (
                    <TableRow key={client.id} onClick={() => setViewingId(client.id)} className="cursor-pointer">
                      <TableCell className="hidden sm:table-cell font-medium">{client.name}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">{client.company || "-"}</TableCell>
                      <TableCell className="text-sm">{client.projectName}</TableCell>
                      <TableCell className="hidden md:table-cell"><Badge variant="outline" className={cn("font-normal text-xs", planClass[client.plan])}>{PLAN_LABEL[client.plan]}</Badge></TableCell>
                      <TableCell className="hidden lg:table-cell text-xs">{getWarrantyLabel(client)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{formatDate(getLastInteraction(client))}</TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setViewingId(client.id) }}>Abrir</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      <ClientFormSheet key={`create-${isAdding}`} open={isAdding} mode="create" initialForm={EMPTY_POST_SALE_CLIENT_FORM} onClose={() => setIsAdding(false)} onSubmit={handleCreate} />
      <ClientFormSheet key={`edit-${editing?.id ?? "closed"}`} open={!!editing} mode="edit" initialForm={editing ? createPostSaleClientForm(editing) : EMPTY_POST_SALE_CLIENT_FORM} onClose={() => setEditing(null)} onSubmit={handleEdit} />
      <ProfileSheet client={viewing} onClose={() => setViewingId(null)} onEdit={(client) => setEditing(client)} onUpdate={handleUpdate} />
    </>
  )
}
