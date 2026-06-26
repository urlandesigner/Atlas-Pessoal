import { getSiteFactoryTemplate } from "./templates.js";
function normalizeString(value) {
    return typeof value === "string" ? value.trim() : "";
}
function normalizeStringList(value) {
    if (!Array.isArray(value))
        return [];
    return value
        .map((item) => normalizeString(item))
        .filter(Boolean);
}
function normalizeContact(value) {
    if (!value || typeof value !== "object")
        return undefined;
    const candidate = value;
    const contact = {
        email: normalizeString(candidate.email) || undefined,
        phone: normalizeString(candidate.phone) || undefined,
        whatsapp: normalizeString(candidate.whatsapp) || undefined,
        instagram: normalizeString(candidate.instagram) || undefined,
        website: normalizeString(candidate.website) || undefined,
        address: normalizeString(candidate.address) || undefined,
    };
    return Object.values(contact).some(Boolean) ? contact : undefined;
}
function pushRequiredError(errors, path, message) {
    errors.push({ path, message, code: "required" });
}
export function validateBriefing(input) {
    const errors = [];
    const templateId = normalizeString(input.templateId);
    if (!templateId) {
        pushRequiredError(errors, "templateId", "Selecione um template.");
    }
    const template = templateId ? getSiteFactoryTemplate(templateId) : null;
    if (templateId && !template) {
        errors.push({
            path: "templateId",
            message: `Template inválido: ${templateId}.`,
            code: "invalid_value",
        });
    }
    const projectName = normalizeString(input.projectName);
    const businessName = normalizeString(input.businessName);
    const businessSegment = normalizeString(input.businessSegment);
    const summary = normalizeString(input.summary);
    const targetAudience = normalizeString(input.targetAudience);
    const callToAction = normalizeString(input.callToAction) || "Entrar em contato";
    const goals = normalizeStringList(input.goals);
    const offerings = normalizeStringList(input.offerings);
    const differentiators = normalizeStringList(input.differentiators);
    const references = normalizeStringList(input.references);
    const seoKeywords = normalizeStringList(input.seoKeywords);
    const constraints = normalizeStringList(input.constraints);
    const toneAttributes = normalizeStringList(input.toneAttributes);
    const requiredSections = normalizeStringList(input.requiredSections);
    if (!projectName)
        pushRequiredError(errors, "projectName", "Informe o nome do projeto.");
    if (!businessName)
        pushRequiredError(errors, "businessName", "Informe o nome do negócio.");
    if (!businessSegment)
        pushRequiredError(errors, "businessSegment", "Informe o segmento do negócio.");
    if (!summary)
        pushRequiredError(errors, "summary", "Informe um resumo do projeto.");
    if (!targetAudience)
        pushRequiredError(errors, "targetAudience", "Informe o público-alvo.");
    if (goals.length === 0) {
        errors.push({
            path: "goals",
            message: "Informe pelo menos um objetivo do site.",
            code: "min_items",
        });
    }
    if (offerings.length === 0) {
        errors.push({
            path: "offerings",
            message: "Informe pelo menos uma oferta, serviço ou produto.",
            code: "min_items",
        });
    }
    if (errors.length > 0 || !template) {
        return {
            valid: false,
            errors,
            data: null,
        };
    }
    return {
        valid: true,
        errors: [],
        data: {
            projectName,
            templateId: template.id,
            businessName,
            businessSegment,
            summary,
            targetAudience,
            goals,
            offerings,
            differentiators,
            toneAttributes: toneAttributes.length > 0 ? toneAttributes : [...template.defaultTone],
            requiredSections: requiredSections.length > 0 ? requiredSections : [...template.defaultSections],
            references,
            seoKeywords,
            callToAction,
            location: normalizeString(input.location) || undefined,
            constraints,
            notes: normalizeString(input.notes) || undefined,
            contact: normalizeContact(input.contact),
        },
    };
}
