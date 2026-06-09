import {
  DOMAIN_ADDON_PRICE,
  getProposalAddonTotal,
  getProposalDevelopmentTotal,
  getProposalDisplayTotal,
  getProposalPaymentMethod,
  HOSTING_ADDON_PRICE,
  PARTNERSHIP_PAYMENT_METHOD,
  resolveProposalPartnership,
  type ProposalEntry,
  type ProposalForm,
} from "@/lib/proposals/store"

import { formatDate, money, parseNumber } from "./utils"

export function createPrintHtml(form: ProposalForm | ProposalEntry) {
  const rawTotal = typeof form.totalValue === "number" ? form.totalValue : parseNumber(form.totalValue)
  const printIncludeDomain = form.included.some((i) => /(domínio|dominio)/i.test(i))
  const printIncludeHosting = form.included.some((i) => /hospedagem/i.test(i))
  const printAddonTotal = getProposalAddonTotal(form.included)
  const isPartnership = resolveProposalPartnership(form.isPartnership, rawTotal, form.included)
  const total = getProposalDisplayTotal(form.isPartnership, rawTotal, form.included)
  const printBaseTotal = getProposalDevelopmentTotal(form.isPartnership, rawTotal, form.included)
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
${
  isPartnership
    ? printAddonTotal > 0
      ? `<table style="width:100%;border-collapse:collapse;margin-bottom:8px;font-size:15px"><tr><td>Desenvolvimento</td><td style="text-align:right"><strong>Gratuito · Parceria</strong></td></tr>${printIncludeDomain ? `<tr><td>Domínio (anual)</td><td style="text-align:right">${money(DOMAIN_ADDON_PRICE)}</td></tr>` : ""}${printIncludeHosting ? `<tr><td>Hospedagem (anual)</td><td style="text-align:right">${money(HOSTING_ADDON_PRICE)}</td></tr>` : ""}</table>
<p class="price">${money(total)}</p>
<p>Pagamento: <strong>${getProposalPaymentMethod(form.isPartnership, form.paymentMethod, rawTotal, form.included)}</strong></p>
<p>Desenvolvimento em parceria, sem cobrança. Domínio e hospedagem são cobranças anuais à parte.</p>`
      : `<p class="price">Gratuito · Parceria</p>
<p>Pagamento: <strong>${PARTNERSHIP_PAYMENT_METHOD}</strong></p>
<p>Projeto executado em parceria, sem cobrança.</p>`
    : `${printAddonTotal > 0 ? `<table style="width:100%;border-collapse:collapse;margin-bottom:8px;font-size:15px"><tr><td>Desenvolvimento</td><td style="text-align:right">${money(printBaseTotal)}</td></tr>${printIncludeDomain ? `<tr><td>Domínio (anual)</td><td style="text-align:right">+ ${money(DOMAIN_ADDON_PRICE)}</td></tr>` : ""}${printIncludeHosting ? `<tr><td>Hospedagem (anual)</td><td style="text-align:right">+ ${money(HOSTING_ADDON_PRICE)}</td></tr>` : ""}</table>` : ""}
<p class="price">${money(total)}</p>
<p>Pagamento: <strong>${getProposalPaymentMethod(form.isPartnership, form.paymentMethod, rawTotal, form.included)}</strong></p>`
}</div>
<div class="blk"><h2>Inclusos</h2><ul>${form.included.map((item) => `<li>${item}</li>`).join("")}</ul></div>
<div class="blk"><h2>Não inclusos</h2><ul>${form.notIncluded.map((item) => `<li>${item}</li>`).join("")}</ul></div>
${form.notes ? `<div class="blk"><h2>Observações</h2><p>${form.notes}</p></div>` : ""}
</body>
</html>`
}

export function printProposal(form: ProposalForm | ProposalEntry) {
  sessionStorage.setItem("atlas-print-proposal", createPrintHtml(form))
  window.open("/print/proposal", "_blank")
}
