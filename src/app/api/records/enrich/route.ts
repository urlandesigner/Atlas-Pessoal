import { getOpenAIClient } from "@/lib/openai/client"
import type { EnrichedFields } from "@/lib/records/types"

// ─── Smart mock (used when OPENAI_API_KEY is absent) ─────────────────────────

function mockEnrich(raw: string): EnrichedFields {
  const lower = raw.toLowerCase()

  if (/design.?system|sistema de design|kaizen|token|component/.test(lower)) {
    return {
      title: "Estruturação e documentação do Design System",
      context:
        "A equipe não possuía uma fonte centralizada de verdade para os padrões e componentes do Design System — o conhecimento estava fragmentado entre arquivos dispersos, dependendo de comunicação informal e do conhecimento tácito de poucos membros.",
      objective:
        "Criar ou aprimorar a documentação e estrutura do Design System, centralizando referências de componentes, tokens e guidelines para alinhar design e engenharia em torno de padrões consistentes.",
      contribution: raw,
      decisions:
        "Priorizou-se a arquitetura de informação e navegação antes da execução técnica, garantindo que os padrões fossem descobríveis e compreensíveis por novos membros. A estrutura foi validada com o time de engenharia antes da publicação.",
      impact:
        "Centralizou o conhecimento do Design System em uma referência única e navegável, reduziu inconsistências visuais entre produtos e acelerou o onboarding de novos membros de design e engenharia. Estabeleceu uma base sólida para escalar o sistema com menor custo de coordenação.",
      learnings:
        "Documentação de Design System é produto e processo: sua adoção depende tanto da qualidade do conteúdo quanto da facilidade de descoberta. A governança do sistema precisa ser acordada desde o início para evitar desatualização.",
    }
  }

  if (/arquitetura|microsservi|plataforma|backend|api|módulo/.test(lower)) {
    return {
      title: "Definição de arquitetura técnica estratégica",
      context:
        "O crescimento do produto criou dependências críticas na arquitetura existente, gerando gargalos de escalabilidade e dificultando entregas independentes entre os times.",
      objective:
        "Definir uma arquitetura técnica que viabilizasse escala independente dos módulos, reduzisse acoplamento e permitisse que os times entregassem com mais autonomia e velocidade.",
      contribution: raw,
      decisions:
        "Analisamos trade-offs entre migração incremental e big-bang, optando por uma abordagem de strangler fig para minimizar risco. Priorizamos as fronteiras de domínio com maior volume de mudança como ponto de partida.",
      impact:
        "Reduziu dependências críticas entre equipes, viabilizou deploys independentes por domínio e estabeleceu um padrão replicável para evolução da plataforma. O time ganhou autonomia para entregar sem coordenação excessiva.",
      learnings:
        "Decisões arquiteturais são decisões organizacionais: o sucesso da migração dependeu tanto do alinhamento entre times quanto da qualidade técnica da solução.",
    }
  }

  if (/lider|conduzi|alinhei|stakeholder|apresent/.test(lower)) {
    return {
      title: "Liderança e alinhamento de iniciativa estratégica",
      context:
        "A iniciativa envolvia múltiplos stakeholders com perspectivas divergentes, sem um processo claro de tomada de decisão que permitisse avançar com velocidade e confiança.",
      objective:
        "Facilitar o alinhamento entre as partes interessadas, criar clareza sobre prioridades e garantir que a iniciativa avançasse com o suporte necessário para execução bem-sucedida.",
      contribution: raw,
      decisions:
        "Adotou-se uma abordagem estruturada de facilitação — definindo critérios de decisão antes das reuniões, documentando trade-offs explicitamente e garantindo que todos os envolvidos compreendessem as implicações das opções.",
      impact:
        "Desbloqueou a iniciativa que estava parada por falta de alinhamento, criou precedente de processo de decisão replicável e aumentou a confiança das partes envolvidas na execução.",
      learnings:
        "Liderança em contextos de alta ambiguidade requer tanto habilidade de facilitação quanto capacidade de síntese — transformar diversidade de perspectivas em decisão clara é uma competência crítica.",
    }
  }

  // Generic but professional fallback
  return {
    title: "Contribuição profissional documentada",
    context:
      "Contexto que motivou a iniciativa: identificou-se uma oportunidade ou necessidade de melhoria que justificava atuação direta para gerar impacto mensurável.",
    objective:
      "Realizar contribuição de alto valor com foco em resultado organizacional, qualidade técnica e entrega dentro do prazo acordado com os stakeholders envolvidos.",
    contribution: raw,
    decisions:
      "Decisões tomadas priorizando escalabilidade da solução, alinhamento com as necessidades dos stakeholders e redução de riscos operacionais durante a implementação.",
    impact:
      "Contribuição que gerou valor claro para o time e para o produto, com resultado reconhecido pelos envolvidos e base para iniciativas futuras no mesmo domínio.",
    learnings:
      "Aprendizados técnicos e comportamentais que fortalecem a capacidade de atuação em contextos similares e contribuem para a evolução profissional contínua.",
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const { raw } = await request.json()

  if (!process.env.OPENAI_API_KEY) {
    await new Promise((r) => setTimeout(r, 3200))
    return Response.json({ enriched: mockEnrich(raw) })
  }

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Você é um consultor sênior de desenvolvimento de carreira especializado em documentar contribuições de profissionais de tecnologia, produto e design com linguagem executiva e estratégica.

Seu papel: transformar uma descrição casual em registro profissional de alto nível — o tipo de documentação que aparece em performance reviews, casos de promoção e apresentações de carreira.

━━━ REGRAS OBRIGATÓRIAS ━━━

TÍTULO (campo "title"):
• Deve referenciar o projeto ou contexto real mencionado — nunca gere "Registro de impacto profissional" ou similar
• Formato: [Verbo substantivado ou de ação] + [do/da/de] + [Projeto/Área] + [contexto se necessário]
• Máximo 80 caracteres
• Exemplos corretos:
  ✅ "Estruturação do site de documentação do Design System Kaizen"
  ✅ "Definição da arquitetura de microsserviços do módulo financeiro"
  ✅ "Reestruturação do fluxo de onboarding do app mobile"
  ❌ "Registro de impacto profissional"
  ❌ "Contribuição relevante para o time"

CONTEXTO (campo "context"):
• Descreva o cenário organizacional antes da sua ação — qual era o problema, gap ou oportunidade
• Use vocabulário de negócio: "fragmentação", "dependência crítica", "gargalo de escalabilidade", "falta de visibilidade"
• 2-3 frases

OBJETIVO (campo "objective"):
• Descreva o que você quis alcançar — resultado esperado, não a atividade
• Seja específico: mencione o que mudaria após a iniciativa
• 1-2 frases

CONTRIBUIÇÃO (campo "contribution"):
• Descreva O QUE VOCÊ FEZ especificamente — não o que "o time" fez em geral
• Mencione decisões tomadas, abordagens escolhidas, trade-offs enfrentados
• 2-4 frases

DECISÕES (campo "decisions"):
• Liste 2-3 decisões concretas e o raciocínio por trás delas
• Mostre o pensamento estratégico por trás das escolhas

IMPACTO (campo "impact"):
• NUNCA escreva frases genéricas como "resultado positivo para o time" ou "contribuição relevante"
• Estrutura: QUEM foi afetado + O QUÊ mudou concretamente + COMO se manifestou
• Se houver números ou percentuais no input, use-os
• Se não houver, descreva o impacto qualitativo com precisão executiva
• Palavras que funcionam: "centralizou", "reduziu fricção", "viabilizou escala", "estabeleceu precedente", "acelerou", "eliminou dependência"

APRENDIZADOS (campo "learnings"):
• Insights estratégicos ou técnicos relevantes para a carreira
• Conecte com o domínio profissional — não sejam genéricos
• 1-2 frases densas e específicas

INFERÊNCIA DE DOMÍNIO — aplique automaticamente:
• Design System → centralizaçâo, tokens, alinhamento design/dev, adoção, documentação, consistência
• Produto/Feature → discovery, métricas, ciclo de entrega, experiência do usuário
• Arquitetura → escalabilidade, acoplamento, autonomia de times, trade-offs técnicos
• Processo → eficiência operacional, redução de retrabalho, clareza de responsabilidades
• Liderança/Alinhamento → facilitação, influência sem autoridade, decisão em ambiguidade

Responda APENAS com JSON válido contendo os campos: title, context, objective, contribution, decisions, impact, learnings`,
        },
        {
          role: "user",
          content: raw,
        },
      ],
    })

    const text = completion.choices[0]?.message?.content ?? "{}"
    const enriched = JSON.parse(text) as EnrichedFields
    return Response.json({ enriched })
  } catch {
    await new Promise((r) => setTimeout(r, 1000))
    return Response.json({ enriched: mockEnrich(raw) })
  }
}
