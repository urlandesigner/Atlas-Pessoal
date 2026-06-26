import { getSiteFactoryTemplate } from "./templates.js";
import { validateBriefing } from "./validate.js";
function bulletList(items, fallback = "- A definir") {
    if (items.length === 0)
        return fallback;
    return items.map((item) => `- ${item}`).join("\n");
}
function section(title, body) {
    return `## ${title}\n${body.trim()}\n`;
}
function contactLines(briefing) {
    const contact = briefing.contact;
    const lines = [
        contact?.email ? `- Email: ${contact.email}` : null,
        contact?.phone ? `- Telefone: ${contact.phone}` : null,
        contact?.whatsapp ? `- WhatsApp: ${contact.whatsapp}` : null,
        contact?.instagram ? `- Instagram: ${contact.instagram}` : null,
        contact?.website ? `- Website atual: ${contact.website}` : null,
        contact?.address ? `- Endereço: ${contact.address}` : null,
    ].filter(Boolean);
    return lines.length > 0 ? lines.join("\n") : "- A definir";
}
function generateClaudeFile(briefing) {
    const template = getSiteFactoryTemplate(briefing.templateId);
    return `# CLAUDE.md

Este projeto representa o site **${briefing.projectName}** para **${briefing.businessName}**.

## Objetivo
- Criar um site do tipo **${template.label}**
- Atender o público: ${briefing.targetAudience}
- Entregar uma experiência coerente com o posicionamento da marca

## Diretrizes
- Use os arquivos deste pacote como fonte de verdade do projeto.
- Priorize clareza, consistência visual e conversão.
- Não invente páginas ou mensagens sem antes conferir o briefing.
- Mantenha o CTA principal como: **${briefing.callToAction}**

## Arquivos obrigatórios de consulta
- project-context.md
- site-structure.md
- creative-direction.md
- design-system.md
- copywriting.md
- tasks.md
`;
}
function generateProjectContextFile(briefing) {
    return `# Project Context

${section("Projeto", `- Nome do projeto: ${briefing.projectName}
- Negócio: ${briefing.businessName}
- Segmento: ${briefing.businessSegment}
- Template: ${briefing.templateId}`)}
${section("Resumo", briefing.summary)}
${section("Público-alvo", briefing.targetAudience)}
${section("Objetivos", bulletList(briefing.goals))}
${section("Ofertas", bulletList(briefing.offerings))}
${section("Diferenciais", bulletList(briefing.differentiators))}
${section("Localização", briefing.location || "A definir")}
${section("Contato", contactLines(briefing))}
${section("Restrições", bulletList(briefing.constraints))}
${section("Observações", briefing.notes || "Sem observações adicionais.")}
`;
}
function generateSiteStructureFile(briefing) {
    const template = getSiteFactoryTemplate(briefing.templateId);
    return `# Site Structure

${section("Páginas recomendadas", bulletList(template.recommendedPages))}
${section("Seções obrigatórias", bulletList(briefing.requiredSections))}
${section("Fluxo principal", `1. Apresentar valor logo acima da dobra.
2. Explicar oferta ou especialidade com clareza.
3. Mostrar provas, diferenciais ou sinais de confiança.
4. Conduzir para o CTA principal: ${briefing.callToAction}.`)}
${section("Entregáveis esperados", bulletList(template.defaultDeliverables))}
`;
}
function generateCreativeDirectionFile(briefing) {
    const template = getSiteFactoryTemplate(briefing.templateId);
    return `# Creative Direction

${section("Intenção criativa", `O site deve traduzir o posicionamento de ${briefing.businessName} no segmento de ${briefing.businessSegment}, usando uma linguagem visual compatível com o template ${template.label}.`)}
${section("Tom e percepção", bulletList(briefing.toneAttributes))}
${section("Referências", bulletList(briefing.references))}
${section("Sensação esperada", `A experiência deve passar credibilidade, foco e coerência com os objetivos do projeto.`)}
`;
}
function generateDesignSystemFile(briefing) {
    return `# Design System

${section("Princípios", `- Clareza visual acima de excesso decorativo
- Hierarquia forte entre hero, conteúdo e CTA
- Componentes consistentes e reutilizáveis`)}
${section("Direção tipográfica", `Definir uma fonte de destaque para títulos e uma fonte funcional para leitura contínua, respeitando o perfil de ${briefing.businessName}.`)}
${section("Direção de componentes", `- Botão primário orientado a ${briefing.callToAction}
- Cards para serviços/ofertas
- Blocos de prova social ou autoridade
- Rodapé com informações de contato e contexto institucional`)}
${section("Acessibilidade", `- Contraste adequado
- Estados de foco visíveis
- Estrutura semântica para headings e navegação
- Botões e links com rótulos claros`)}
`;
}
function generateCopywritingFile(briefing) {
    return `# Copywriting

${section("Mensagem central", `${briefing.businessName} ajuda ${briefing.targetAudience} através de ${briefing.offerings[0]}.`)}
${section("Objetivos de comunicação", bulletList(briefing.goals))}
${section("Pontos de valor", bulletList(briefing.differentiators))}
${section("Palavras-chave", bulletList(briefing.seoKeywords))}
${section("CTA principal", briefing.callToAction)}
`;
}
function generateTasksFile(briefing) {
    const template = getSiteFactoryTemplate(briefing.templateId);
    return `# Tasks

${section("Planejamento", `- Revisar briefing de ${briefing.projectName}
- Confirmar escopo do template ${template.label}
- Validar páginas e seções obrigatórias`)}
${section("Conteúdo", `- Estruturar copy por seção
- Ajustar mensagens para ${briefing.targetAudience}
- Refinar CTA principal`)}
${section("Design", `- Definir direção visual
- Organizar componentes e hierarquia
- Ajustar responsividade`)}
${section("Implementação", `- Montar páginas
- Aplicar design system
- Revisar performance, SEO básico e acessibilidade`)}
`;
}
export function generateProjectFiles(briefing) {
    return [
        { name: "claude.md", content: generateClaudeFile(briefing), mimeType: "text/markdown" },
        {
            name: "project-context.md",
            content: generateProjectContextFile(briefing),
            mimeType: "text/markdown",
        },
        {
            name: "site-structure.md",
            content: generateSiteStructureFile(briefing),
            mimeType: "text/markdown",
        },
        {
            name: "creative-direction.md",
            content: generateCreativeDirectionFile(briefing),
            mimeType: "text/markdown",
        },
        {
            name: "design-system.md",
            content: generateDesignSystemFile(briefing),
            mimeType: "text/markdown",
        },
        {
            name: "copywriting.md",
            content: generateCopywritingFile(briefing),
            mimeType: "text/markdown",
        },
        {
            name: "tasks.md",
            content: generateTasksFile(briefing),
            mimeType: "text/markdown",
        },
    ];
}
export function generateProjectPrompts(briefing) {
    const template = getSiteFactoryTemplate(briefing.templateId);
    return [
        {
            id: "master-build",
            title: "Master build prompt",
            content: `Crie o site ${briefing.projectName} para ${briefing.businessName} usando o template ${template.label}. Considere o público ${briefing.targetAudience}, os objetivos ${briefing.goals.join(", ")} e mantenha o CTA "${briefing.callToAction}". Consulte os arquivos de briefing e gere uma solução completa.`,
        },
        {
            id: "copywriting",
            title: "Copywriting prompt",
            content: `Escreva a copy do site ${briefing.projectName}. Considere resumo do negócio: ${briefing.summary}. Foque no público ${briefing.targetAudience}, nas ofertas ${briefing.offerings.join(", ")} e nos diferenciais ${briefing.differentiators.join(", ")}.`,
        },
        {
            id: "design-direction",
            title: "Creative direction prompt",
            content: `Defina a direção criativa e visual do site ${briefing.projectName} com base nos atributos ${briefing.toneAttributes.join(", ")} e nas referências ${briefing.references.join(", ")}.`,
        },
        {
            id: "task-planning",
            title: "Task planning prompt",
            content: `Quebre a implementação do site ${briefing.projectName} em tarefas práticas de conteúdo, design e desenvolvimento. Use as seções ${briefing.requiredSections.join(", ")} e os objetivos ${briefing.goals.join(", ")}.`,
        },
    ];
}
export function generateSiteProject(input) {
    const validation = validateBriefing(input);
    if (!validation.valid || !validation.data) {
        return {
            ok: false,
            template: null,
            briefing: null,
            files: [],
            prompts: [],
            errors: validation.errors,
        };
    }
    const template = getSiteFactoryTemplate(validation.data.templateId);
    const files = generateProjectFiles(validation.data);
    const prompts = generateProjectPrompts(validation.data);
    return {
        ok: true,
        template,
        briefing: validation.data,
        files,
        prompts,
        errors: [],
    };
}
