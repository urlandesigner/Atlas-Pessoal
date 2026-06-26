import type { SiteFactoryTemplate, SiteFactoryTemplateId } from "./types.js"

export const SITE_FACTORY_TEMPLATES: SiteFactoryTemplate[] = [
  {
    id: "institutional",
    label: "Institucional",
    summary: "Site institucional para apresentar marca, serviços e fortalecer presença digital.",
    recommendedPages: ["Home", "Sobre", "Serviços", "Contato"],
    defaultSections: ["Hero", "Sobre a empresa", "Serviços", "Diferenciais", "Contato"],
    defaultTone: ["confiável", "claro", "profissional"],
    defaultDeliverables: ["Estrutura institucional", "Mensagens principais", "CTA de contato"],
  },
  {
    id: "institutional-b2b",
    label: "Institucional B2B",
    summary: "Site institucional voltado para negócios com foco em autoridade, processo e geração de leads.",
    recommendedPages: ["Home", "Soluções", "Cases", "Sobre", "Contato"],
    defaultSections: ["Hero", "Problema x solução", "Serviços", "Cases", "FAQ", "Contato"],
    defaultTone: ["estratégico", "objetivo", "consultivo"],
    defaultDeliverables: ["Posicionamento B2B", "Narrativa de valor", "Fluxo de captação"],
  },
  {
    id: "landing-page",
    label: "Landing Page",
    summary: "Página única orientada à conversão para campanha, oferta ou captação.",
    recommendedPages: ["Landing page"],
    defaultSections: ["Hero", "Oferta", "Benefícios", "Prova social", "FAQ", "CTA final"],
    defaultTone: ["persuasivo", "direto", "energético"],
    defaultDeliverables: ["Estrutura de conversão", "CTA principal", "Mensagens de campanha"],
  },
  {
    id: "professional-profile",
    label: "Perfil Profissional",
    summary: "Site pessoal para profissionais liberais, consultores ou especialistas.",
    recommendedPages: ["Home", "Sobre", "Serviços", "Conteúdo", "Contato"],
    defaultSections: ["Hero", "Apresentação", "Especialidades", "Provas", "Contato"],
    defaultTone: ["humano", "seguro", "especialista"],
    defaultDeliverables: ["Marca pessoal", "Autoridade", "Captação de contato"],
  },
  {
    id: "clinic",
    label: "Clínica",
    summary: "Site para clínicas, consultórios e profissionais da saúde com clareza, confiança e acolhimento.",
    recommendedPages: ["Home", "Especialidades", "Equipe", "Convênios", "Contato"],
    defaultSections: ["Hero", "Especialidades", "Equipe", "Estrutura", "FAQ", "Agendamento"],
    defaultTone: ["acolhedor", "seguro", "profissional"],
    defaultDeliverables: ["Informações de atendimento", "Confiança", "Fluxo de agendamento"],
  },
  {
    id: "saas",
    label: "SaaS",
    summary: "Site para software com foco em produto, clareza funcional e aquisição.",
    recommendedPages: ["Home", "Produto", "Preços", "Integrações", "Contato"],
    defaultSections: ["Hero", "Problema", "Como funciona", "Recursos", "Planos", "CTA"],
    defaultTone: ["didático", "moderno", "orientado a produto"],
    defaultDeliverables: ["Narrativa do produto", "Estrutura comercial", "Prompt de UI orientado a SaaS"],
  },
  {
    id: "local-business",
    label: "Negócio Local",
    summary: "Site para negócios locais com foco em descoberta, confiança e contato rápido.",
    recommendedPages: ["Home", "Serviços", "Depoimentos", "Localização", "Contato"],
    defaultSections: ["Hero", "Serviços", "Depoimentos", "Localização", "Contato imediato"],
    defaultTone: ["próximo", "simples", "confiável"],
    defaultDeliverables: ["Presença local", "Informações rápidas", "Conversão por WhatsApp ou ligação"],
  },
]

export const SITE_FACTORY_TEMPLATE_MAP: Record<SiteFactoryTemplateId, SiteFactoryTemplate> =
  Object.fromEntries(
    SITE_FACTORY_TEMPLATES.map((template) => [template.id, template])
  ) as Record<SiteFactoryTemplateId, SiteFactoryTemplate>

export function getSiteFactoryTemplate(templateId: SiteFactoryTemplateId) {
  return SITE_FACTORY_TEMPLATE_MAP[templateId]
}
