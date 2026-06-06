export type ImpactScope = "personal" | "team" | "area" | "company"
export type ImpactLevel = 1 | 2 | 3 | 4 | 5

// Tipo de Atuação — o QUE você fez
export type AtuacaoType =
  | "liderança"
  | "execução"
  | "estratégia"
  | "arquitetura"
  | "mentoria"
  | "inovação"

// Área — ONDE aconteceu
export type AreaType =
  | "produto"
  | "ux"
  | "design-system"
  | "engenharia"
  | "processo"
  | "cultura"
  | "operacional"
  | "outros"

export interface EnrichedFields {
  title: string
  context: string
  objective: string
  contribution: string
  decisions: string
  impact: string
  learnings: string
}

export interface RecordEntry {
  id: string
  raw: string
  enriched: EnrichedFields
  atuacao: AtuacaoType
  area: AreaType
  impactScope: ImpactScope
  impactLevel: ImpactLevel
  tags: string[]
  projectId?: string
  projectName?: string
  createdAt: string
  updatedAt: string
}
