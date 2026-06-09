"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Check,
  Clock3,
  ExternalLink,
  Mail,
  MessageCircle,
  Pencil,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  OPPORTUNITY_STATUS_LABEL,
  PLAN_DESCRIPTION,
  PLAN_LABEL,
  REQUEST_CATEGORY_LABEL,
  REQUEST_STATUS_LABEL,
  getChecklistProgress,
  getWarrantyDaysLeft,
  type ClientComment,
  type ClientEntry,
  type ClientOpportunity,
  type ClientRequest,
  type DeliveryStatus,
  type OpportunityStatus,
  type RequestCategory,
  type RequestStatus,
} from "@/lib/clients/store"
import { cn } from "@/lib/utils"

import { opportunityStatuses, planClass, requestCategories, requestStatuses } from "./constants"
import { Field } from "./form-sheet"
import { formatDate, money } from "./utils"

export function ProfileSheet({
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

function Info({ label, value, active }: { label: string; value: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/70 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("truncate text-right text-xs font-medium", active && "text-emerald-700 dark:text-emerald-300")}>{value}</span>
    </div>
  )
}

function SummaryItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex size-9 items-center justify-center rounded-lg bg-muted"><Icon className="size-4 text-muted-foreground" /></div><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="truncate text-sm font-medium">{value}</p></div></CardContent></Card>
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-lg border bg-muted/10 p-4"><h3 className="mb-3 text-sm font-semibold">{title}</h3><div className="space-y-3">{children}</div></section>
}
