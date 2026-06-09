# 📊 Arquitetura de Pipeline Comercial - Atlas CRM

## 1. ANÁLISE DA ARQUITETURA ATUAL

### ❌ Problemas Identificados

```
LeadEntry (atual)
├─ name, email, phone, whatsapp ─── Dados de Contato
├─ company, segment, city, state ─── Dados da Empresa
├─ instagram, current_site ───────── Canais de Comunicação
├─ project_type, deadline ───────── Qualificação (INCOMPLETA)
├─ investment_range, objective ──── Qualificação (INCOMPLETA)
├─ estimated_value, status ──────── Oportunidade (RASA)
└─ activities, comments, timeline ─ Histórico

PROBLEMAS:
1. Campos de diferentes estágios misturados no mesmo objeto
2. Sem separação clara de responsabilidades
3. Difícil rastrear quando cada informação foi coletada
4. Sem campo de "estágio" explícito (apenas status)
5. Sem histórico de mudanças por estágio
6. Campos opcionais sem contexto de quando preencher
7. Não escalável para novos estágios (Reunião, Projeto)
```

### 📐 Estrutura Proposta

```
Lead (Entidade Principal)
├─ Identidade
│  ├─ id, created_at, updated_at
│  ├─ status_stage (lead → cliente) ← NOVO
│  └─ completion_percentage ← NOVO
│
├─ Prospect (Dados básicos imutáveis)
│  ├─ company (obrigatório)
│  ├─ segment
│  ├─ city, state
│  ├─ origin (onde encontrou)
│  └─ first_contact_date
│
├─ Qualification (Dados coletados progressivamente)
│  ├─ contact_name
│  ├─ email
│  ├─ phone
│  ├─ job_title
│  ├─ project_objective
│  ├─ project_type
│  ├─ desired_deadline
│  ├─ investment_range
│  └─ qualified_at (timestamp)
│
├─ Opportunity (Análise comercial)
│  ├─ estimated_value
│  ├─ quote_value (valor enviado)
│  ├─ closed_value (valor fechado)
│  ├─ closing_probability (%)
│  ├─ notes
│  └─ opportunity_updated_at
│
├─ Communication (Canais de contato)
│  ├─ email ─────────────────────── (opcional)
│  ├─ phone ─────────────────────── (opcional)
│  ├─ whatsapp ──────────────────── (prioritário)
│  ├─ instagram ─────────────────── (para pesquisa)
│  ├─ current_site ─────────────── (para análise)
│  └─ preferred_channel ────────── NOVO
│
├─ Journey (Rastreamento de estágios)
│  ├─ stages[] ──────────────────── NOVO
│  │  ├─ stage: "lead" | "qualified" | "meeting" | "proposal" | "project" | "client"
│  │  ├─ entered_at (timestamp)
│  │  ├─ exited_at (timestamp ou null se ativo)
│  │  └─ metadata (campos preenchidos nesse estágio)
│  └─ stage_completion[] ───────── NOVO
│     └─ [stage]: { fields_filled, total_fields, pct }
│
└─ Timeline (Auditoria completa)
   ├─ activities[] (o que foi feito)
   ├─ comments[] (notas internas)
   ├─ stage_changes[] (quando mudou de estágio)
   └─ field_changes[] ────────────── NOVO (qual campo mudou)
```

---

## 2. NOVO MODELO DE DADOS

### Stage Definitions (Configurável)

```typescript
const PIPELINE_STAGES = {
  lead: {
    label: "Lead",
    description: "Prospect identificado",
    order: 0,
    required_fields: ["company"],
    optional_fields: ["segment", "city", "origin"],
    exit_condition: "contact_name" // quando migrar para próximo
  },
  
  qualified: {
    label: "Qualificado",
    description: "Informações coletadas",
    order: 1,
    required_fields: [], // nenhum campo obrigatório
    optional_fields: ["contact_name", "email", "phone", "job_title", "project_objective", "project_type"],
    exit_condition: "meeting_scheduled"
  },
  
  meeting: {
    label: "Reunião",
    description: "Reunião agendada/realizada",
    order: 2,
    required_fields: [],
    optional_fields: ["meeting_date", "meeting_notes", "meeting_attendees"],
    exit_condition: "proposal_sent"
  },
  
  proposal: {
    label: "Proposta",
    description: "Proposta comercial enviada",
    order: 3,
    required_fields: [],
    optional_fields: ["estimated_value", "quote_value", "proposal_date"],
    exit_condition: "proposal_accepted"
  },
  
  project: {
    label: "Projeto",
    description: "Projeto em andamento",
    order: 4,
    required_fields: [],
    optional_fields: ["project_start", "project_deadline", "project_manager"],
    exit_condition: "project_completed"
  },
  
  client: {
    label: "Cliente",
    description: "Cliente confirmado",
    order: 5,
    required_fields: [],
    optional_fields: ["client_since", "closed_value"],
    exit_condition: null // final state
  }
}
```

### Estrutura de Type TypeScript

```typescript
// Stage Journey
interface StageEntry {
  stage: PipelineStage
  entered_at: string (ISO 8601)
  exited_at: string | null
  duration_days?: number
  metadata: Record<string, unknown> // campos preenchidos nesse estágio
}

interface StageCompletion {
  stage: PipelineStage
  fields_filled: string[]
  total_fields: number
  completion_percentage: number
}

// Qualification Data (pode estar parcialmente preenchida)
interface QualificationData {
  contact_name?: string
  email?: string
  phone?: string
  job_title?: string
  project_objective?: string
  project_type?: ProjectType | ""
  desired_deadline?: string
  investment_range?: string
  qualified_at?: string
}

// Opportunity Data
interface OpportunityData {
  estimated_value?: number
  quote_value?: number
  closed_value?: number
  closing_probability?: number // 0-100
  notes?: string
  updated_at?: string
}

// Communication Preferences
interface CommunicationData {
  email?: string
  phone?: string
  whatsapp?: string
  instagram?: string
  current_site?: string
  preferred_channel?: "email" | "phone" | "whatsapp" | "instagram"
}

// Lead Entry (Refatorizado)
interface LeadEntry {
  // Identity
  id: string
  status_stage: PipelineStage
  completion_percentage: number
  created_at: string
  updated_at: string

  // Prospect (Imutável após criação)
  prospect: {
    company: string // obrigatório
    segment?: string
    city?: string
    state?: string
    origin?: LeadOrigin
    first_contact_date: string
  }

  // Dados coletáveis
  qualification: QualificationData
  opportunity: OpportunityData
  communication: CommunicationData

  // Journey e Timeline
  stages: StageEntry[]
  stage_completion: Record<PipelineStage, StageCompletion>
  
  // Histórico
  activities: LeadActivity[]
  comments: LeadComment[]
  timeline: LeadTimelineEvent[]

  // Relationships
  proposal_ids: string[]
  project_ids: string[]
}
```

---

## 3. FLUXO DE DADOS

### Criação de Lead (Rápida)

```
User clica "+ Novo Lead"
    ↓
Preenche forma mínima:
  - Empresa (obrigatório)
  - Segmento (opcional)
  - Cidade (opcional)
  - Origem (opcional)
    ↓
Sistema cria Lead:
  - status_stage = "lead"
  - stages[0] = { stage: "lead", entered_at: now }
  - completion_percentage = 0%
  - Redireciona para página de detalhe
```

### Progressão de Estágio

```
User abre página do Lead
    ↓
Vê visual do pipeline:
  [●] Lead → [○] Qualificado → [○] Reunião → [○] Proposta → [○] Projeto → [○] Cliente
    ↓
User preenche campos de Qualificação (contact_name, email, etc)
    ↓
Sistema detecta preenchimento:
  - Atualiza qualification object
  - Recalcula completion_percentage
  - Mostra notificação "Pronto para avançar?"
    ↓
User clica "Avançar para Qualificado" (botão inteligente)
    ↓
Sistema:
  - stages.push({ stage: "qualified", entered_at: now })
  - status_stage = "qualified"
  - completion_percentage recalculado
  - timeline.push({ type: "stage_changed", ... })
```

---

## 4. COMPONENTES NECESSÁRIOS

### UI Components (Novos)

```
PipelineProgressBar
  ├─ Exibe estágios visualmente
  ├─ Mostra % de preenchimento por estágio
  ├─ Permite clicar para navegar (se permitido)
  └─ Animação ao transicionar

StageCompletionCard
  ├─ Lista campos do estágio atual
  ├─ Checkmark verde para preenchidos
  ├─ Dica vermelha para críticos
  └─ % de conclusão

StageMilestoneTimeline
  ├─ Timeline visual de entrada/saída dos estágios
  ├─ Duração em cada estágio
  ├─ Ação tomada para sair
  └─ Usuário que fez a transição

AutoAdvancePrompt
  ├─ "Todos os campos vistos. Avançar para próximo estágio?"
  ├─ Não obriga, apenas sugere
  └─ Opção de pular

QuickFieldForm
  ├─ Formulário fluido por estágio
  ├─ Carrega apenas campos relevantes
  ├─ Salva automaticamente
  └─ Mostra % completado em tempo real
```

### Store Functions (Novos)

```typescript
// Qualificação progressiva
addQualificationField(leadId, fieldName, value)
getQualificationCompletion(leadId): StageCompletion

// Opportunity tracking
setOpportunityValue(leadId, estimatedValue, quoteValue, closedValue)
updateClosingProbability(leadId, percentage)

// Stage management
canAdvanceStage(leadId): boolean
getNextStage(leadId): PipelineStage | null
advanceLeadStage(leadId, toStage?: PipelineStage)
regressLeadStage(leadId)

// Completion calculation
calculateCompletion(leadId): number
getStageCompletion(leadId, stage): StageCompletion

// Timeline & history
recordStageEntry(leadId, stage, metadata)
recordStageExit(leadId, stage, reason, nextStage)
getStageHistory(leadId): StageEntry[]
```

---

## 5. IMPLEMENTAÇÃO SUGERIDA

### Fase 1: Core Architecture (Semana 1)
- [ ] Refatorar tipos em `store.ts`
- [ ] Criar funções de stage management
- [ ] Atualizar persistência (localStorage)
- [ ] Testar com dados mock

### Fase 2: UI - Captura Rápida (Semana 1-2)
- [ ] Simplificar `LeadSheet` para 4 campos
- [ ] Criar `QuickLeadForm`
- [ ] Adicionar confirmação de criação

### Fase 3: UI - Pipeline Visual (Semana 2)
- [ ] `PipelineProgressBar` component
- [ ] `StageCompletionCard` component
- [ ] Integrar em `[id]/page.tsx`

### Fase 4: UI - Qualificação Progressiva (Semana 2-3)
- [ ] `QualificationTab` com campos fluidos
- [ ] `OpportunityTab` para valores
- [ ] Auto-save com validação
- [ ] `AutoAdvancePrompt` inteligente

### Fase 5: Timeline & Auditoria (Semana 3)
- [ ] `StageMilestoneTimeline` component
- [ ] Registrar todas as transições
- [ ] Mostrar duração por estágio

### Fase 6: Automação (Semana 4+)
- [ ] Regras automáticas de transição
- [ ] Webhooks para externos
- [ ] Integração com calendar (reunião)
- [ ] Notificações (quando avançar)

---

## 6. BENEFÍCIOS DA NOVA ARQUITETURA

### ✅ Para o Usuário
- Flexibilidade total no preenchimento
- Visualização clara do progresso
- Sem frustração com campos obrigatórios
- Sugere próximos passos naturalmente

### ✅ Para o Sistema
- Dados estruturados por estágio
- Fácil rastrear quando informação foi coletada
- Escalável para novos estágios
- Pronto para automação

### ✅ Para Análise
- Métricas claras por estágio
- Tempo médio em cada fase
- Taxa de conversão por etapa
- Gargalos identificáveis

---

## 7. EXEMPLO DE FLUXO DE USUÁRIO

```
1. LEAD (< 15s)
   ┌─────────────────┐
   │ Novo Lead       │
   │ - Empresa       │ (obrigatório)
   │ - Segmento      │ (opcional)
   │ - Cidade        │ (opcional)
   │ - Origem        │ (opcional)
   └─────────────────┘
        ↓
   ✅ Lead criado. Completion: 25%

2. QUALIFICADO (quando quiser)
   ┌─────────────────────────┐
   │ Qualificação            │
   │ [○] Contact Name        │
   │ [○] Email               │ ← Sugestão ativa
   │ [○] Phone               │
   │ [○] Job Title           │
   │ [○] Project Objective   │
   │ [○] Project Type        │
   │ [○] Deadline            │
   │ [○] Investment Range    │
   └─────────────────────────┘
        ↓
   User preenche 4 campos → Completion: 50%
   Sistema mostra: "Pronto para avançar!"
        ↓
   User clica "Avançar" → status_stage = "qualified"

3. REUNIÃO
   ┌───────────────────┐
   │ Reunião           │
   │ [○] Data          │
   │ [○] Notas         │
   │ [○] Participantes │
   └───────────────────┘
        ↓
   User agenda → Avança automático

4. PROPOSTA
   ┌──────────────────────┐
   │ Oportunidade         │
   │ [○] Valor Estimado   │
   │ [○] Valor Enviado    │
   │ [○] Probabilidade    │
   │ [○] Observações      │
   └──────────────────────┘
        ↓
   User preenche valores → Avança

5. PROJETO
   ┌──────────────────────┐
   │ Projeto              │
   │ [○] Data Início      │
   │ [○] Deadline         │
   │ [○] Responsável      │
   └──────────────────────┘

6. CLIENTE
   ✅ Negócio Fechado!
```

---

## 8. BANCO DE DADOS - CONSIDERAÇÕES

### Com Supabase (Futura Integração)

```sql
-- Tabela principal (compatível com migração atual)
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  status_stage TEXT NOT NULL DEFAULT 'lead',
  completion_percentage INT DEFAULT 0,
  
  -- Prospect (imutável)
  company TEXT NOT NULL,
  segment TEXT,
  city TEXT,
  state TEXT,
  origin TEXT,
  first_contact_date TIMESTAMPTZ,
  
  -- Qualification (JSON para flexibilidade)
  qualification JSONB DEFAULT '{}'::jsonb,
  
  -- Opportunity (JSON)
  opportunity JSONB DEFAULT '{}'::jsonb,
  
  -- Communication
  communication JSONB DEFAULT '{}'::jsonb,
  
  -- Journey tracking
  stages JSONB DEFAULT '[]'::jsonb,
  stage_completion JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Relationships
  proposal_ids TEXT[] DEFAULT '{}',
  project_ids TEXT[] DEFAULT '{}'
);

-- Index para queries comuns
CREATE INDEX idx_leads_stage ON leads(status_stage);
CREATE INDEX idx_leads_completion ON leads(completion_percentage);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
```

---

## 9. AUTOMAÇÃO FUTURA (Roadmap)

```
🔄 Auto-Advance Rules
   if lead.qualification.contact_name != null
   and lead.qualification.email != null
   → suggest stage advance

🔔 Notifications
   when stage changes
   → notify via email/push

📅 Calendar Integration
   when meeting_scheduled
   → create calendar event
   → send calendar invite

🤖 AI Suggestions
   → "Based on timeline, ready to propose?"
   → "This lead spent 5 days in qual, avg is 3"
   → "Similar leads close in 3 weeks, this is week 2"

📊 Pipeline Analytics
   → Stage conversion rates
   → Average duration per stage
   → Revenue forecast
   → Bottleneck detection
```

---

## 10. RESUMO EXECUTIVO

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Estrutura** | Campos misturados | Separado por estágio |
| **Fluxo** | Liner sem etapas | Pipeline claro com 6 estágios |
| **Preenchimento** | Tudo na criação | Progressivo conforme necessário |
| **Visualização** | Sem contexto | Timeline clara do progresso |
| **Automação** | Não | Pronto para implementar |
| **Escalabilidade** | Limitada | Escalável (novos estágios) |

---

## 11. PRÓXIMOS PASSOS

1. ✅ **Validar proposta** (você aprova este design?)
2. ⏳ **Refatorar types** em `store.ts`
3. ⏳ **Implementar UI progressiva**
4. ⏳ **Testar jornada completa**
5. ⏳ **Documentar para futura automação**
