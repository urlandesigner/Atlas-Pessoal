import {
  DOMAIN_ADDON_PRICE,
  hasProposalDomain,
  hasProposalHosting,
  HOSTING_ADDON_PRICE,
} from "@/lib/proposals/store"

export const PROPOSAL_ADDON_INTRO =
  "Domínio e hospedagem são custos de infraestrutura — não fazem parte do desenvolvimento do site, mas são indispensáveis para publicar e manter o projeto no ar. Por isso aparecem à parte, com renovação anual."

export const DOMAIN_ADDON_EXPLANATION =
  "O domínio é o endereço do site na internet (ex.: seunegocio.com.br). Sem registro ativo, não há um endereço próprio para acessar o projeto. O valor cobre o registro ou renovação anual junto ao provedor."

export const HOSTING_ADDON_EXPLANATION =
  "A hospedagem é o servidor onde os arquivos do site ficam armazenados e disponíveis. Sem ela, o site não permanece no ar. O valor cobre o plano anual de hospedagem, com renovação todo ano."

export const PROPOSAL_ADDON_FIRST_YEAR_FREE_NOTE =
  "Quando marcado como 1º ano gratuito, o custo fica por nossa conta no primeiro ano. A renovação anual passa a ser cobrada normalmente a partir do 2º ano."

export function hasProposalAddons(included: string[]) {
  return hasProposalDomain(included) || hasProposalHosting(included)
}

export function getProposalAddonNotes(
  included: string[],
  options: { domainFirstYearFree?: boolean; hostingFirstYearFree?: boolean } = {}
) {
  const notes: { title: string; text: string; price: number; firstYearFree: boolean }[] = []
  if (hasProposalDomain(included)) {
    notes.push({
      title: "Domínio",
      text: DOMAIN_ADDON_EXPLANATION,
      price: DOMAIN_ADDON_PRICE,
      firstYearFree: Boolean(options.domainFirstYearFree),
    })
  }
  if (hasProposalHosting(included)) {
    notes.push({
      title: "Hospedagem",
      text: HOSTING_ADDON_EXPLANATION,
      price: HOSTING_ADDON_PRICE,
      firstYearFree: Boolean(options.hostingFirstYearFree),
    })
  }
  return notes
}

export function renderProposalAddonExplanationHtml(
  included: string[],
  options: { domainFirstYearFree?: boolean; hostingFirstYearFree?: boolean } = {}
) {
  if (!hasProposalAddons(included)) return ""
  const notes = getProposalAddonNotes(included, options)
  const freeYearNote = notes.some((note) => note.firstYearFree)
    ? `<p style="margin-top:12px">${PROPOSAL_ADDON_FIRST_YEAR_FREE_NOTE}</p>`
    : ""
  return `<div class="blk"><h2>Sobre domínio e hospedagem</h2>
<p>${PROPOSAL_ADDON_INTRO}</p>
${freeYearNote}
${notes
  .map((note) => {
    const priceLabel = note.firstYearFree
      ? "1º ano gratuito"
      : `${note.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/ano`
    return `<section style="margin-top:16px"><h3 style="font-size:15px;margin-bottom:6px">${note.title} · ${priceLabel}</h3><p>${note.text}</p></section>`
  })
  .join("")}</div>`
}
