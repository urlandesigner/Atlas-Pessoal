import type {
  SiteFactoryBriefing,
  SiteFactoryGeneratedFile,
  SiteFactoryGeneratedPrompt,
  SiteFactoryTemplateId,
} from "@atlas/site-factory"

export interface SiteFactoryProjectRecord {
  id: string
  name: string
  templateId: SiteFactoryTemplateId
  businessName: string
  summary: string
  createdAt: string
  updatedAt: string
  briefing: SiteFactoryBriefing
  files: SiteFactoryGeneratedFile[]
  prompts: SiteFactoryGeneratedPrompt[]
}

export interface SiteFactoryProjectFormState {
  projectName: string
  templateId: SiteFactoryTemplateId
  businessName: string
  businessSegment: string
  summary: string
  targetAudience: string
  goals: string
  offerings: string
  differentiators: string
  toneAttributes: string
  requiredSections: string
  references: string
  seoKeywords: string
  callToAction: string
  location: string
  constraints: string
  notes: string
  contactEmail: string
  contactPhone: string
  contactWhatsapp: string
  contactInstagram: string
  contactWebsite: string
  contactAddress: string
}

export const EMPTY_SITE_FACTORY_FORM: SiteFactoryProjectFormState = {
  projectName: "",
  templateId: "institutional",
  businessName: "",
  businessSegment: "",
  summary: "",
  targetAudience: "",
  goals: "",
  offerings: "",
  differentiators: "",
  toneAttributes: "",
  requiredSections: "",
  references: "",
  seoKeywords: "",
  callToAction: "Entrar em contato",
  location: "",
  constraints: "",
  notes: "",
  contactEmail: "",
  contactPhone: "",
  contactWhatsapp: "",
  contactInstagram: "",
  contactWebsite: "",
  contactAddress: "",
}
