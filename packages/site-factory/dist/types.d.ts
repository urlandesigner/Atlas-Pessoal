export type SiteFactoryTemplateId = "institutional" | "institutional-b2b" | "landing-page" | "professional-profile" | "clinic" | "saas" | "local-business";
export type SiteFactoryGeneratedFileName = "claude.md" | "project-context.md" | "site-structure.md" | "creative-direction.md" | "design-system.md" | "copywriting.md" | "tasks.md";
export interface SiteFactoryTemplate {
    id: SiteFactoryTemplateId;
    label: string;
    summary: string;
    recommendedPages: string[];
    defaultSections: string[];
    defaultTone: string[];
    defaultDeliverables: string[];
    notes?: string[];
}
export interface SiteFactoryBriefingContact {
    email?: string;
    phone?: string;
    whatsapp?: string;
    instagram?: string;
    website?: string;
    address?: string;
}
export interface SiteFactoryBriefing {
    projectName: string;
    templateId: SiteFactoryTemplateId;
    businessName: string;
    businessSegment: string;
    summary: string;
    targetAudience: string;
    goals: string[];
    offerings: string[];
    differentiators: string[];
    toneAttributes: string[];
    requiredSections: string[];
    references: string[];
    seoKeywords: string[];
    callToAction: string;
    location?: string;
    constraints: string[];
    notes?: string;
    contact?: SiteFactoryBriefingContact;
}
export interface SiteFactoryGeneratedFile {
    name: SiteFactoryGeneratedFileName;
    content: string;
    mimeType: "text/markdown";
}
export interface SiteFactoryGeneratedPrompt {
    id: "master-build" | "copywriting" | "design-direction" | "task-planning";
    title: string;
    content: string;
}
export interface SiteFactoryValidationIssue {
    path: string;
    message: string;
    code: "required" | "invalid_value" | "min_items";
}
export interface SiteFactoryValidationResult {
    valid: boolean;
    errors: SiteFactoryValidationIssue[];
    data: SiteFactoryBriefing | null;
}
export interface SiteFactoryProjectResult {
    ok: boolean;
    template: SiteFactoryTemplate | null;
    briefing: SiteFactoryBriefing | null;
    files: SiteFactoryGeneratedFile[];
    prompts: SiteFactoryGeneratedPrompt[];
    errors: SiteFactoryValidationIssue[];
}
//# sourceMappingURL=types.d.ts.map