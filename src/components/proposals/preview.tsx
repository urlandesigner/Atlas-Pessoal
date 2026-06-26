import { Badge } from "@/components/ui/badge"
import {
  DOMAIN_ADDON_PRICE,
  getProposalAddonOptions,
  getProposalAddonTotal,
  getProposalDevelopmentTotal,
  getProposalDisplayTotal,
  getProposalPaymentMethod,
  HOSTING_ADDON_PRICE,
  PROPOSAL_STATUS_LABEL,
  resolveProposalPartnership,
  type ProposalForm,
} from "@/lib/proposals/store"
import { cn } from "@/lib/utils"

import { STATUS_CLASS } from "./constants"
import { ProposalAddonExplanation } from "./addon-explanation"
import { formatAddonPrice, formatDate, money, parseNumber } from "./utils"
import { hasProposalAddons } from "./addon-copy"

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

export function ProposalPreview({ form }: { form: ProposalForm }) {
  const rawTotal = parseNumber(form.totalValue)
  const addonOptions = getProposalAddonOptions(form)
  const isPartnership = resolveProposalPartnership(Boolean(form.isPartnership), rawTotal, form.included, addonOptions)
  const paymentLabel = getProposalPaymentMethod(
    Boolean(form.isPartnership),
    form.paymentMethod,
    rawTotal,
    form.included,
    addonOptions
  )
  const includeDomain = form.included.some((i) => /(domínio|dominio)/i.test(i))
  const includeHosting = form.included.some((i) => /hospedagem/i.test(i))
  const addonTotal = getProposalAddonTotal(form.included, addonOptions)
  const total = getProposalDisplayTotal(isPartnership, rawTotal, form.included, addonOptions)
  const baseTotal = getProposalDevelopmentTotal(isPartnership, rawTotal, form.included, addonOptions)

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
        {isPartnership ? (
          includeDomain || includeHosting ? (
            <div className="rounded-xl bg-foreground p-5 text-background">
              <div className="mb-4 space-y-2 border-b border-background/15 pb-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="opacity-70">Desenvolvimento</span>
                  <span className="font-medium">Gratuito · Parceria</span>
                </div>
                {includeDomain && (
                  <div className="flex justify-between opacity-70">
                    <span>Domínio (anual)</span>
                    <span>{formatAddonPrice(DOMAIN_ADDON_PRICE, addonOptions.domainFirstYearFree)}</span>
                  </div>
                )}
                {includeHosting && (
                  <div className="flex justify-between opacity-70">
                    <span>Hospedagem (anual)</span>
                    <span>{formatAddonPrice(HOSTING_ADDON_PRICE, addonOptions.hostingFirstYearFree)}</span>
                  </div>
                )}
              </div>
              <p className="text-sm opacity-70">Total</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">{money(total)}</p>
              <div className="mt-5 rounded-lg border border-background/15 bg-background/5 p-4">
                <p className="text-sm font-medium opacity-70">Pagamento</p>
                <p className="mt-1 text-lg font-medium leading-7">{paymentLabel}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-foreground p-5 text-background">
              <p className="text-sm opacity-70">Investimento</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">Gratuito</p>
              <span className="mt-3 inline-flex items-center rounded-full border border-background/25 bg-background/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]">
                Parceria
              </span>
              <div className="mt-5 rounded-lg border border-background/15 bg-background/5 p-4">
                <p className="text-sm font-medium opacity-70">Pagamento</p>
                <p className="mt-1 text-lg font-medium leading-7">{paymentLabel}</p>
              </div>
            </div>
          )
        ) : (
        <div className="rounded-xl bg-foreground p-5 text-background">
          {includeDomain || includeHosting ? (
            <div className="mb-4 space-y-2 border-b border-background/15 pb-4 text-sm">
              <div className="flex justify-between opacity-70">
                <span>Desenvolvimento</span>
                <span>{money(baseTotal)}</span>
              </div>
              {includeDomain && (
                <div className="flex justify-between opacity-70">
                  <span>Domínio (anual)</span>
                  <span>{formatAddonPrice(DOMAIN_ADDON_PRICE, addonOptions.domainFirstYearFree, true)}</span>
                </div>
              )}
              {includeHosting && (
                <div className="flex justify-between opacity-70">
                  <span>Hospedagem (anual)</span>
                  <span>{formatAddonPrice(HOSTING_ADDON_PRICE, addonOptions.hostingFirstYearFree, true)}</span>
                </div>
              )}
            </div>
          ) : null}
          <p className="text-sm opacity-70">Valor total</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{money(total)}</p>
          <div className="mt-5 rounded-lg border border-background/15 bg-background/5 p-4">
            <p className="text-sm font-medium opacity-70">Pagamento</p>
            <p className="mt-1 text-lg font-medium leading-7">{paymentLabel}</p>
          </div>
        </div>
        )}
        {hasProposalAddons(form.included) ? (
          <ProposalAddonExplanation included={form.included} addonOptions={addonOptions} className="mt-4" />
        ) : null}
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
