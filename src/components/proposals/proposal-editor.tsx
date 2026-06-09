"use client"

import { useState } from "react"
import { FileText, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
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
  DOMAIN_ADDON_PRICE,
  EMPTY_PROPOSAL_FORM,
  getProposalAddonTotal,
  getProposalDevelopmentTotal,
  HOSTING_ADDON_PRICE,
  PARTNERSHIP_PAYMENT_METHOD,
  PROPOSAL_STATUS_LABEL,
  PROPOSAL_STATUS_OPTIONS,
  PROPOSAL_TEMPLATES,
  resolveProposalPartnership,
  type EntryMode,
  type ProposalForm,
  type ProposalStatus,
} from "@/lib/proposals/store"

import { AddonToggle, EditableList, Field, FormSection, ScopeEditor } from "./editor-parts"
import { printProposal } from "./print"
import { ProposalPreview } from "./preview"
import { getRemainingValue, money, parseNumber } from "./utils"

export function ProposalEditor({
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
  const partnership = resolveProposalPartnership(
    form.isPartnership,
    parseNumber(form.totalValue),
    form.included
  )

  function set<K extends keyof ProposalForm>(field: K, value: ProposalForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function syncInvestmentTotal(prev: ProposalForm, included: string[]): string {
    const addonTotal = getProposalAddonTotal(included)
    if (prev.isPartnership) return String(addonTotal)
    const development = getProposalDevelopmentTotal(false, parseNumber(prev.totalValue), prev.included)
    return String(development + addonTotal)
  }

  function togglePartnership(checked: boolean) {
    setForm((prev) => {
      const addonTotal = getProposalAddonTotal(prev.included)
      if (!checked) {
        return {
          ...prev,
          isPartnership: false,
          totalValue: syncInvestmentTotal({ ...prev, isPartnership: false }, prev.included),
          paymentMethod:
            prev.paymentMethod === PARTNERSHIP_PAYMENT_METHOD
              ? EMPTY_PROPOSAL_FORM.paymentMethod
              : prev.paymentMethod || EMPTY_PROPOSAL_FORM.paymentMethod,
        }
      }
      return {
        ...prev,
        isPartnership: true,
        totalValue: String(addonTotal),
        entryValue: addonTotal > 0 ? prev.entryValue : "0",
        paymentMethod: PARTNERSHIP_PAYMENT_METHOD,
      }
    })
  }

  function toggleDomain(checked: boolean) {
    setForm((prev) => {
      const included = checked
        ? [...prev.included.filter((i) => !/(domínio|dominio)/i.test(i)), "Domínio (R$ 40/ano)"]
        : prev.included.filter((i) => !/(domínio|dominio)/i.test(i))
      return {
        ...prev,
        totalValue: syncInvestmentTotal(prev, included),
        included,
        notIncluded: checked
          ? prev.notIncluded.filter((i) => !/(domínio|dominio)/i.test(i))
          : [...prev.notIncluded.filter((i) => !/(domínio|dominio)/i.test(i)), "Domínio"],
      }
    })
  }

  function toggleHosting(checked: boolean) {
    setForm((prev) => {
      const included = checked
        ? [...prev.included.filter((i) => !/hospedagem/i.test(i)), "Hospedagem (R$ 250/ano)"]
        : prev.included.filter((i) => !/hospedagem/i.test(i))
      return {
        ...prev,
        totalValue: syncInvestmentTotal(prev, included),
        included,
        notIncluded: checked
          ? prev.notIncluded.filter((i) => !/hospedagem/i.test(i))
          : [...prev.notIncluded.filter((i) => !/hospedagem/i.test(i)), "Hospedagem"],
      }
    })
  }

  function handleIncludedChange(items: string[]) {
    setForm((prev) => ({
      ...prev,
      included: items,
      totalValue: syncInvestmentTotal(prev, items),
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
                <AddonToggle
                  label="Parceria (gratuito)"
                  detail="Zera o valor do desenvolvimento. Pagamento aparece como “A combinar” na proposta."
                  checked={partnership}
                  onToggle={togglePartnership}
                />
                {partnership ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-dashed bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
                      Desenvolvimento em parceria — sem cobrança. O cliente verá <strong className="text-foreground">Gratuito · Parceria</strong>. Domínio e hospedagem, se marcados abaixo, continuam cobrados à parte.
                    </div>
                    <Field label="Forma de pagamento">
                      <Input value={PARTNERSHIP_PAYMENT_METHOD} readOnly />
                    </Field>
                  </div>
                ) : (
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
                )}
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
                  onChange={handleIncludedChange}
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
