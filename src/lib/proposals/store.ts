"use client"

export type ProposalStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "approved"
  | "rejected"
  | "expired"

export type EntryMode = "percent" | "value"

export const DOMAIN_ADDON_PRICE = 40
export const HOSTING_ADDON_PRICE = 250

export interface ProposalScopeCategory {
  id: string
  name: string
  items: string[]
}

export interface ProposalEntry {
  id: string
  title: string
  clientId: string | null
  clientName: string
  projectId: string | null
  proposalDate: string
  validUntil: string
  objective: string
  scope: ProposalScopeCategory[]
  estimatedDeadline: string
  totalValue: number
  entryMode: EntryMode
  entryValue: number
  paymentMethod: string
  included: string[]
  notIncluded: string[]
  notes: string | null
  status: ProposalStatus
  created_at: string
  updated_at: string
}

export interface ProposalForm {
  title: string
  clientId: string
  clientName: string
  projectId: string
  proposalDate: string
  validUntil: string
  objective: string
  scope: ProposalScopeCategory[]
  estimatedDeadline: string
  totalValue: string
  entryMode: EntryMode
  entryValue: string
  paymentMethod: string
  included: string[]
  notIncluded: string[]
  notes: string
  status: ProposalStatus
}

export interface ProposalTemplate {
  id: string
  name: string
  title: string
  objective: string
  scope: Omit<ProposalScopeCategory, "id">[]
  estimatedDeadline: string
  totalValue: string
  entryMode: EntryMode
  entryValue: string
  paymentMethod: string
  included: string[]
  notIncluded: string[]
  notes: string
}

export const PROPOSALS_STORAGE_KEY = "atlas_proposals"
export const PROPOSALS_STORAGE_EVENT = "atlas-proposals-change"

const DEFAULT_PAYMENT_METHOD = "50% na aprovação/publicação e 50% pra 30 dias"

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  viewed: "Visualizada",
  approved: "Aprovada",
  rejected: "Recusada",
  expired: "Expirada",
}

export const PROPOSAL_STATUS_OPTIONS: ProposalStatus[] = [
  "draft",
  "sent",
  "viewed",
  "approved",
  "rejected",
  "expired",
]

export const EMPTY_PROPOSAL_FORM: ProposalForm = {
  title: "",
  clientId: "",
  clientName: "",
  projectId: "",
  proposalDate: new Date().toISOString().split("T")[0],
  validUntil: "",
  objective: "",
  scope: [],
  estimatedDeadline: "",
  totalValue: "",
  entryMode: "percent",
  entryValue: "50",
  paymentMethod: DEFAULT_PAYMENT_METHOD,
  included: [],
  notIncluded: [],
  notes: "",
  status: "draft",
}

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  {
    id: "site-institucional",
    name: "Site Institucional",
    title: "Website institucional",
    objective:
      "Desenvolver um website institucional para fortalecer a presença digital da empresa e ampliar a geração de contatos qualificados.",
    scope: [
      { name: "Estrutura do site", items: ["Home", "Sobre", "Serviços", "Contato"] },
      { name: "Funcionalidades", items: ["WhatsApp", "Formulário de contato", "SEO básico"] },
      { name: "Entrega", items: ["Design responsivo", "Publicação", "Configuração inicial"] },
    ],
    estimatedDeadline: "10 dias úteis",
    totalValue: "4500",
    entryMode: "percent",
    entryValue: "50",
    paymentMethod: DEFAULT_PAYMENT_METHOD,
    included: [
      "Design personalizado",
      "Desenvolvimento responsivo",
      "SEO básico",
      "Publicação",
      "Suporte de 30 dias",
    ],
    notIncluded: ["Hospedagem", "Domínio", "Produção de conteúdo", "Tráfego pago"],
    notes: "Prazo contado após aprovação da proposta e envio dos materiais necessários.",
  },
  {
    id: "landing-page",
    name: "Landing Page",
    title: "Landing page de conversão",
    objective:
      "Criar uma página focada em conversão para apresentar uma oferta, captar leads e apoiar campanhas comerciais ou de tráfego.",
    scope: [
      { name: "Página", items: ["Hero", "Benefícios", "Prova social", "FAQ", "Chamada final"] },
      { name: "Funcionalidades", items: ["Formulário", "Integração com WhatsApp", "Tags básicas de mensuração"] },
    ],
    estimatedDeadline: "10 dias úteis",
    totalValue: "2500",
    entryMode: "percent",
    entryValue: "50",
    paymentMethod: DEFAULT_PAYMENT_METHOD,
    included: ["Design responsivo", "Desenvolvimento da página", "SEO básico", "Publicação"],
    notIncluded: ["Copywriting completo", "Gestão de anúncios", "Ferramenta de email marketing"],
    notes: "",
  },
  {
    id: "sistema-web",
    name: "Sistema Web",
    title: "Sistema web sob medida",
    objective:
      "Desenvolver um sistema web para organizar processos internos, reduzir trabalho manual e centralizar informações operacionais.",
    scope: [
      { name: "Produto", items: ["Levantamento de requisitos", "Fluxos principais", "Painel administrativo"] },
      { name: "Funcionalidades", items: ["Autenticação", "CRUDs principais", "Dashboard", "Relatórios básicos"] },
      { name: "Entrega técnica", items: ["Deploy", "Banco de dados", "Documentação inicial"] },
    ],
    estimatedDeadline: "45 dias úteis",
    totalValue: "15000",
    entryMode: "percent",
    entryValue: "40",
    paymentMethod: DEFAULT_PAYMENT_METHOD,
    included: ["Discovery inicial", "UI responsiva", "Desenvolvimento", "Deploy", "Suporte de 30 dias"],
    notIncluded: ["Infraestrutura avançada", "Aplicativo mobile", "Integrações não mapeadas"],
    notes: "Escopo final sujeito a validação técnica após discovery.",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    title: "E-commerce",
    objective:
      "Criar uma loja virtual com experiência de compra clara, gestão de produtos e estrutura preparada para venda online.",
    scope: [
      { name: "Loja", items: ["Home", "Categoria", "Produto", "Carrinho", "Checkout"] },
      { name: "Funcionalidades", items: ["Cadastro de produtos", "Meios de pagamento", "Frete", "SEO básico"] },
    ],
    estimatedDeadline: "35 dias úteis",
    totalValue: "9000",
    entryMode: "percent",
    entryValue: "50",
    paymentMethod: DEFAULT_PAYMENT_METHOD,
    included: ["Layout responsivo", "Configuração inicial", "Publicação", "Suporte de 30 dias"],
    notIncluded: ["Cadastro completo de produtos", "Fotos", "Tráfego pago", "ERP"],
    notes: "",
  },
]

export const DEFAULT_PROPOSALS: ProposalEntry[] = []

let cachedProposalsRaw: string | null | undefined
let cachedProposalsSnapshot: ProposalEntry[] = DEFAULT_PROPOSALS

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeStatus(status: ProposalStatus | string | null | undefined): ProposalStatus {
  return PROPOSAL_STATUS_OPTIONS.includes(status as ProposalStatus)
    ? (status as ProposalStatus)
    : "draft"
}

function normalizeNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (!value) return 0
  const parsed = Number(String(value).replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item).trim()).filter(Boolean)
}

function normalizeScope(value: unknown): ProposalScopeCategory[] {
  if (!Array.isArray(value)) return []
  return value
    .map((category) => {
      const item = category as Partial<ProposalScopeCategory>
      return {
        id: item.id ?? createId("scope"),
        name: item.name?.trim() ?? "",
        items: normalizeStringList(item.items),
      }
    })
    .filter((category) => category.name || category.items.length)
}

function normalizeProposal(entry: Partial<ProposalEntry>): ProposalEntry {
  const createdAt = entry.created_at ?? new Date().toISOString()
  const proposalDate = entry.proposalDate || new Date().toISOString().split("T")[0]

  return {
    id: entry.id ?? createId("proposal"),
    title: entry.clientName?.trim() || entry.title?.trim() || "Cliente não informado",
    clientId: entry.clientId || null,
    clientName: entry.clientName?.trim() || "Cliente não informado",
    projectId: entry.projectId || null,
    proposalDate,
    validUntil: entry.validUntil || "",
    objective: entry.objective?.trim() || "",
    scope: normalizeScope(entry.scope),
    estimatedDeadline: entry.estimatedDeadline?.trim() || "",
    totalValue: normalizeNumber(entry.totalValue),
    entryMode: entry.entryMode === "value" ? "value" : "percent",
    entryValue: normalizeNumber(entry.entryValue),
    paymentMethod: entry.paymentMethod?.trim() || "",
    included: normalizeStringList(entry.included),
    notIncluded: normalizeStringList(entry.notIncluded),
    notes: entry.notes?.trim() || null,
    status: normalizeStatus(entry.status),
    created_at: createdAt,
    updated_at: entry.updated_at ?? createdAt,
  }
}

export function getProposalsSnapshot() {
  if (typeof window === "undefined") return DEFAULT_PROPOSALS

  try {
    const raw = localStorage.getItem(PROPOSALS_STORAGE_KEY)
    if (raw === cachedProposalsRaw) return cachedProposalsSnapshot

    const snapshot = raw
      ? (JSON.parse(raw) as Partial<ProposalEntry>[]).map(normalizeProposal)
      : DEFAULT_PROPOSALS
    cachedProposalsRaw = raw
    cachedProposalsSnapshot = snapshot
    return snapshot
  } catch {
    cachedProposalsRaw = null
    cachedProposalsSnapshot = DEFAULT_PROPOSALS
    return cachedProposalsSnapshot
  }
}

export function getProposalsServerSnapshot() {
  return DEFAULT_PROPOSALS
}

export function saveProposals(data: ProposalEntry[]) {
  if (typeof window === "undefined") return
  const raw = JSON.stringify(data)
  localStorage.setItem(PROPOSALS_STORAGE_KEY, raw)
  cachedProposalsRaw = raw
  cachedProposalsSnapshot = data
}

export function emitProposalsChange() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(PROPOSALS_STORAGE_EVENT))
}

export function subscribeProposalsStore(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== PROPOSALS_STORAGE_KEY) return
    onStoreChange()
  }

  const handleProposalsChange = () => onStoreChange()

  window.addEventListener("storage", handleStorage)
  window.addEventListener(PROPOSALS_STORAGE_EVENT, handleProposalsChange)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(PROPOSALS_STORAGE_EVENT, handleProposalsChange)
  }
}

export function createScopeCategory(name = "Nova categoria"): ProposalScopeCategory {
  return { id: createId("scope"), name, items: [] }
}

export function createProposalForm(entry: ProposalEntry): ProposalForm {
  return {
    title: entry.clientName === "Cliente não informado" ? "" : entry.clientName,
    clientId: entry.clientId ?? "",
    clientName: entry.clientName === "Cliente não informado" ? "" : entry.clientName,
    projectId: entry.projectId ?? "",
    proposalDate: entry.proposalDate,
    validUntil: entry.validUntil,
    objective: entry.objective,
    scope: entry.scope.map((category) => ({ ...category, items: [...category.items] })),
    estimatedDeadline: entry.estimatedDeadline,
    totalValue: entry.totalValue ? String(entry.totalValue) : "",
    entryMode: entry.entryMode,
    entryValue: entry.entryValue ? String(entry.entryValue) : "",
    paymentMethod: entry.paymentMethod,
    included: [...entry.included],
    notIncluded: [...entry.notIncluded],
    notes: entry.notes ?? "",
    status: entry.status,
  }
}

export function createProposalFromForm(form: ProposalForm): ProposalEntry {
  const now = new Date().toISOString()
  return normalizeProposal({
    title: form.clientName,
    clientId: form.clientId || null,
    clientName: form.clientName,
    projectId: form.projectId || null,
    proposalDate: form.proposalDate,
    validUntil: form.validUntil,
    objective: form.objective,
    scope: form.scope,
    estimatedDeadline: form.estimatedDeadline,
    totalValue: normalizeNumber(form.totalValue),
    entryMode: form.entryMode,
    entryValue: normalizeNumber(form.entryValue),
    paymentMethod: form.paymentMethod,
    included: form.included,
    notIncluded: form.notIncluded,
    notes: form.notes,
    status: form.status,
    created_at: now,
    updated_at: now,
  })
}

export function updateProposalInCollection(
  proposals: ProposalEntry[],
  proposalId: string,
  form: ProposalForm
) {
  return proposals.map((proposal) =>
    proposal.id === proposalId
      ? normalizeProposal({
          ...proposal,
          title: form.clientName,
          clientId: form.clientId || null,
          clientName: form.clientName,
          projectId: form.projectId || null,
          proposalDate: form.proposalDate,
          validUntil: form.validUntil,
          objective: form.objective,
          scope: form.scope,
          estimatedDeadline: form.estimatedDeadline,
          totalValue: normalizeNumber(form.totalValue),
          entryMode: form.entryMode,
          entryValue: normalizeNumber(form.entryValue),
          paymentMethod: form.paymentMethod,
          included: form.included,
          notIncluded: form.notIncluded,
          notes: form.notes,
          status: form.status,
          updated_at: new Date().toISOString(),
        })
      : proposal
  )
}

export function duplicateProposal(proposal: ProposalEntry): ProposalEntry {
  return normalizeProposal({
    ...proposal,
    id: createId("proposal"),
    title: proposal.clientName,
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
}

export function applyTemplateToForm(form: ProposalForm, template: ProposalTemplate): ProposalForm {
  return {
    ...form,
    title: form.clientName,
    objective: template.objective,
    scope: template.scope.map((category) => ({
      id: createId("scope"),
      name: category.name,
      items: [...category.items],
    })),
    estimatedDeadline: template.estimatedDeadline,
    totalValue: template.totalValue,
    entryMode: template.entryMode,
    entryValue: template.entryValue,
    paymentMethod: template.paymentMethod,
    included: [...template.included],
    notIncluded: [...template.notIncluded],
    notes: template.notes,
  }
}
